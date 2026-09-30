from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing_extensions import Mapping

from src.domains.outbound_orders.model import (
    OutboundOrder,
    OutboundOrderItem,
    OutboundOrderStatus,
)


class OutboundOrderRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db: AsyncSession = db

    async def get_by_id(self, order_id: UUID) -> OutboundOrder | None:
        return await self.db.get(OutboundOrder, order_id)

    async def get_with_items(self, order_id: UUID) -> OutboundOrder | None:
        stmt = (
            select(OutboundOrder)
            .where(OutboundOrder.id == order_id)
            .options(
                selectinload(OutboundOrder.outbound_items),
                selectinload(OutboundOrder.client),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, order_data: OutboundOrder) -> OutboundOrder:
        self.db.add(order_data)
        await self.db.flush()
        await self.db.refresh(order_data)
        return order_data

    async def list_all(self) -> Sequence[OutboundOrder]:
        stmt = (
            select(OutboundOrder)
            .options(
                selectinload(OutboundOrder.outbound_items),
                selectinload(OutboundOrder.client),
            )
            .order_by(OutboundOrder.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def list_by_client(self, client_id: UUID) -> Sequence[OutboundOrder]:
        stmt = (
            select(OutboundOrder)
            .where(OutboundOrder.client_id == client_id)
            .options(
                selectinload(OutboundOrder.outbound_items),
                selectinload(OutboundOrder.client),
            )
            .order_by(OutboundOrder.created_at.desc())
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
        self, order_id: UUID, update_data: Mapping[str, UUID | str | int | float]
    ) -> OutboundOrder | None:
        order = await self.get_with_items(order_id)
        if order is None:
            return None

        for field, value in update_data.items():
            setattr(order, field, value)

        await self.db.flush()
        await self.db.refresh(order)
        await self.db.refresh(order, ["client"])

        return order

    async def update_status(
        self, order_id: UUID, status: OutboundOrderStatus
    ) -> OutboundOrder | None:
        order = await self.get_with_items(order_id)
        if order is None:
            return None

        order.status = status
        await self.db.flush()
        await self.db.refresh(order)
        await self.db.refresh(order, ["client"])

        return order


class OutboundOrderItemRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db: AsyncSession = db

    async def create_many(
        self, items: list[OutboundOrderItem]
    ) -> list[OutboundOrderItem]:
        self.db.add_all(items)
        await self.db.flush()
        for item in items:
            await self.db.refresh(item)
        return items

    async def list_by_order(self, order_id: UUID) -> Sequence[OutboundOrderItem]:
        stmt = (
            select(OutboundOrderItem)
            .where(OutboundOrderItem.outbound_order_id == order_id)
            .order_by(OutboundOrderItem.id)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()
