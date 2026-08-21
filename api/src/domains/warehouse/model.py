from __future__ import annotations

import uuid
from datetime import UTC, datetime
from enum import StrEnum
from typing import override

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base


class ChamberStatus(StrEnum):
    ACTIVE = "active"
    MAINTENANCE = "maintenance"
    INACTIVE = "inactive"


class ChamberCategory(StrEnum):
    FROZEN = "frozen"
    CHILLED = "chilled"
    AMBIENT = "ambient"


class RackStatus(StrEnum):
    ACTIVE = "active"
    FULL = "full"
    MAINTENANCE = "maintenance"
    INACTIVE = "inactive"


class Chamber(Base):
    __tablename__: str = "chambers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        index=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )
    code: Mapped[str] = mapped_column(
        String(8),
        unique=True,
        nullable=False,
        index=True,
    )
    category: Mapped[ChamberCategory] = mapped_column(
        Enum(ChamberCategory),
        nullable=False,
    )
    temperature: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    status: Mapped[ChamberStatus] = mapped_column(
        Enum(ChamberStatus),
        nullable=False,
        default=ChamberStatus.ACTIVE,
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

    racks: Mapped[list["Rack"]] = relationship(
        back_populates="chamber", cascade="all, delete-orphan"
    )

    @property
    def is_active(self) -> bool:
        return self.status == ChamberStatus.ACTIVE

    # total_capacity / used_capacity are derived: total_slots * 1 MT

    @override
    def __repr__(self) -> str:
        return (
            f"<Chamber(id={self.id}, name={self.name}, "
            f"code={self.code}, status={self.status})>"
        )


class Rack(Base):
    __tablename__: str = "racks"
    __table_args__ = (
        UniqueConstraint("chamber_id", "rack_number", name="unique_chamber_rack"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        index=True,
        default=uuid.uuid4,
    )
    chamber_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("chambers.id", ondelete="CASCADE"),
        nullable=False,
    )
    rack_number: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )
    status: Mapped[RackStatus] = mapped_column(
        Enum(RackStatus),
        nullable=False,
        default=RackStatus.ACTIVE,
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

    chamber: Mapped[Chamber] = relationship(back_populates="racks")
    slots: Mapped[list["Slot"]] = relationship(
        back_populates="rack", cascade="all, delete-orphan"
    )

    @hybrid_property
    def full_code(self) -> str:
        # Computed, not stored: e.g. CH1-R02
        code = self.chamber.code if self.chamber else str(self.chamber_id)
        return f"{code}-{self.rack_number}"

    @override
    def __repr__(self) -> str:
        return (
            f"<Rack(id={self.id}, chamber_id={self.chamber_id}, "
            f"rack_number={self.rack_number}, status={self.status})>"
        )


class Slot(Base):
    __tablename__: str = "slots"
    __table_args__ = (
        UniqueConstraint("rack_id", "slot_number", name="unique_rack_slot"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        index=True,
        default=uuid.uuid4,
    )
    rack_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("racks.id", ondelete="CASCADE"),
        nullable=False,
    )
    slot_number: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )
    is_occupied: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
    allocated_client_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="SET NULL"),
        nullable=True,
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

    rack: Mapped[Rack] = relationship(back_populates="slots")

    @hybrid_property
    def full_code(self) -> str:
        # Computed address, not stored: e.g. CH1-R02-S45
        # Avoids duplication and rename cascades.
        if self.rack and self.rack.chamber:
            return (
                f"{self.rack.chamber.code}-{self.rack.rack_number}-{self.slot_number}"
            )
        if self.rack:
            return f"{self.rack.rack_number}-{self.slot_number}"
        return str(self.slot_number)

    @override
    def __repr__(self) -> str:
        return (
            f"<Slot(id={self.id}, rack_id={self.rack_id}, "
            f"slot_number={self.slot_number}, is_occupied={self.is_occupied})>"
        )
