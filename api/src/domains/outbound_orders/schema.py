from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from src.domains.outbound_orders.model import OutboundOrderStatus


class OutboundOrderItemCreate(BaseModel):
    product_name: str
    quantity: float


class OutboundOrderItemResponse(BaseModel):
    id: UUID
    outbound_order_id: UUID
    product_name: str
    quantity: float

    model_config = ConfigDict(from_attributes=True)


class OutboundOrderCreate(BaseModel):
    client_id: UUID
    total_quantity: float
    items: list[OutboundOrderItemCreate]


class OutboundOrderUpdate(BaseModel):
    total_quantity: float | None = None


class OutboundOrderStatusUpdate(BaseModel):
    status: OutboundOrderStatus


class OutboundOrderResponse(BaseModel):
    id: UUID
    client_id: UUID
    total_quantity: float
    status: OutboundOrderStatus
    items: list[OutboundOrderItemResponse]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
