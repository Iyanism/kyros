import math
from collections.abc import Sequence
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.logger import logger
from src.domains.clients.repository import ClientRepository
from src.domains.inbound_orders.model import (
    InboundOrder,
    InboundOrderItem,
    OrderRequestStatus,
)
from src.domains.inbound_orders.repository import InboundOrderRepository
from src.domains.inventory.model import Pallet, PalletStatus, PickList, PickRecord, SlotAllocation
from src.domains.inventory.repository import (
    PalletRepository,
    PickListRepository,
    PickRecordRepository,
    SlotAllocationRepository,
    SlotReservationRepository,
)
from src.domains.inventory.schema import (
    ClientInventorySummary,
    PalletisationResult,
    PalletItemResponse,
    PalletResponse,
    PickListRequest,
    PickListResponse,
    PickRecordResponse,
    SlotAllocationResponse,
)
from src.domains.outbound_orders.model import OutboundOrderStatus
from src.domains.outbound_orders.repository import OutboundOrderRepository
from src.domains.stock_movements.service import StockService
from src.domains.warehouse.model import Rack, Slot, SlotStatus
from src.utils.units import quantity_to_mt

PALLET_CAPACITY_MT = 1.0


class InventoryOrderNotFoundError(Exception):
    pass


class InventoryConflictError(ValueError):
    pass


class InventoryValidationError(ValueError):
    pass


class InsufficientStockError(ValueError):
    pass


