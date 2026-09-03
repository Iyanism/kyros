from __future__ import annotations

import uuid
from datetime import UTC, datetime
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import UUID, DateTime, Enum, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base

if TYPE_CHECKING:
    from src.domains.clients.model import Client
    from src.domains.inventory.model import PickList


class OutboundOrderStatus(StrEnum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    DISPATCHED = "dispatched"


class OutboundOrder(Base):
    __tablename__: str = "outbound_orders"

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
        index=True,
    )
    total_quantity: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    status: Mapped[OutboundOrderStatus] = mapped_column(
        Enum(OutboundOrderStatus),
        default=OutboundOrderStatus.DRAFT,
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
        back_populates="outbound_orders",
    )

    outbound_items: Mapped[list["OutboundOrderItem"]] = relationship(
        "OutboundOrderItem",
        back_populates="outbound_order",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    pick_list: Mapped["PickList"] = relationship(
        "PickList",
        back_populates="outbound_order",
        passive_deletes=True,
    )


class OutboundOrderItem(Base):
    __tablename__: str = "outbound_order_items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        index=True,
        default=uuid.uuid4,
    )
    outbound_order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("outbound_orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    quantity: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    outbound_order: Mapped["OutboundOrder"] = relationship(
        "OutboundOrder",
        back_populates="outbound_items",
    )
