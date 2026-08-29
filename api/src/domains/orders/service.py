from typing import Sequence
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger import logger
from src.domains.clients.repository import ClientRepository
from src.domains.orders.model import InboundOrder, OrderItem, OrderRequestStatus
from src.domains.orders.repository import InboundOrderRepository, OrderItemRepository
from src.domains.orders.schema import (
    InboundOrderCreate,
    InboundOrderResponse,
    InboundOrderUpdate,
    OrderItemResponse,
)


class InboundOrderNotFoundError(Exception):
    pass


class InboundOrderValidationError(ValueError):
    pass


class InboundOrderStatusError(ValueError):
    pass


INBOUND_ORDER_TRANSITIONS: dict[OrderRequestStatus, set[OrderRequestStatus]] = {
    OrderRequestStatus.SUBMITTED: {
        OrderRequestStatus.APPROVED,
        OrderRequestStatus.REJECTED,
    },
    OrderRequestStatus.APPROVED: {OrderRequestStatus.IN_TRANSIT},
    OrderRequestStatus.IN_TRANSIT: {OrderRequestStatus.ARRIVED},
    OrderRequestStatus.ARRIVED: {OrderRequestStatus.PROCESSING},
    OrderRequestStatus.PROCESSING: {OrderRequestStatus.STORED},
}


class InboundOrderService:
    def __init__(self, db: AsyncSession) -> None:
        self.db: AsyncSession = db
        self.order_repo = InboundOrderRepository(db)
        self.item_repo = OrderItemRepository(db)
        self.client_repo = ClientRepository(db)

    async def create(self, order_data: InboundOrderCreate) -> InboundOrderResponse:
        client = await self.client_repo.get_by_id(order_data.client_id)
        if client is None:
            raise InboundOrderNotFoundError(
                f"no client with client id {order_data.client_id} found"
            )

        item_quantity_sum = sum(item.quantity for item in order_data.items)
        if item_quantity_sum != order_data.total_quantity:
            raise InboundOrderValidationError(
                f"total_quantity {order_data.total_quantity} does not match "
                f"sum of item quantities {item_quantity_sum}"
            )

        order = InboundOrder(
            client_id=order_data.client_id,
            vehicle_number=order_data.vehicle_number,
            total_quantity=order_data.total_quantity,
        )

        try:
            order = await self.order_repo.create(order)
            items = [
                OrderItem(order_id=order.id, **item.model_dump())
                for item in order_data.items
            ]
            items = await self.item_repo.create_many(items)
        except IntegrityError as e:
            logger.error(
                f"Integrity error creating inbound order for client {order_data.client_id}: {e}"
            )
            raise InboundOrderValidationError("Failed to create inbound order") from e
        except Exception:
            logger.error(
                f"Database error creating inbound order for client {order_data.client_id}"
            )
            raise

        logger.info(
            f"Inbound order created: id={order.id} client_id={order.client_id} "
            f"vehicle_number={order.vehicle_number} items={len(items)}"
        )
        return self._to_response(order, items)

    async def get_by_id(self, order_id: UUID) -> InboundOrderResponse:
        order = await self.order_repo.get_with_items(order_id)
        if order is None:
            raise InboundOrderNotFoundError(
                f"no inbound order with order id {order_id} found"
            )
        return self._to_response(order, order.order_items)

    async def list_all(self) -> list[InboundOrderResponse]:
        orders = await self.order_repo.list_all()
        if not orders:
            raise InboundOrderNotFoundError("No inbound orders found")
        return [self._to_response(order, order.order_items) for order in orders]

    async def list_by_client(self, client_id: UUID) -> list[InboundOrderResponse]:
        client = await self.client_repo.get_by_id(client_id)
        if client is None:
            raise InboundOrderNotFoundError(
                f"no client with client id {client_id} found"
            )

        orders = await self.order_repo.list_by_client(client_id)
        if not orders:
            raise InboundOrderNotFoundError(
                f"No inbound orders found for client {client_id}"
            )
        return [self._to_response(order, order.order_items) for order in orders]

    async def update(
        self, order_id: UUID, update_data: InboundOrderUpdate
    ) -> InboundOrderResponse:
        order = await self.order_repo.update(
            order_id, update_data.model_dump(exclude_unset=True)
        )
        if order is None:
            raise InboundOrderNotFoundError(
                f"no inbound order with order id {order_id} found"
            )

        items = await self.item_repo.list_by_order(order_id)
        logger.info(f"Inbound order updated: id={order_id}")
        return self._to_response(order, items)

    async def update_status(
        self, order_id: UUID, new_status: OrderRequestStatus
    ) -> InboundOrderResponse:
        order = await self.order_repo.get_by_id(order_id)
        if order is None:
            raise InboundOrderNotFoundError(
                f"no inbound order with order id {order_id} found"
            )

        if order.status == new_status:
            raise InboundOrderStatusError(
                f"Order is already in status {new_status.value}"
            )

        allowed = INBOUND_ORDER_TRANSITIONS.get(order.status, set())
        if new_status not in allowed:
            raise InboundOrderStatusError(
                f"Cannot transition order from {order.status.value} to "
                f"{new_status.value}, allowed transitions: "
                f"{[s.value for s in allowed] or 'none'}"
            )

        order = await self.order_repo.update_status(order_id, new_status)
        assert order is not None

        items = await self.item_repo.list_by_order(order_id)
        logger.info(
            f"Inbound order status updated: id={order_id} -> {new_status.value}"
        )
        return self._to_response(order, items)

    async def delete(self, order_id: UUID) -> None:
        order = await self.order_repo.get_by_id(order_id)
        if order is None:
            raise InboundOrderNotFoundError(
                f"no inbound order with order id {order_id} found"
            )

        deleted = await self.order_repo.delete(order_id)
        if not deleted:
            raise InboundOrderNotFoundError(
                f"no inbound order with order id {order_id} found"
            )

        logger.info(f"Inbound order deleted: id={order_id}")

    def _to_response(
        self, order: InboundOrder, items: Sequence[OrderItem]
    ) -> InboundOrderResponse:
        return InboundOrderResponse(
            id=order.id,
            client_id=order.client_id,
            vehicle_number=order.vehicle_number,
            total_quantity=order.total_quantity,
            status=order.status,
            items=[OrderItemResponse.model_validate(item) for item in items],
            created_at=order.created_at,
            updated_at=order.updated_at,
        )
