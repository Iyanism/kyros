from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from src.domains.stock_movements.model import MovementType
from src.domains.warehouse.model import ChamberCategory


class StockMovementResponse(BaseModel):
    id: UUID
    pallet_id: UUID
    pallet_code: str
    product_name: str
    batch_code: str
    slot_id: UUID
    slot_code: str
    movement_type: MovementType
    quantity: float
    weight_mt: float
    reference_order_id: UUID | None
    executed_by_user_id: UUID | None
    temperature_category: ChamberCategory
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class StockLevelResponse(BaseModel):
    id: UUID
    pallet_id: UUID
    pallet_code: str
    product_name: str
    batch_code: str
    slot_id: UUID
    slot_code: str
    chamber_code: str
    temperature_category: ChamberCategory
    quantity: float
    weight_mt: float
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
