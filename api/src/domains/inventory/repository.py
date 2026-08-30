from collections.abc import Sequence
from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.domains.inventory.model import Pallet, PalletStatus, SlotAllocation
from src.domains.warehouse.model import Rack, Slot


class PalletRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db: AsyncSession = db

    async def get_by_id(self, pallet_id: UUID) -> Pallet | None:
        return await self.db.get(Pallet, pallet_id)

    async def list_by_order(self, order_id: UUID) -> Sequence[Pallet]:
        stmt = (
            select(Pallet)
            .where(Pallet.order_id == order_id)
            .order_by(Pallet.created_at)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def create_many(self, pallets: list[Pallet]) -> list[Pallet]:
        self.db.add_all(pallets)
        await self.db.flush()
        for pallet in pallets:
            await self.db.refresh(pallet)
        return pallets

    async def count_by_year(self, year_start: datetime, year_end: datetime) -> int:
        stmt = (
            select(func.count())
            .select_from(Pallet)
            .where(Pallet.created_at >= year_start, Pallet.created_at < year_end)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def mark_stored(self, order_id: UUID) -> None:
        stmt = select(Pallet).where(
            Pallet.order_id == order_id, Pallet.status != PalletStatus.STORED
        )
        result = await self.db.execute(stmt)
        pallets = result.scalars().all()
        for pallet in pallets:
            pallet.status = PalletStatus.STORED
        await self.db.flush()


class SlotAllocationRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db: AsyncSession = db

    async def create_many(
        self, allocations: list[SlotAllocation]
    ) -> list[SlotAllocation]:
        self.db.add_all(allocations)
        await self.db.flush()
        for allocation in allocations:
            await self.db.refresh(allocation)
        return allocations

    async def list_by_order(self, order_id: UUID) -> Sequence[SlotAllocation]:
        stmt = (
            select(SlotAllocation)
            .where(SlotAllocation.order_id == order_id)
            .options(
                selectinload(SlotAllocation.pallet),
                selectinload(SlotAllocation.slot)
                .selectinload(Slot.rack)
                .selectinload(Rack.chamber),
            )
            .order_by(SlotAllocation.allocated_at)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()
