from __future__ import annotations

from typing import TYPE_CHECKING, override

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.base import Base, TimestampMixin

if TYPE_CHECKING:
    from src.domains.inbound_orders.model import InboundOrder
    from src.domains.invoicing.model import Invoice
    from src.domains.outbound_orders.model import OutboundOrder
    from src.domains.users.model import User


class Client(Base, TimestampMixin):
    __tablename__: str = "clients"

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
    )
    phone_number: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
    )
    address: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    city: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    state: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    pin_code: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    gstin: Mapped[str] = mapped_column(
        String(15),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    users: Mapped[list["User"]] = relationship(
        "User", back_populates="client", cascade="all, delete-orphan"
    )

    inbound_orders: Mapped[list["InboundOrder"]] = relationship(
        "InboundOrder", back_populates="client", passive_deletes=True
    )

    outbound_orders: Mapped[list["OutboundOrder"]] = relationship(
        "OutboundOrder", back_populates="client", passive_deletes=True
    )

    invoices: Mapped[list["Invoice"]] = relationship(
        "Invoice", back_populates="client", passive_deletes=True
    )

    @override
    def __repr__(self) -> str:
        return f"<Client(id={self.id}, name={self.name}, email={self.email})>"
