from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing_extensions import Mapping

from src.domains.inbound_orders.model import (
    InboundOrder,
    InboundOrderItem,
    OrderRequestStatus,
)


class InboundOrderRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db: AsyncSession = db

    async def get_by_id(self, order_id: UUID) -> InboundOrder | None:
        return await self.db.get(InboundOrder, order_id)

    async def get_with_items(self, order_id: UUID) -> InboundOrder | None:
        stmt = (
            select(InboundOrder)
            .where(InboundOrder.id == order_id)
            .options(selectinload(InboundOrder.order_items))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_with_items_and_client(self, order_id: UUID) -> InboundOrder | None:
        stmt = (
            select(InboundOrder)
            .where(InboundOrder.id == order_id)
            .options(
                selectinload(InboundOrder.order_items),
                selectinload(InboundOrder.client),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, order_data: InboundOrder) -> InboundOrder:
        self.db.add(order_data)
        await self.db.flush()
        await self.db.refresh(order_data)
        return order_data

    async def list_all(self) -> Sequence[InboundOrder]:
        stmt = (
            select(InboundOrder)
            .options(selectinload(InboundOrder.order_items))
            .order_by(InboundOrder.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def list_by_client(self, client_id: UUID) -> Sequence[InboundOrder]:
        stmt = (
            select(InboundOrder)
            .where(InboundOrder.client_id == client_id)
            .options(selectinload(InboundOrder.order_items))
            .order_by(InboundOrder.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def list_stored_by_client(self, client_id: UUID) -> Sequence[InboundOrder]:
        stmt = (
            select(InboundOrder)
            .where(
                InboundOrder.client_id == client_id,
                InboundOrder.status == OrderRequestStatus.STORED,
            )
            .options(selectinload(InboundOrder.order_items))
            .order_by(InboundOrder.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def delete(self, order_id: UUID) -> bool:
        order = await self.get_by_id(order_id)
        if order is None:
            return False
        await self.db.delete(order)
        await self.db.flush()
        return True

    async def update(
        self, order_id: UUID, update_data: Mapping[str, UUID | str | int]
    ) -> InboundOrder | None:
        order = await self.get_by_id(order_id)
        if order is None:
            return None

        for field, value in update_data.items():
            setattr(order, field, value)

        await self.db.flush()
        await self.db.refresh(order)

        return order

    async def update_status(
        self, order_id: UUID, status: OrderRequestStatus
    ) -> InboundOrder | None:
        order = await self.get_by_id(order_id)
        if order is None:
            return None

        order.status = status
        await self.db.flush()
        await self.db.refresh(order)

        return order


class OrderItemRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db: AsyncSession = db

    async def create(self, item_data: InboundOrderItem) -> InboundOrderItem:
        self.db.add(item_data)
        await self.db.flush()
        await self.db.refresh(item_data)
        return item_data

    async def create_many(
        self, items: list[InboundOrderItem]
    ) -> list[InboundOrderItem]:
        self.db.add_all(items)
        await self.db.flush()
        for item in items:
            await self.db.refresh(item)
        return items

    async def list_by_order(self, order_id: UUID) -> Sequence[InboundOrderItem]:
        stmt = (
            select(InboundOrderItem)
            .where(InboundOrderItem.order_id == order_id)
            .order_by(InboundOrderItem.id)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()
