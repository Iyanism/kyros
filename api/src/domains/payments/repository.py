from __future__ import annotations

from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.domains.invoicing.model import Invoice
from src.domains.payments.model import Payment


class PaymentRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, payment: Payment) -> Payment:
        self.db.add(payment)
        await self.db.flush()
        await self.db.refresh(payment)
        stmt = (
            select(Payment)
            .where(Payment.id == payment.id)
            .options(
                selectinload(Payment.invoice).selectinload(Invoice.client),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def get_by_id(self, payment_id: UUID) -> Payment | None:
        stmt = (
            select(Payment)
            .where(Payment.id == payment_id)
            .options(
                selectinload(Payment.invoice).selectinload(Invoice.client),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_razorpay_order(
        self, razorpay_order_id: str
    ) -> Payment | None:
        stmt = select(Payment).where(
            Payment.razorpay_order_id == razorpay_order_id
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_invoice(self, invoice_id: UUID) -> Payment | None:
        stmt = (
            select(Payment)
            .where(Payment.invoice_id == invoice_id)
            .options(
                selectinload(Payment.invoice).selectinload(Invoice.client),
            )
            .order_by(Payment.created_at.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(self) -> Sequence[Payment]:
        stmt = (
            select(Payment)
            .options(
                selectinload(Payment.invoice).selectinload(Invoice.client),
            )
            .order_by(Payment.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def list_by_client(self, client_id: UUID) -> Sequence[Payment]:
        stmt = (
            select(Payment)
            .join(Invoice, Payment.invoice_id == Invoice.id)
            .where(Invoice.client_id == client_id)
            .options(
                selectinload(Payment.invoice).selectinload(Invoice.client),
            )
            .order_by(Payment.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def next_receipt_number(self, year: int) -> str:
        prefix = f"RCP-{year}-"
        stmt = (
            select(Payment.receipt_number)
            .where(Payment.receipt_number.like(f"{prefix}%"))
            .order_by(Payment.receipt_number.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        last = result.scalar_one_or_none()
        if last:
            seq = int(last.split("-")[-1]) + 1
        else:
            seq = 1
        return f"{prefix}{seq:04d}"
