from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing_extensions import Mapping

from src.domains.warehouse.model import Chamber, Rack, Slot, SlotStatus


class ChamberRepository:
    _VALID_FIELDS = {col.name for col in Chamber.__table__.columns}

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, chamber_id: UUID) -> Chamber | None:
        return await self.db.get(Chamber, chamber_id)

    async def get_with_details(self, chamber_id: UUID) -> Chamber | None:
        stmt = (
            select(Chamber)
            .where(Chamber.id == chamber_id)
            .options(selectinload(Chamber.racks).selectinload(Rack.slots))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_chamber_code(self, chamber_code: str) -> Chamber | None:
        stmt = select(Chamber).where(Chamber.code == chamber_code)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, chamber_data: Chamber) -> Chamber:
        self.db.add(chamber_data)
        await self.db.flush()
        await self.db.refresh(chamber_data)
        return chamber_data

    async def list_all(self) -> Sequence[Chamber]:
        stmt = select(Chamber).order_by(Chamber.created_at)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def delete(self, chamber_id: UUID) -> bool:
        chamber = await self.get_by_id(chamber_id)
        if chamber is None:
            return False
        await self.db.delete(chamber)
        await self.db.flush()
        return True

    async def delete_by_id(self, chamber_id: UUID) -> bool:
        chamber = await self.get_by_id(chamber_id)
        if chamber is None:
            return False
        await self.db.delete(chamber)
        await self.db.flush()
        return True

    async def update(
        self, chamber_id: UUID, update_data: Mapping[str, UUID | str | int]
    ) -> Chamber | None:
        chamber = await self.get_by_id(chamber_id)
        if chamber is None:
            return None
        for field, value in update_data.items():
            if field not in self._VALID_FIELDS:
                continue
            setattr(chamber, field, value)

        await self.db.flush()
        await self.db.refresh(chamber)

        return chamber


class RackRepository:
    _VALID_FIELDS = {col.name for col in Rack.__table__.columns}

    def __init__(self, db: AsyncSession) -> None:
        self.db: AsyncSession = db

    async def get_by_id(self, rack_id: UUID) -> Rack | None:
        return await self.db.get(Rack, rack_id)

    async def get_with_slots(self, rack_id: UUID) -> Rack | None:
        stmt = (
            select(Rack)
            .where(Rack.id == rack_id)
            .options(selectinload(Rack.slots), selectinload(Rack.chamber))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_with_chamber(self, rack_id: UUID) -> Rack | None:
        stmt = (
            select(Rack).where(Rack.id == rack_id).options(selectinload(Rack.chamber))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_rack_number(
        self, chamber_id: UUID, rack_number: str
    ) -> Rack | None:
        stmt = select(Rack).where(
            Rack.chamber_id == chamber_id, Rack.rack_number == rack_number
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, rack_data: Rack) -> Rack:
        self.db.add(rack_data)
        await self.db.flush()
        await self.db.refresh(rack_data)
        return rack_data

    async def list_by_chamber(self, chamber_id: UUID) -> Sequence[Rack]:
        stmt = (
            select(Rack).where(Rack.chamber_id == chamber_id).order_by(Rack.created_at)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def list_by_chamber_with_details(self, chamber_id: UUID) -> Sequence[Rack]:
        stmt = (
            select(Rack)
            .where(Rack.chamber_id == chamber_id)
            .options(selectinload(Rack.slots), selectinload(Rack.chamber))
            .order_by(Rack.created_at)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def count_by_chamber(self, chamber_id: UUID) -> int:
        stmt = (
            select(func.count()).select_from(Rack).where(Rack.chamber_id == chamber_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def delete(self, rack_id: UUID) -> bool:
        rack = await self.get_by_id(rack_id)
        if rack is None:
            return False
        await self.db.delete(rack)
        await self.db.flush()
        return True

    async def delete_by_id(self, rack_id: UUID) -> bool:
        rack = await self.get_by_id(rack_id)
        if rack is None:
            return False
        await self.db.delete(rack)
        await self.db.flush()
        return True

    async def update(
        self, rack_id: UUID, update_data: Mapping[str, UUID | str | int]
    ) -> Rack | None:
        rack = await self.get_by_id(rack_id)
        if rack is None:
            return None
        for field, value in update_data.items():
            if field not in self._VALID_FIELDS:
                continue
            setattr(rack, field, value)

        await self.db.flush()
        await self.db.refresh(rack)

        return rack


class SlotRepository:
    _VALID_FIELDS = {col.name for col in Slot.__table__.columns}

    def __init__(self, db: AsyncSession) -> None:
        self.db: AsyncSession = db

    async def get_by_id(self, slot_id: UUID) -> Slot | None:
        return await self.db.get(Slot, slot_id)

    async def get_with_rack(self, slot_id: UUID) -> Slot | None:
        stmt = (
            select(Slot)
            .where(Slot.id == slot_id)
            .options(selectinload(Slot.rack).selectinload(Rack.chamber))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, slot_data: Slot) -> Slot:
        self.db.add(slot_data)
        await self.db.flush()
        await self.db.refresh(slot_data)
        return slot_data

    async def list_by_rack_with_details(self, rack_id: UUID) -> Sequence[Slot]:
        stmt = (
            select(Slot)
            .where(Slot.rack_id == rack_id)
            .options(selectinload(Slot.rack).selectinload(Rack.chamber))
            .order_by(Slot.created_at)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def delete(self, slot_id: UUID) -> bool:
        slot = await self.get_by_id(slot_id)
        if slot is None:
            return False
        await self.db.delete(slot)
        await self.db.flush()
        return True

    async def delete_by_id(self, slot_id: UUID) -> bool:
        slot = await self.get_by_id(slot_id)
        if slot is None:
            return False
        await self.db.delete(slot)
        await self.db.flush()
        return True

    async def update(
        self, slot_id: UUID, update_data: Mapping[str, UUID | str | int | bool]
    ) -> Slot | None:
        slot = await self.get_by_id(slot_id)
        if slot is None:
            return None
        for field, value in update_data.items():
            if field not in self._VALID_FIELDS:
                continue
            setattr(slot, field, value)

        await self.db.flush()
        await self.db.refresh(slot)

        return slot

    async def count_by_rack(self, rack_id: UUID) -> int:
        stmt = select(func.count()).select_from(Slot).where(Slot.rack_id == rack_id)
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def total_occupied_slots(self, rack_id: UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(Slot)
            .where(Slot.rack_id == rack_id, Slot.status == SlotStatus.OCCUPIED)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def count_by_chamber(self, chamber_id: UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(Slot)
            .join(Rack, Slot.rack_id == Rack.id)
            .where(Rack.chamber_id == chamber_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def count_occupied_by_chamber(self, chamber_id: UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(Slot)
            .join(Rack, Slot.rack_id == Rack.id)
            .where(Rack.chamber_id == chamber_id, Slot.status == SlotStatus.OCCUPIED)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one()
