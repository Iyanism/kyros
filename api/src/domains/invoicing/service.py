from __future__ import annotations

import math
from datetime import UTC, datetime, timedelta
from io import BytesIO
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.logger import logger
from src.domains.clients.repository import ClientRepository
from src.domains.inventory.model import PalletStatus
from src.domains.inventory.repository import PalletRepository
from src.domains.invoicing.model import Invoice, InvoiceLineItem, InvoiceStatus
from src.domains.invoicing.repository import InvoiceLineItemRepository, InvoiceRepository
from src.domains.invoicing.schema import InvoiceDetailResponse, InvoiceLineItemResponse


class InvoiceService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.invoice_repo = InvoiceRepository(db)
        self.line_item_repo = InvoiceLineItemRepository(db)
        self.client_repo = ClientRepository(db)
        self.pallet_repo = PalletRepository(db)

    async def generate_invoice(
        self,
        client_id: UUID,
        period_start: datetime,
        period_end: datetime,
        storage_daily_rate: float | None = None,
        handling_rate: float | None = None,
    ) -> Invoice:
        storage_rate = storage_daily_rate or settings.STORAGE_DAILY_RATE_MT
        h_rate = handling_rate or settings.HANDLING_RATE_MT

        client = await self.client_repo.get_by_id(client_id)
        if client is None:
            raise ValueError(f"Client {client_id} not found")

        existing = await self.invoice_repo.find_existing_invoice(
            client_id, period_start, period_end
        )
        if existing:
            raise ValueError(
                f"Invoice already exists for period {period_start.date()} to "
                f"{period_end.date()}: {existing.invoice_number}"
            )

        pallets = await self.pallet_repo.list_by_client(client_id)
        stored_pallets = [
            p
            for p in pallets
            if p.status in (PalletStatus.ALLOCATED, PalletStatus.STORED)
        ]

        now = datetime.now(UTC)
        line_items: list[InvoiceLineItem] = []
        subtotal = 0.0

        for pallet in stored_pallets:
            weight_mt = round(pallet.weight / 1000, 4)
            if weight_mt <= 0:
                continue

            allocation = next(
                (a for a in pallet.allocations if a.is_active), None
            )
            if allocation is None:
                continue

            storage_start = max(allocation.allocated_at, period_start)
            storage_end = min(now, period_end)
            if storage_end <= storage_start:
                continue

            days = max(1, math.ceil((storage_end - storage_start).total_seconds() / 86400))
            storage_amount = round(weight_mt * days * storage_rate, 2)
            subtotal += storage_amount

            line_items.append(
                InvoiceLineItem(
                    invoice_id=UUID(int=0),
                    description=(
                        f"Storage: {pallet.product_name or pallet.pallet_code} "
                        f"({days} days @ ₹{storage_rate:.0f}/MT-day)"
                    ),
                    quantity=weight_mt * days,
                    unit="MT-day",
                    unit_rate_snapshot=storage_rate,
                    total_price=storage_amount,
                )
            )

        for pallet in stored_pallets:
            weight_mt = round(pallet.weight / 1000, 4)
            if weight_mt <= 0:
                continue

            handling_amount = round(weight_mt * h_rate, 2)
            subtotal += handling_amount

            line_items.append(
                InvoiceLineItem(
                    invoice_id=UUID(int=0),
                    description=(
                        f"Handling Inbound: {pallet.product_name or pallet.pallet_code} "
                        f"({weight_mt} MT)"
                    ),
                    quantity=weight_mt,
                    unit="MT",
                    unit_rate_snapshot=h_rate,
                    total_price=handling_amount,
                )
            )

        if not line_items:
            raise ValueError("No billable items found for this client in the given period")

        subtotal = round(subtotal, 2)

        same_state = (
            client.state.strip().lower()
            == settings.FACILITY_STATE.strip().lower()
        )

        if same_state:
            cgst_rate = settings.CGST_RATE
            sgst_rate = settings.SGST_RATE
            cgst_amount = round(subtotal * cgst_rate / 100, 2)
            sgst_amount = round(subtotal * sgst_rate / 100, 2)
            tax_amount = round(cgst_amount + sgst_amount, 2)
            igst_rate = None
            igst_amount = None
        else:
            igst_rate = settings.IGST_RATE
            igst_amount = round(subtotal * igst_rate / 100, 2)
            tax_amount = igst_amount
            cgst_rate = None
            cgst_amount = None
            sgst_rate = None
            sgst_amount = None

        total_amount = round(subtotal + tax_amount, 2)
        invoice_number = await self.invoice_repo.next_invoice_number(
            period_start.year
        )
        due_date = period_end + timedelta(days=30)

        invoice = Invoice(
            client_id=client_id,
            invoice_number=invoice_number,
            status=InvoiceStatus.DRAFT,
            billing_period_start=period_start,
            billing_period_end=period_end,
            subtotal=subtotal,
            cgst_rate=cgst_rate,
            cgst_amount=cgst_amount,
            sgst_rate=sgst_rate,
            sgst_amount=sgst_amount,
            igst_rate=igst_rate,
            igst_amount=igst_amount,
            tax_amount=tax_amount,
            total_amount=total_amount,
            due_date=due_date,
        )
        invoice = await self.invoice_repo.create(invoice)

        for li in line_items:
            li.invoice_id = invoice.id
        await self.line_item_repo.create_many(line_items)

        logger.info(
            f"Invoice {invoice_number} generated for client {client_id}: "
            f"₹{total_amount:.2f} ({len(line_items)} line items)"
        )
        return invoice

    async def get_invoice(self, invoice_id: UUID) -> InvoiceDetailResponse:
        invoice = await self.invoice_repo.get_by_id(invoice_id)
        if invoice is None:
            raise ValueError(f"Invoice {invoice_id} not found")
        return self._to_detail_response(invoice)

    async def list_invoices(self) -> list[InvoiceDetailResponse]:
        invoices = await self.invoice_repo.list_all()
        return [self._to_detail_response(inv) for inv in invoices]

    async def list_invoices_by_client(
        self, client_id: UUID
    ) -> list[InvoiceDetailResponse]:
        invoices = await self.invoice_repo.list_by_client(client_id)
        return [self._to_detail_response(inv) for inv in invoices]

    async def update_status(
        self, invoice_id: UUID, status: InvoiceStatus
    ) -> InvoiceDetailResponse:
        invoice = await self.invoice_repo.update_status(invoice_id, status)
        if invoice is None:
            raise ValueError(f"Invoice {invoice_id} not found")
        return self._to_detail_response(invoice)

    def _to_detail_response(self, invoice: Invoice) -> InvoiceDetailResponse:
        client = invoice.client
        return InvoiceDetailResponse(
            id=invoice.id,
            client_id=invoice.client_id,
            invoice_number=invoice.invoice_number,
            status=invoice.status,
            billing_period_start=invoice.billing_period_start,
            billing_period_end=invoice.billing_period_end,
            subtotal=invoice.subtotal,
            cgst_rate=invoice.cgst_rate,
            cgst_amount=invoice.cgst_amount,
            sgst_rate=invoice.sgst_rate,
            sgst_amount=invoice.sgst_amount,
            igst_rate=invoice.igst_rate,
            igst_amount=invoice.igst_amount,
            tax_amount=invoice.tax_amount,
            total_amount=invoice.total_amount,
            amount_paid=invoice.amount_paid,
            due_date=invoice.due_date,
            viewed_at=invoice.viewed_at,
            paid_at=invoice.paid_at,
            created_at=invoice.created_at,
            updated_at=invoice.updated_at,
            line_items=[
                InvoiceLineItemResponse.model_validate(li)
                for li in invoice.line_items
            ],
            client_name=client.name if client else "",
            client_address=client.address if client else "",
            client_gstin=client.gstin if client else None,
            client_state=client.state if client else "",
        )


