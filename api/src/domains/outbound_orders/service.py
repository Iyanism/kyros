from datetime import UTC, datetime
from typing import Sequence
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger import logger
from src.domains.clients.repository import ClientRepository
from src.domains.inventory.model import PalletStatus
from src.domains.inventory.repository import (
    PalletRepository,
    PickListRepository,
    PickRecordRepository,
    SlotAllocationRepository,
    SlotReservationRepository,
)
from src.domains.stock_movements.service import StockService
from src.domains.outbound_orders.model import (
    OutboundOrder,
    OutboundOrderItem,
    OutboundOrderStatus,
)
from src.domains.outbound_orders.repository import (
    OutboundOrderItemRepository,
    OutboundOrderRepository,
)
from src.domains.outbound_orders.schema import (
    OutboundOrderCreate,
    OutboundOrderItemResponse,
    OutboundOrderResponse,
    OutboundOrderUpdate,
)


class OutboundOrderNotFoundError(Exception):
    pass


class OutboundOrderValidationError(ValueError):
    pass


class OutboundOrderStatusError(ValueError):
    pass


OUTBOUND_ORDER_TRANSITIONS: dict[OutboundOrderStatus, set[OutboundOrderStatus]] = {
    OutboundOrderStatus.DRAFT: {
        OutboundOrderStatus.SUBMITTED,
        OutboundOrderStatus.REJECTED,
    },
    OutboundOrderStatus.SUBMITTED: {
        OutboundOrderStatus.APPROVED,
        OutboundOrderStatus.REJECTED,
    },
    OutboundOrderStatus.APPROVED: {
        OutboundOrderStatus.DISPATCHED,
        OutboundOrderStatus.REJECTED,
    },
    OutboundOrderStatus.REJECTED: set(),
    OutboundOrderStatus.DISPATCHED: set(),
}


