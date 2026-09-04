from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.domains.stock_movements.model import StockLevel, StockMovement
from src.domains.warehouse.model import Rack, Slot


class StockMovementRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, movement: StockMovement) -> StockMovement:
        self.db.add(movement)
        await self.db.flush()
        await self.db.refresh(movement)
        return movement

    async def list_by_pallet(self, pallet_id: UUID) -> Sequence[StockMovement]:
        stmt = (
            select(StockMovement)
            .where(StockMovement.pallet_id == pallet_id)
            .options(
                selectinload(StockMovement.pallet),
                selectinload(StockMovement.slot)
                .selectinload(Slot.rack)
                .selectinload(Rack.chamber),
            )
            .order_by(StockMovement.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def list_by_order(self, order_id: UUID) -> Sequence[StockMovement]:
        stmt = (
            select(StockMovement)
            .where(StockMovement.reference_order_id == order_id)
            .options(
                selectinload(StockMovement.pallet),
                selectinload(StockMovement.slot)
                .selectinload(Slot.rack)
                .selectinload(Rack.chamber),
            )
            .order_by(StockMovement.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def list_by_client(self, client_id: UUID) -> Sequence[StockMovement]:
        from src.domains.inventory.model import Pallet

        stmt = (
            select(StockMovement)
            .join(Pallet, StockMovement.pallet_id == Pallet.id)
            .where(Pallet.client_id == client_id)
            .options(
                selectinload(StockMovement.pallet),
                selectinload(StockMovement.slot)
                .selectinload(Slot.rack)
                .selectinload(Rack.chamber),
            )
            .order_by(StockMovement.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def list_all(self) -> Sequence[StockMovement]:
        stmt = (
            select(StockMovement)
            .options(
                selectinload(StockMovement.pallet),
                selectinload(StockMovement.slot)
                .selectinload(Slot.rack)
                .selectinload(Rack.chamber),
            )
            .order_by(StockMovement.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()


class StockLevelRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_pallet_and_slot(
        self, pallet_id: UUID, slot_id: UUID
    ) -> StockLevel | None:
        stmt = select(StockLevel).where(
            StockLevel.pallet_id == pallet_id,
            StockLevel.slot_id == slot_id,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def upsert(
        self,
        pallet_id: UUID,
        slot_id: UUID,
        quantity_delta: float,
        weight_mt_delta: float,
    ) -> StockLevel:
        level = await self.get_by_pallet_and_slot(pallet_id, slot_id)
        if level is None:
            level = StockLevel(
                pallet_id=pallet_id,
                slot_id=slot_id,
                quantity=quantity_delta,
                weight_mt=weight_mt_delta,
            )
            self.db.add(level)
        else:
            level.quantity = round(level.quantity + quantity_delta, 4)
            level.weight_mt = round(level.weight_mt + weight_mt_delta, 4)
        await self.db.flush()
        await self.db.refresh(level)
        return level

    async def list_by_client(self, client_id: UUID) -> Sequence[StockLevel]:
        from src.domains.inventory.model import Pallet

        stmt = (
            select(StockLevel)
            .join(Pallet, StockLevel.pallet_id == Pallet.id)
            .where(Pallet.client_id == client_id, StockLevel.quantity > 0)
            .options(
                selectinload(StockLevel.pallet),
                selectinload(StockLevel.slot)
                .selectinload(Slot.rack)
                .selectinload(Rack.chamber),
            )
            .order_by(StockLevel.updated_at.desc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def list_all(self) -> Sequence[StockLevel]:
        stmt = (
            select(StockLevel)
            .where(StockLevel.quantity > 0)
            .options(
                selectinload(StockLevel.pallet),
                selectinload(StockLevel.slot)
                .selectinload(Slot.rack)
                .selectinload(Rack.chamber),
            )
            .order_by(StockLevel.updated_at.desc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def count_by_client(self, client_id: UUID) -> int:
        from src.domains.inventory.model import Pallet

        stmt = (
            select(func.count())
            .select_from(StockLevel)
            .join(Pallet, StockLevel.pallet_id == Pallet.id)
            .where(Pallet.client_id == client_id, StockLevel.quantity > 0)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one()
