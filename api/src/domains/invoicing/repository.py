from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.domains.invoicing.model import Invoice, InvoiceLineItem, InvoiceStatus


class InvoiceRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, invoice: Invoice) -> Invoice:
        self.db.add(invoice)
        await self.db.flush()
        await self.db.refresh(invoice)
        return invoice

    async def get_by_id(self, invoice_id: UUID) -> Invoice | None:
        stmt = (
            select(Invoice)
            .where(Invoice.id == invoice_id)
            .options(
                selectinload(Invoice.line_items),
                selectinload(Invoice.client),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_number(self, invoice_number: str) -> Invoice | None:
        stmt = select(Invoice).where(Invoice.invoice_number == invoice_number)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(self) -> Sequence[Invoice]:
        stmt = (
            select(Invoice)
            .options(
                selectinload(Invoice.client),
                selectinload(Invoice.line_items),
            )
            .order_by(Invoice.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def list_by_client(self, client_id: UUID) -> Sequence[Invoice]:
        stmt = (
            select(Invoice)
            .where(Invoice.client_id == client_id)
            .options(
                selectinload(Invoice.client),
                selectinload(Invoice.line_items),
            )
            .order_by(Invoice.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def update_status(
        self, invoice_id: UUID, status: InvoiceStatus
    ) -> Invoice | None:
        invoice = await self.get_by_id(invoice_id)
        if invoice is None:
            return None
        invoice.status = status
        await self.db.flush()
        await self.db.refresh(invoice)
        return invoice

    async def next_invoice_number(self, year: int) -> str:
        prefix = f"INV-{year}-"
        stmt = (
            select(Invoice.invoice_number)
            .where(Invoice.invoice_number.like(f"{prefix}%"))
            .order_by(Invoice.invoice_number.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        last = result.scalar_one_or_none()
        if last:
            seq = int(last.split("-")[-1]) + 1
        else:
            seq = 1
        return f"{prefix}{seq:04d}"

    async def find_existing_invoice(
        self, client_id: UUID, period_start: datetime, period_end: datetime
    ) -> Invoice | None:
        stmt = select(Invoice).where(
            Invoice.client_id == client_id,
            Invoice.billing_period_start == period_start,
            Invoice.billing_period_end == period_end,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()


class InvoiceLineItemRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_many(self, items: list[InvoiceLineItem]) -> list[InvoiceLineItem]:
        self.db.add_all(items)
        await self.db.flush()
        for item in items:
            await self.db.refresh(item)
        return items
