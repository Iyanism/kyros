from __future__ import annotations

import uuid
from datetime import UTC, datetime
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import UUID, DateTime, Enum, Float, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base

if TYPE_CHECKING:
    from src.domains.inventory.model import Pallet
    from src.domains.users.model import User
    from src.domains.warehouse.model import Slot


class MovementType(StrEnum):
    INBOUND = "inbound"
    OUTBOUND = "outbound"
    ADJUSTMENT = "adjustment"


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        index=True,
        default=uuid.uuid4,
    )
    pallet_id = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pallets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    slot_id = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("slots.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    movement_type = mapped_column(
        Enum(MovementType),
        nullable=False,
        index=True,
    )
    quantity = mapped_column(Float, nullable=False)
    weight_mt = mapped_column(Float, nullable=False)
    reference_order_id = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    executed_by_user_id = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    pallet: Mapped["Pallet"] = relationship("Pallet")
    slot: Mapped["Slot"] = relationship("Slot")
    executed_by: Mapped["User | None"] = relationship("User")


class StockLevel(Base):
    __tablename__ = "stock_levels"
    __table_args__ = (
        UniqueConstraint("pallet_id", "slot_id", name="uq_stock_level_pallet_slot"),
    )

    id = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        index=True,
        default=uuid.uuid4,
    )
    pallet_id = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pallets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    slot_id = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("slots.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    quantity = mapped_column(Float, nullable=False, default=0.0)
    weight_mt = mapped_column(Float, nullable=False, default=0.0)
    updated_at = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    pallet: Mapped["Pallet"] = relationship("Pallet")
    slot: Mapped["Slot"] = relationship("Slot")
