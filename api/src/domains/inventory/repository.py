from collections.abc import Sequence
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.domains.inventory.model import (
    Pallet,
    PalletStatus,
    PickList,
    PickRecord,
    SlotAllocation,
)
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

    async def list_by_client(self, client_id: UUID) -> Sequence[Pallet]:
        stmt = (
            select(Pallet)
            .where(Pallet.client_id == client_id)
            .options(
                selectinload(Pallet.allocations).selectinload(SlotAllocation.slot),
            )
            .order_by(Pallet.created_at)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def list_stored_by_client_with_locations(
        self, client_id: UUID
    ) -> Sequence[Pallet]:
        stmt = (
            select(Pallet)
            .where(Pallet.client_id == client_id, Pallet.status == PalletStatus.STORED)
            .options(
                selectinload(Pallet.allocations)
                .selectinload(SlotAllocation.slot)
                .selectinload(Slot.rack)
                .selectinload(Rack.chamber),
            )
            .order_by(Pallet.product_name, Pallet.batch_code, Pallet.expiry_date)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def list_all_stored_with_locations(self) -> Sequence[Pallet]:
        stmt = (
            select(Pallet)
            .where(Pallet.status == PalletStatus.STORED)
            .options(
                selectinload(Pallet.allocations)
                .selectinload(SlotAllocation.slot)
                .selectinload(Slot.rack)
                .selectinload(Rack.chamber),
            )
            .order_by(Pallet.client_id, Pallet.product_name, Pallet.batch_code)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def list_stored_for_picking(
        self, client_id: UUID, product_name: str
    ) -> Sequence[Pallet]:
        stmt = (
            select(Pallet)
            .where(
                Pallet.client_id == client_id,
                Pallet.status == PalletStatus.STORED,
                Pallet.product_name == product_name,
            )
            .options(
                selectinload(Pallet.allocations)
                .selectinload(SlotAllocation.slot)
                .selectinload(Slot.rack)
                .selectinload(Rack.chamber),
            )
            .order_by(Pallet.expiry_date, Pallet.is_partial.desc(), Pallet.created_at)
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


class PickListRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db: AsyncSession = db

    async def get_by_id(self, pick_list_id: UUID) -> PickList | None:
        stmt = select(PickList).where(PickList.id == pick_list_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_outbound_order(self, order_id: UUID) -> PickList | None:
        stmt = select(PickList).where(PickList.outbound_order_id == order_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, pick_list: PickList) -> PickList:
        self.db.add(pick_list)
        await self.db.flush()
        await self.db.refresh(pick_list)
        return pick_list

    async def has_for_outbound_order(self, order_id: UUID) -> bool:
        stmt = select(PickList).where(PickList.outbound_order_id == order_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none() is not None


class PickRecordRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db: AsyncSession = db

    async def list_by_pick_list(self, pick_list_id: UUID) -> Sequence[PickRecord]:
        stmt = (
            select(PickRecord)
            .where(PickRecord.pick_list_id == pick_list_id)
            .options(
                selectinload(PickRecord.pallet)
                .selectinload(Pallet.allocations)
                .selectinload(SlotAllocation.slot)
                .selectinload(Slot.rack)
                .selectinload(Rack.chamber),
            )
            .order_by(PickRecord.id)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def create_many(self, pick_records: list[PickRecord]) -> list[PickRecord]:
        self.db.add_all(pick_records)
        await self.db.flush()
        for record in pick_records:
            await self.db.refresh(record)
        return pick_records

    async def mark_picked(self, record_ids: list[UUID]) -> None:
        stmt = (
            update(PickRecord)
            .where(PickRecord.id.in_(record_ids))
            .values(picked=True, picked_at=datetime.now(UTC))
        )
        await self.db.execute(stmt)
        await self.db.flush()