class InventoryService:
    def __init__(self, db: AsyncSession) -> None:
        self.db: AsyncSession = db
        self.client_repo = ClientRepository(db)
        self.inbound_order_repo = InboundOrderRepository(db)
        self.outbound_order_repo = OutboundOrderRepository(db)
        self.pallet_repo = PalletRepository(db)
        self.allocation_repo = SlotAllocationRepository(db)
        self.slot_repo = SlotReservationRepository(db)
        self.pick_list_repo = PickListRepository(db)
        self.pick_record_repo = PickRecordRepository(db)

    async def palletise(self, order_id: UUID) -> PalletisationResult:
        order = await self.inbound_order_repo.get_with_items(order_id)
        if order is None:
            raise InventoryOrderNotFoundError(
                f"no inbound order with order id {order_id} found"
            )

        existing = await self.pallet_repo.list_by_order(order_id)
        if existing:
            raise InventoryConflictError("Order has already been palletised")

        if order.status != OrderRequestStatus.PROCESSING:
            raise InventoryValidationError(
                f"Order must be in status {OrderRequestStatus.PROCESSING.value} "
                f"to be palletised, current status: {order.status.value}"
            )

        pallets = await self._build_pallets(order, order.order_items)
        pallets = await self.pallet_repo.create_many(pallets)

        total_weight = round(sum(p.weight for p in pallets), 4)
        logger.info(
            f"Palletised order {order_id}: {len(pallets)} pallets, {total_weight} MT"
        )
        return PalletisationResult(
            order_id=order_id,
            total_pallets=len(pallets),
            total_weight_mt=total_weight,
            pallets=[PalletResponse.model_validate(p) for p in pallets],
        )

    async def list_pallets(self, order_id: UUID) -> list[PalletResponse]:
        order = await self.inbound_order_repo.get_by_id(order_id)
        if order is None:
            raise InventoryOrderNotFoundError(
                f"no inbound order with order id {order_id} found"
            )
        pallets = await self.pallet_repo.list_by_order(order_id)
        if not pallets:
            raise InventoryOrderNotFoundError(f"No pallets found for order {order_id}")
        return [PalletResponse.model_validate(p) for p in pallets]

    async def reserve_slots(
        self, order_id: UUID, chamber_id: UUID | None = None
    ) -> int:
        order = await self.inbound_order_repo.get_with_items(order_id)
        if order is None:
            raise InventoryOrderNotFoundError(
                f"no inbound order with order id {order_id} found"
            )

        pallet_counts: dict[str, int] = {}
        for item in order.order_items:
            weight_mt = quantity_to_mt(item.quantity)
            pallets_needed = max(1, math.ceil(weight_mt / PALLET_CAPACITY_MT))
            cat = item.temperature_category.value
            pallet_counts[cat] = pallet_counts.get(cat, 0) + pallets_needed

        available = await self.slot_repo.count_available_by_temp(chamber_id)
        for cat_value, needed in pallet_counts.items():
            avail = available.get(cat_value, 0)
            if avail < needed:
                raise InventoryConflictError(
                    f"Insufficient slots for {cat_value}: need {needed}, "
                    f"have {avail} available"
                )

        reserved = 0
        from src.domains.warehouse.model import ChamberCategory

        for cat_str, needed in pallet_counts.items():
            temp_cat = ChamberCategory(cat_str)
            slots = await self.slot_repo.reserve_slots_for_temp(
                temp_cat, needed, order.client_id, chamber_id
            )
            reserved += len(slots)

        logger.info(
            f"Reserved {reserved} slots for order {order_id} "
            f"(client_id={order.client_id})"
        )
        return reserved

    async def release_reservation(self, client_id: UUID) -> int:
        released = await self.slot_repo.release_reserved_for_client(client_id)
        logger.info(f"Released {released} reserved slots for client {client_id}")
        return released

    async def allocate(
        self, order_id: UUID, chamber_id: UUID | None = None, user_id: UUID | None = None
    ) -> list[SlotAllocationResponse]:
        order = await self.inbound_order_repo.get_by_id(order_id)
        if order is None:
            raise InventoryOrderNotFoundError(
                f"no inbound order with order id {order_id} found"
            )

        pallets = await self.pallet_repo.list_by_order(order_id)
        if not pallets:
            raise InventoryConflictError("Order must be palletised before allocation")

        existing_allocations = await self.allocation_repo.list_by_order(order_id)
        if existing_allocations:
            raise InventoryConflictError("Order has already been allocated")

        if order.status != OrderRequestStatus.PROCESSING:
            raise InventoryValidationError(
                f"Order must be in status {OrderRequestStatus.PROCESSING.value} "
                f"to be allocated, current status: {order.status.value}"
            )

        pallet_counts: dict[str, int] = {}
        for p in pallets:
            cat = p.temperature_category
            pallet_counts[cat] = pallet_counts.get(cat, 0) + 1

        reserved = await self.slot_repo.count_reserved_by_client_and_temp(
            order.client_id
        )
        for cat_value, needed in pallet_counts.items():
            avail = reserved.get(cat_value, 0)
            if avail < needed:
                raise InventoryConflictError(
                    f"Insufficient reserved slots for {cat_value}: need {needed}, "
                    f"have {avail} reserved"
                )

        stmt = (
            select(Slot)
            .join(Rack, Slot.rack_id == Rack.id)
            .where(
                Slot.status == SlotStatus.RESERVED,
                Slot.allocated_client_id == order.client_id,
            )
            .options(selectinload(Slot.rack).selectinload(Rack.chamber))
            .with_for_update()
        )
        result = await self.db.execute(stmt)
        reserved_slots = list(result.scalars().all())

        cat_to_slots: dict[str, list[Slot]] = {}
        for slot in reserved_slots:
            cat = slot.rack.chamber.category
            cat_to_slots.setdefault(cat, []).append(slot)

        allocations: list[SlotAllocation] = []
        selected_slot_ids: list[UUID] = []
        for pallet in pallets:
            cat = pallet.temperature_category
            slot = cat_to_slots[cat].pop(0)
            allocations.append(
                SlotAllocation(
                    order_id=order_id,
                    pallet_id=pallet.id,
                    slot_id=slot.id,
                )
            )
            selected_slot_ids.append(slot.id)

        allocated_slots = await self.slot_repo.allocate_reserved_slots(
            order.client_id, selected_slot_ids
        )
        if len(allocated_slots) != len(selected_slot_ids):
            raise InventoryConflictError(
                f"Failed to allocate all reserved slots: "
                f"requested {len(selected_slot_ids)}, allocated {len(allocated_slots)}"
            )

        await self.allocation_repo.create_many(allocations)
        await self.pallet_repo.mark_stored(order_id)
        await self.inbound_order_repo.update_status(order_id, OrderRequestStatus.STORED)

        stock_service = StockService(self.db)
        for pallet, alloc in zip(pallets, allocations):
            await stock_service.record_inbound(
                pallet_id=pallet.id,
                slot_id=alloc.slot_id,
                quantity=pallet.quantity,
                weight_mt=pallet.weight,
                reference_order_id=order_id,
                executed_by_user_id=user_id,
            )

        logger.info(f"Allocated {len(allocations)} pallets for order {order_id}")
        return await self.list_allocations(order_id)

    async def list_allocations(self, order_id: UUID) -> list[SlotAllocationResponse]:
        order = await self.inbound_order_repo.get_by_id(order_id)
        if order is None:
            raise InventoryOrderNotFoundError(
                f"no inbound order with order id {order_id} found"
            )
        allocations = await self.allocation_repo.list_by_order(order_id)
        if not allocations:
            raise InventoryOrderNotFoundError(
                f"No allocations found for order {order_id}"
            )
        responses: list[SlotAllocationResponse] = []
        for allocation in allocations:
            pallet = allocation.pallet
            slot = allocation.slot
            responses.append(
                SlotAllocationResponse(
                    id=allocation.id,
                    order_id=allocation.order_id,
                    pallet_id=allocation.pallet_id,
                    slot_id=allocation.slot_id,
                    pallet_code=pallet.pallet_code,
                    temperature_category=pallet.temperature_category,
                    slot_code=slot.location_code,
                    allocated_at=allocation.allocated_at,
                )
            )
        return responses

    async def list_client_inventory_summary(
        self, client_id: UUID
    ) -> list[ClientInventorySummary]:
        client = await self.client_repo.get_by_id(client_id)
        if client is None:
            raise InventoryOrderNotFoundError(
                f"no client with client id {client_id} found"
            )

        pallets = await self.pallet_repo.list_stored_by_client_with_locations(client_id)
        if not pallets:
            return []

        group: dict[tuple[str, str], dict[str, object]] = {}
        for pallet in pallets:
            key = (pallet.product_name, pallet.batch_code)
            bucket = group.setdefault(
                key,
                {
                    "total_quantity": 0.0,
                    "total_weight_mt": 0.0,
                    "pallet_count": 0,
                    "temperature_category": pallet.temperature_category,
                    "expiry_date": pallet.expiry_date,
                },
            )
            bucket["total_quantity"] = (
                float(str(bucket["total_quantity"])) + pallet.quantity
            )
            bucket["total_weight_mt"] = round(
                float(str(bucket["total_weight_mt"])) + pallet.weight, 4
            )
            bucket["pallet_count"] = int(str(bucket["pallet_count"])) + 1

        return [
            ClientInventorySummary(
                product_name=key[0],
                batch_code=key[1],
                expiry_date=str(bucket["expiry_date"]),
                temperature_category=bucket["temperature_category"],
                total_quantity=round(float(str(bucket["total_quantity"])), 4),
                total_weight_mt=round(float(str(bucket["total_weight_mt"])), 4),
                pallet_count=int(str(bucket["pallet_count"])),
            )
            for key, bucket in group.items()
        ]

    async def list_client_inventory(self, client_id: UUID) -> list[PalletItemResponse]:
        client = await self.client_repo.get_by_id(client_id)
        if client is None:
            raise InventoryOrderNotFoundError(
                f"no client with client id {client_id} found"
            )

        pallets = await self.pallet_repo.list_stored_by_client_with_locations(client_id)
        if not pallets:
            return []

        return [self._pallet_to_item_response(p) for p in pallets]

    async def list_all_inventory(self) -> list[PalletItemResponse]:
        pallets = await self.pallet_repo.list_all_stored_with_locations()
        if not pallets:
            return []

        return [self._pallet_to_item_response(p) for p in pallets]

    async def generate_pick_list(self, request: PickListRequest) -> PickListResponse:
        outbound_order = await self.outbound_order_repo.get_with_items(
            request.outbound_order_id
        )
        if outbound_order is None:
            raise InventoryOrderNotFoundError(
                f"no outbound order with order id {request.outbound_order_id} found"
            )

        if outbound_order.status != OutboundOrderStatus.APPROVED:
            raise InventoryValidationError(
                f"outbound order must be in status 'approved' to generate pick list, "
                f"current status: {outbound_order.status.value}"
            )

        existing = await self.pick_list_repo.get_by_outbound_order(
            request.outbound_order_id
        )
        if existing is not None:
            raise InventoryConflictError(
                f"pick list already exists for outbound order {request.outbound_order_id}"
            )

        pick_records: list[PickRecord] = []
        total_quantity = 0.0
        total_weight_mt = 0.0

        for item in outbound_order.outbound_items:
            pallets = await self.pallet_repo.list_stored_for_picking(
                outbound_order.client_id, item.product_name
            )
            if not pallets:
                raise InsufficientStockError(
                    f"No stored pallets found for product '{item.product_name}' "
                    f"for client {outbound_order.client_id}"
                )

            remaining = item.quantity
            for pallet in pallets:
                if remaining <= 0:
                    break

                if not pallet.allocations:
                    continue

                pick_qty = min(pallet.quantity, remaining)
                pick_weight = (
                    round(pallet.weight * pick_qty / pallet.quantity, 4)
                    if pallet.quantity > 0
                    else 0.0
                )

                pick_records.append(
                    PickRecord(
                        pallet_id=pallet.id,
                        quantity=round(pick_qty, 4),
                        weight=pick_weight,
                    )
                )

                remaining = round(remaining - pick_qty, 4)
                total_quantity += pick_qty
                total_weight_mt += pick_weight

            if remaining > 0:
                raise InsufficientStockError(
                    f"Insufficient stock for '{item.product_name}': "
                    f"requested {item.quantity}, "
                    f"available {round(item.quantity - remaining, 4)}"
                )

        pick_list = PickList(
            outbound_order_id=request.outbound_order_id,
            client_id=outbound_order.client_id,
            total_lines=len(pick_records),
            total_quantity=round(total_quantity, 4),
            total_weight_mt=round(total_weight_mt, 4),
        )
        pick_list = await self.pick_list_repo.create(pick_list)

        for record in pick_records:
            record.pick_list_id = pick_list.id
        pick_records = await self.pick_record_repo.create_many(pick_records)

        logger.info(
            f"Pick list created for outbound order {request.outbound_order_id}: "
            f"{len(pick_records)} records, {total_quantity} qty, {total_weight_mt} MT"
        )
        return await self.get_pick_list(pick_list.id)

    async def get_pick_list(self, pick_list_id: UUID) -> PickListResponse:
        pick_list = await self.pick_list_repo.get_by_id(pick_list_id)
        if pick_list is None:
            raise InventoryOrderNotFoundError(
                f"no pick list with id {pick_list_id} found"
            )
        records = await self.pick_record_repo.list_by_pick_list(pick_list.id)
        return PickListResponse(
            id=pick_list.id,
            outbound_order_id=pick_list.outbound_order_id,
            total_lines=pick_list.total_lines,
            total_quantity=pick_list.total_quantity,
            total_weight_mt=pick_list.total_weight_mt,
            records=[
                PickRecordResponse(
                    id=r.id,
                    pallet_id=r.pallet_id,
                    pallet_code=r.pallet.pallet_code,
                    product_name=r.pallet.product_name or "",
                    batch_code=r.pallet.batch_code,
                    quantity=r.quantity,
                    weight=r.weight,
                    slot_code=r.pallet.allocations[0].slot.location_code
                    if r.pallet.allocations
                    else "",
                    picked=r.picked,
                    picked_at=r.picked_at,
                )
                for r in records
            ],
            created_at=pick_list.created_at,
        )

    async def get_pick_list_by_outbound_order(
        self, outbound_order_id: UUID
    ) -> PickListResponse:
        pick_list = await self.pick_list_repo.get_by_outbound_order(outbound_order_id)
        if pick_list is None:
            raise InventoryOrderNotFoundError(
                f"no pick list for outbound order {outbound_order_id} found"
            )
        return await self.get_pick_list(pick_list.id)

    def _pallet_to_item_response(self, pallet: Pallet) -> PalletItemResponse:
        slot = pallet.allocations[0].slot if pallet.allocations else None
        rack = slot.rack if slot else None
        chamber = rack.chamber if rack else None

        return PalletItemResponse(
            id=pallet.id,
            pallet_code=pallet.pallet_code,
            product_name=pallet.product_name or "",
            batch_code=pallet.batch_code,
            expiry_date=pallet.expiry_date,
            temperature_category=pallet.temperature_category,
            quantity=pallet.quantity,
            weight=pallet.weight,
            is_partial=pallet.is_partial,
            status=pallet.status,
            slot_code=slot.location_code if slot else "",
            chamber_code=chamber.code if chamber else "",
            chamber_name=chamber.name if chamber else "",
            rack_number=rack.rack_number if rack else "",
            created_at=pallet.created_at,
            updated_at=pallet.updated_at,
        )

    async def _build_pallets(
        self, order: InboundOrder, items: Sequence[InboundOrderItem]
    ) -> list[Pallet]:
        sequence_base = await self._next_sequence(order)
        pallets: list[Pallet] = []
        index = 0
        for item in items:
            weight_mt = self._item_weight_mt(item)
            if weight_mt <= 0:
                continue
            full_pallets = math.floor(weight_mt / PALLET_CAPACITY_MT)
            remainder = round(weight_mt - (full_pallets * PALLET_CAPACITY_MT), 4)

            for _ in range(full_pallets):
                pallets.append(
                    Pallet(
                        client_id=order.client_id,
                        order_id=order.id,
                        order_item_id=item.id,
                        pallet_code=self._pallet_code(order, sequence_base + index),
                        product_name=item.product_name,
                        batch_code=item.batch_number,
                        expiry_date=item.expiry_date,
                        temperature_category=item.temperature_category,
                        weight=PALLET_CAPACITY_MT,
                        quantity=round(
                            item.quantity * PALLET_CAPACITY_MT / weight_mt, 4
                        ),
                        is_partial=False,
                        status=PalletStatus.ALLOCATED,
                    )
                )
                index += 1

            if remainder > 0:
                allocated_quantity = round(
                    item.quantity * (weight_mt - remainder) / weight_mt, 4
                )
                pallets.append(
                    Pallet(
                        client_id=order.client_id,
                        order_id=order.id,
                        order_item_id=item.id,
                        pallet_code=self._pallet_code(order, sequence_base + index),
                        product_name=item.product_name,
                        batch_code=item.batch_number,
                        expiry_date=item.expiry_date,
                        temperature_category=item.temperature_category,
                        weight=remainder,
                        quantity=round(item.quantity - allocated_quantity, 4),
                        is_partial=True,
                        status=PalletStatus.ALLOCATED,
                    )
                )
                index += 1

        if not pallets:
            raise InventoryValidationError(
                "Order has no items with a positive quantity to palletise"
            )
        return pallets

    def _item_weight_mt(self, item: InboundOrderItem) -> float:
        return quantity_to_mt(item.quantity)

    async def _next_sequence(self, order: InboundOrder) -> int:
        year = order.created_at.year
        start = datetime(year, 1, 1, tzinfo=timezone.utc)
        end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
        return await self.pallet_repo.count_by_year(start, end)

    def _pallet_code(self, order: InboundOrder, sequence: int) -> str:
        year = order.created_at.year
        return f"PL-{year}-{sequence:04d}"
