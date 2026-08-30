import math
from collections.abc import Sequence
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger import logger
from src.domains.inventory.model import Pallet, PalletStatus, SlotAllocation
from src.domains.inventory.repository import PalletRepository, SlotAllocationRepository
from src.domains.inventory.schema import (
    PalletisationResult,
    PalletResponse,
    SlotAllocationResponse,
)
from src.domains.orders.model import (
    InboundOrder,
    OrderItem,
    OrderRequestStatus,
    UnitCategory,
)
from src.domains.orders.repository import InboundOrderRepository
from src.domains.warehouse.repository import SlotRepository

PALLET_CAPACITY_MT = 1.0

_UNIT_TO_KG = {
    UnitCategory.KG: 1.0,
    UnitCategory.G: 0.001,
    UnitCategory.LB: 0.453592,
    UnitCategory.OC: 0.0283495,
}


class InventoryOrderNotFoundError(Exception):
    pass


class InventoryConflictError(ValueError):
    pass


class InventoryValidationError(ValueError):
    pass


class InventoryService:
    def __init__(self, db: AsyncSession) -> None:
        self.db: AsyncSession = db
        self.order_repo = InboundOrderRepository(db)
        self.pallet_repo = PalletRepository(db)
        self.allocation_repo = SlotAllocationRepository(db)
        self.slot_repo = SlotRepository(db)

    async def palletise(self, order_id: UUID) -> PalletisationResult:
        order = await self.order_repo.get_with_items(order_id)
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
        order = await self.order_repo.get_by_id(order_id)
        if order is None:
            raise InventoryOrderNotFoundError(
                f"no inbound order with order id {order_id} found"
            )
        pallets = await self.pallet_repo.list_by_order(order_id)
        if not pallets:
            raise InventoryOrderNotFoundError(f"No pallets found for order {order_id}")
        return [PalletResponse.model_validate(p) for p in pallets]

    async def allocate(
        self, order_id: UUID, chamber_id: UUID | None = None
    ) -> list[SlotAllocationResponse]:
        order = await self.order_repo.get_by_id(order_id)
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

        slots = await self.slot_repo.list_available_slots(chamber_id)
        if len(slots) < len(pallets):
            raise InventoryConflictError(
                f"Insufficient available slots: {len(pallets)} pallets need "
                f"{len(pallets)} slots but only {len(slots)} are available"
            )

        allocations: list[SlotAllocation] = []
        for pallet, slot in zip(pallets, slots):
            allocations.append(
                SlotAllocation(
                    order_id=order_id,
                    pallet_id=pallet.id,
                    slot_id=slot.id,
                )
            )
            slot.is_occupied = True
            slot.allocated_client_id = order.client_id

        await self.allocation_repo.create_many(allocations)
        await self.pallet_repo.mark_stored(order_id)
        await self.order_repo.update_status(order_id, OrderRequestStatus.STORED)

        logger.info(f"Allocated {len(allocations)} pallets for order {order_id}")
        return await self.list_allocations(order_id)

    async def list_allocations(self, order_id: UUID) -> list[SlotAllocationResponse]:
        order = await self.order_repo.get_by_id(order_id)
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
                    slot_code=slot.full_code,
                    allocated_at=allocation.allocated_at,
                )
            )
        return responses

    async def _build_pallets(
        self, order: InboundOrder, items: Sequence[OrderItem]
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
                        order_id=order.id,
                        pallet_code=self._pallet_code(order, sequence_base + index),
                        temperature_category=item.temperature_category,
                        weight=PALLET_CAPACITY_MT,
                        is_partial=False,
                        status=PalletStatus.ALLOCATED,
                    )
                )
                index += 1

            if remainder > 0:
                pallets.append(
                    Pallet(
                        order_id=order.id,
                        pallet_code=self._pallet_code(order, sequence_base + index),
                        temperature_category=item.temperature_category,
                        weight=remainder,
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

    def _item_weight_mt(self, item: OrderItem) -> float:
        kg = _UNIT_TO_KG[item.unit] * item.quantity
        return round(kg / 1000.0, 4)

    async def _next_sequence(self, order: InboundOrder) -> int:
        year = order.created_at.year
        start = datetime(year, 1, 1, tzinfo=timezone.utc)
        end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
        return await self.pallet_repo.count_by_year(start, end)

    def _pallet_code(self, order: InboundOrder, sequence: int) -> str:
        year = order.created_at.year
        return f"PL-{year}-{sequence:04d}"