def build_invoice_pdf(invoice: dict, client: dict) -> bytes:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.platypus import (
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
    )

    def _money(v: float) -> str:
        return f"INR {v:,.2f}"

    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title=f"Invoice {invoice['invoice_number']}",
    )
    styles = getSampleStyleSheet()
    h1 = ParagraphStyle(
        "h1",
        parent=styles["Heading1"],
        fontSize=18,
        spaceAfter=4,
        textColor=colors.HexColor("#0a2540"),
    )
    label = ParagraphStyle(
        "label",
        parent=styles["Normal"],
        fontSize=8,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=2,
    )
    body = ParagraphStyle(
        "body", parent=styles["Normal"], fontSize=10, leading=14
    )

    story = []
    story.append(Paragraph("COLD CHAIN MANAGEMENT — TAX INVOICE", h1))
    story.append(
        Paragraph(
            f"Invoice No <b>{invoice['invoice_number']}</b> &nbsp;&nbsp; "
            f"Date <b>{str(invoice['created_at'])[:10]}</b> &nbsp;&nbsp; "
            f"Period <b>{str(invoice['billing_period_start'])[:10]} to "
            f"{str(invoice['billing_period_end'])[:10]}</b>",
            body,
        )
    )
    story.append(Spacer(1, 8))

    facility = [
        Paragraph("FROM", label),
        Paragraph(f"<b>{settings.FACILITY_NAME}</b>", body),
        Paragraph(settings.FACILITY_ADDRESS, body),
        Paragraph(
            f"GSTIN: {settings.FACILITY_GSTIN} &nbsp;State: "
            f"{settings.FACILITY_STATE}",
            body,
        ),
    ]
    bill_to = [
        Paragraph("BILL TO", label),
        Paragraph(f"<b>{client['name']}</b>", body),
        Paragraph(client.get("address", ""), body),
        Paragraph(
            f"GSTIN: {client.get('gstin', '-')} &nbsp;State: "
            f"{client.get('state', '-')}",
            body,
        ),
    ]
    addr = Table([[facility, bill_to]], colWidths=[85 * mm, 85 * mm])
    addr.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(addr)
    story.append(Spacer(1, 12))

    rows = [["#", "Description", "Qty", "Unit", "Rate", "Amount"]]
    for i, ln in enumerate(invoice["line_items"], start=1):
        rows.append(
            [
                str(i),
                ln["description"],
                f"{ln['quantity']:g}",
                ln["unit"],
                _money(ln["unit_rate_snapshot"]),
                _money(ln["total_price"]),
            ]
        )
    tbl = Table(
        rows,
        colWidths=[10 * mm, 75 * mm, 18 * mm, 18 * mm, 22 * mm, 27 * mm],
    )
    tbl.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    colors.HexColor("#0a2540"),
                ),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("ALIGN", (2, 1), (-1, -1), "RIGHT"),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [colors.white, colors.HexColor("#f1f5f9")],
                ),
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.4,
                    colors.HexColor("#cbd5e1"),
                ),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(tbl)
    story.append(Spacer(1, 10))

    summary = [["Subtotal", _money(invoice["subtotal"])]]
    if invoice.get("igst_amount"):
        summary.append(
            [
                f"IGST @ {invoice.get('igst_rate', 0)}%",
                _money(invoice["igst_amount"]),
            ]
        )
    else:
        if invoice.get("cgst_amount"):
            summary.append(
                [
                    f"CGST @ {invoice.get('cgst_rate', 0)}%",
                    _money(invoice["cgst_amount"]),
                ]
            )
        if invoice.get("sgst_amount"):
            summary.append(
                [
                    f"SGST @ {invoice.get('sgst_rate', 0)}%",
                    _money(invoice["sgst_amount"]),
                ]
            )
    summary.append(["TOTAL", _money(invoice["total_amount"])])

    sum_tbl = Table(summary, colWidths=[140 * mm, 30 * mm])
    sum_tbl.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                (
                    "LINEABOVE",
                    (0, -1),
                    (-1, -1),
                    0.6,
                    colors.HexColor("#0a2540"),
                ),
                ("TOPPADDING", (0, -1), (-1, -1), 6),
            ]
        )
    )
    story.append(sum_tbl)

    story.append(Spacer(1, 12))
    story.append(
        Paragraph(
            f"<b>Due Date:</b> {str(invoice.get('due_date', 'N/A'))[:10] if invoice.get('due_date') else 'N/A'}",
            body,
        )
    )
    story.append(Spacer(1, 8))
    story.append(
        Paragraph(
            "<i>Storage charges are auto-computed based on weight and duration. "
            "Handling charges are billed per MT. "
            "GST is charged as CGST+SGST when the client and facility are in "
            "the same state, otherwise as IGST.</i>",
            label,
        )
    )

    doc.build(story)
    return buf.getvalue()
