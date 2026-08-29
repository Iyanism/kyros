from __future__ import annotations

import uuid
from datetime import UTC, datetime
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import UUID, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base

if TYPE_CHECKING:
    from src.domains.clients.model import Client

from src.domains.warehouse.model import ChamberCategory


class UnitCategory(StrEnum):
    KG = "kg"
    LB = "lb"
    G = "g"
    OC = "oc"


class OrderRequestStatus(StrEnum):
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    IN_TRANSIT = "in_transit"
    ARRIVED = "arrived"
    PROCESSING = "processing"
    STORED = "stored"


class InboundOrder(Base):
    __tablename__: str = "inbound_orders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        index=True,
        default=uuid.uuid4,
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
    )
    vehicle_number: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    total_quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    status: Mapped[OrderRequestStatus] = mapped_column(
        Enum(OrderRequestStatus),
        default=OrderRequestStatus.SUBMITTED,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    client: Mapped["Client"] = relationship(
        "Client",
        back_populates="inbound_orders",
    )

    order_items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="order",
        passive_deletes=True,
    )


class OrderItem(Base):
    __tablename__: str = "order_items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        index=True,
        default=uuid.uuid4,
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("inbound_orders.id", ondelete="CASCADE"),
        nullable=False,
    )
    product_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    unit: Mapped[UnitCategory] = mapped_column(
        Enum(UnitCategory),
        nullable=False,
    )
    temperature_category: Mapped[ChamberCategory] = mapped_column(
        Enum(ChamberCategory),
        nullable=False,
    )
    batch_number: Mapped[str] = mapped_column(
        String(255),
        nullable=True,
    )
    expiry_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    order: Mapped["InboundOrder"] = relationship(
        "InboundOrder",
        back_populates="order_items",
    )
