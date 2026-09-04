from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger import logger
from src.domains.stock_movements.model import MovementType, StockMovement
from src.domains.stock_movements.repository import StockLevelRepository, StockMovementRepository
from src.domains.stock_movements.schema import StockLevelResponse, StockMovementResponse


class StockService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.movement_repo = StockMovementRepository(db)
        self.level_repo = StockLevelRepository(db)

    async def record_inbound(
        self,
        pallet_id: UUID,
        slot_id: UUID,
        quantity: float,
        weight_mt: float,
        reference_order_id: UUID | None,
        executed_by_user_id: UUID | None,
    ) -> StockMovement:
        movement = StockMovement(
            pallet_id=pallet_id,
            slot_id=slot_id,
            movement_type=MovementType.INBOUND,
            quantity=quantity,
            weight_mt=weight_mt,
            reference_order_id=reference_order_id,
            executed_by_user_id=executed_by_user_id,
        )
        movement = await self.movement_repo.create(movement)
        await self.level_repo.upsert(pallet_id, slot_id, quantity, weight_mt)
        logger.info(
            f"Stock inbound recorded: pallet={pallet_id} slot={slot_id} "
            f"qty={quantity} weight={weight_mt}MT"
        )
        return movement

    async def record_outbound(
        self,
        pallet_id: UUID,
        slot_id: UUID,
        quantity: float,
        weight_mt: float,
        reference_order_id: UUID | None,
        executed_by_user_id: UUID | None,
    ) -> StockMovement:
        movement = StockMovement(
            pallet_id=pallet_id,
            slot_id=slot_id,
            movement_type=MovementType.OUTBOUND,
            quantity=quantity,
            weight_mt=weight_mt,
            reference_order_id=reference_order_id,
            executed_by_user_id=executed_by_user_id,
        )
        movement = await self.movement_repo.create(movement)
        await self.level_repo.upsert(pallet_id, slot_id, -quantity, -weight_mt)
        logger.info(
            f"Stock outbound recorded: pallet={pallet_id} slot={slot_id} "
            f"qty={quantity} weight={weight_mt}MT"
        )
        return movement

    async def list_levels_by_client(
        self, client_id: UUID
    ) -> list[StockLevelResponse]:
        levels = await self.level_repo.list_by_client(client_id)
        return [self._level_to_response(lv) for lv in levels]

    async def list_levels_all(self) -> list[StockLevelResponse]:
        levels = await self.level_repo.list_all()
        return [self._level_to_response(lv) for lv in levels]

    async def list_movements_by_client(
        self, client_id: UUID
    ) -> list[StockMovementResponse]:
        movements = await self.movement_repo.list_by_client(client_id)
        return [self._movement_to_response(m) for m in movements]

    async def list_movements_by_order(
        self, order_id: UUID
    ) -> list[StockMovementResponse]:
        movements = await self.movement_repo.list_by_order(order_id)
        return [self._movement_to_response(m) for m in movements]

    async def list_movements_all(self) -> list[StockMovementResponse]:
        movements = await self.movement_repo.list_all()
        return [self._movement_to_response(m) for m in movements]

    def _level_to_response(self, level) -> StockLevelResponse:
        pallet = level.pallet
        slot = level.slot
        rack = slot.rack if slot else None
        chamber = rack.chamber if rack else None
        return StockLevelResponse(
            id=level.id,
            pallet_id=level.pallet_id,
            pallet_code=pallet.pallet_code if pallet else "",
            product_name=pallet.product_name or "" if pallet else "",
            batch_code=pallet.batch_code if pallet else "",
            slot_id=level.slot_id,
            slot_code=slot.location_code if slot else "",
            chamber_code=chamber.code if chamber else "",
            temperature_category=pallet.temperature_category if pallet else "frozen",
            quantity=level.quantity,
            weight_mt=level.weight_mt,
            updated_at=level.updated_at,
        )

    def _movement_to_response(self, movement) -> StockMovementResponse:
        pallet = movement.pallet
        slot = movement.slot
        return StockMovementResponse(
            id=movement.id,
            pallet_id=movement.pallet_id,
            pallet_code=pallet.pallet_code if pallet else "",
            product_name=pallet.product_name or "" if pallet else "",
            batch_code=pallet.batch_code if pallet else "",
            slot_id=movement.slot_id,
            slot_code=slot.location_code if slot else "",
            movement_type=movement.movement_type,
            quantity=movement.quantity,
            weight_mt=movement.weight_mt,
            reference_order_id=movement.reference_order_id,
            executed_by_user_id=movement.executed_by_user_id,
            temperature_category=pallet.temperature_category if pallet else "frozen",
            created_at=movement.created_at,
        )