class OutboundOrderService:
    def __init__(self, db: AsyncSession) -> None:
        self.db: AsyncSession = db
        self.order_repo = OutboundOrderRepository(db)
        self.item_repo = OutboundOrderItemRepository(db)
        self.client_repo = ClientRepository(db)
        self.pick_list_repo = PickListRepository(db)
        self.pick_record_repo = PickRecordRepository(db)
        self.pallet_repo = PalletRepository(db)
        self.allocation_repo = SlotAllocationRepository(db)
        self.slot_repo = SlotReservationRepository(db)

    async def create(self, order_data: OutboundOrderCreate) -> OutboundOrderResponse:
        client = await self.client_repo.get_by_id(order_data.client_id)
        if client is None:
            raise OutboundOrderNotFoundError(
                f"no client with client id {order_data.client_id} found"
            )

        item_quantity_sum = sum(item.quantity for item in order_data.items)
        if item_quantity_sum != order_data.total_quantity:
            raise OutboundOrderValidationError(
                f"total_quantity {order_data.total_quantity} does not match "
                f"sum of item quantities {item_quantity_sum}"
            )

        order = OutboundOrder(
            client_id=order_data.client_id,
            total_quantity=order_data.total_quantity,
        )

        try:
            order = await self.order_repo.create(order)
            items = [
                OutboundOrderItem(outbound_order_id=order.id, **item.model_dump())
                for item in order_data.items
            ]
            items = await self.item_repo.create_many(items)
        except IntegrityError as e:
            logger.error(
                f"Integrity error creating outbound order for client {order_data.client_id}: {e}"
            )
            raise OutboundOrderValidationError("Failed to create outbound order") from e
        except Exception:
            logger.error(
                f"Database error creating outbound order for client {order_data.client_id}"
            )
            raise

        logger.info(
            f"Outbound order created: id={order.id} client_id={order.client_id} "
            f"items={len(items)}"
        )
        return self._to_response(order, items)

    async def get_by_id(self, order_id: UUID) -> OutboundOrderResponse:
        order = await self.order_repo.get_with_items(order_id)
        if order is None:
            raise OutboundOrderNotFoundError(
                f"no outbound order with order id {order_id} found"
            )
        return self._to_response(order, order.outbound_items)

    async def list_all(self) -> list[OutboundOrderResponse]:
        orders = await self.order_repo.list_all()
        if not orders:
            raise OutboundOrderNotFoundError("No outbound orders found")
        return [self._to_response(order, order.outbound_items) for order in orders]

    async def list_by_client(self, client_id: UUID) -> list[OutboundOrderResponse]:
        client = await self.client_repo.get_by_id(client_id)
        if client is None:
            raise OutboundOrderNotFoundError(
                f"no client with client id {client_id} found"
            )

        orders = await self.order_repo.list_by_client(client_id)
        if not orders:
            raise OutboundOrderNotFoundError(
                f"No outbound orders found for client {client_id}"
            )
        return [self._to_response(order, order.outbound_items) for order in orders]

    async def update(
        self, order_id: UUID, update_data: OutboundOrderUpdate
    ) -> OutboundOrderResponse:
        order = await self.order_repo.update(
            order_id, update_data.model_dump(exclude_unset=True)
        )
        if order is None:
            raise OutboundOrderNotFoundError(
                f"no outbound order with order id {order_id} found"
            )

        items = await self.item_repo.list_by_order(order_id)
        logger.info(f"Outbound order updated: id={order_id}")
        return self._to_response(order, items)

    async def update_status(
        self, order_id: UUID, new_status: OutboundOrderStatus
    ) -> OutboundOrderResponse:
        order = await self.order_repo.get_by_id(order_id)
        if order is None:
            raise OutboundOrderNotFoundError(
                f"no outbound order with order id {order_id} found"
            )

        if order.status == new_status:
            raise OutboundOrderStatusError(
                f"Order is already in status {new_status.value}"
            )

        allowed = OUTBOUND_ORDER_TRANSITIONS.get(order.status, set())
        if new_status not in allowed:
            raise OutboundOrderStatusError(
                f"Cannot transition order from {order.status.value} to "
                f"{new_status.value}, allowed transitions: "
                f"{[s.value for s in allowed] or 'none'}"
            )

        if new_status == OutboundOrderStatus.DISPATCHED:
            await self._execute_dispatch(order_id)

        order = await self.order_repo.update_status(order_id, new_status)
        if order is None:
            raise OutboundOrderNotFoundError(f"Order {order_id} not found after status update")

        items = await self.item_repo.list_by_order(order_id)
        logger.info(
            f"Outbound order status updated: id={order_id} -> {new_status.value}"
        )
        return self._to_response(order, items)

    async def _execute_dispatch(
        self, order_id: UUID, user_id: UUID | None = None
    ) -> None:
        pick_list = await self.pick_list_repo.get_by_outbound_order(order_id)
        if pick_list is None:
            raise OutboundOrderStatusError(
                "Cannot dispatch: no pick list exists for this order. "
                "Generate a pick list first."
            )

        pick_records = await self.pick_record_repo.list_by_pick_list(pick_list.id)
        if not pick_records:
            raise OutboundOrderStatusError(
                "Cannot dispatch: pick list has no records."
            )

        stock_service = StockService(self.db)
        record_ids: list[UUID] = []
        for record in pick_records:
            pallet = record.pallet
            old_quantity = pallet.quantity

            pallet.quantity = round(pallet.quantity - record.quantity, 4)
            pallet.weight = (
                round(pallet.weight * (pallet.quantity / old_quantity), 4)
                if old_quantity > 0
                else 0.0
            )

            slot_id = None
            if pallet.allocations:
                active = [a for a in pallet.allocations if a.is_active]
                if active:
                    slot_id = active[0].slot_id

            if slot_id is not None:
                await stock_service.record_outbound(
                    pallet_id=pallet.id,
                    slot_id=slot_id,
                    quantity=record.quantity,
                    weight_mt=record.weight,
                    reference_order_id=order_id,
                    executed_by_user_id=user_id,
                )

            if pallet.quantity <= 0:
                pallet.quantity = 0.0
                pallet.weight = 0.0
                pallet.status = PalletStatus.DISPATCHED

                for allocation in pallet.allocations:
                    if allocation.is_active:
                        allocation.is_active = False
                        allocation.released_at = datetime.now(UTC)

                        await self.slot_repo.release_occupied_slot(allocation.slot.id)

            record_ids.append(record.id)

        await self.pick_record_repo.mark_picked(record_ids)
        logger.info(
            f"Dispatch executed for order {order_id}: "
            f"{len(record_ids)} pick records processed"
        )

    async def delete(self, order_id: UUID) -> None:
        order = await self.order_repo.get_by_id(order_id)
        if order is None:
            raise OutboundOrderNotFoundError(
                f"no outbound order with order id {order_id} found"
            )

        deleted = await self.order_repo.delete(order_id)
        if not deleted:
            raise OutboundOrderNotFoundError(
                f"no outbound order with order id {order_id} found"
            )

        logger.info(f"Outbound order deleted: id={order_id}")

    def _to_response(
        self, order: OutboundOrder, items: Sequence[OutboundOrderItem]
    ) -> OutboundOrderResponse:
        return OutboundOrderResponse(
            id=order.id,
            client_id=order.client_id,
            total_quantity=order.total_quantity,
            status=order.status,
            items=[OutboundOrderItemResponse.model_validate(item) for item in items],
            created_at=order.created_at,
            updated_at=order.updated_at,
        )
