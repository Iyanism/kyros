from __future__ import annotations

from datetime import UTC, datetime
from io import BytesIO
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.logger import logger
from src.domains.invoicing.model import InvoiceStatus
from src.domains.invoicing.repository import InvoiceRepository
from src.domains.payments.mock_razorpay import RazorpayMock
from src.domains.payments.model import Payment, PaymentMethod, PaymentStatus
from src.domains.payments.repository import PaymentRepository
from src.domains.payments.schema import PaymentDetailResponse

razorpay_client = RazorpayMock()


class PaymentService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.payment_repo = PaymentRepository(db)
        self.invoice_repo = InvoiceRepository(db)

    async def create_payment(
        self, invoice_id: UUID, method: PaymentMethod
    ) -> Payment:
        invoice = await self.invoice_repo.get_by_id(invoice_id)
        if invoice is None:
            raise ValueError(f"Invoice {invoice_id} not found")

        if invoice.status not in (InvoiceStatus.SENT, InvoiceStatus.VIEWED):
            raise ValueError(
                f"Invoice must be in SENT or VIEWED status to initiate payment, "
                f"current status: {invoice.status.value}"
            )

        if invoice.amount_paid >= invoice.total_amount:
            raise ValueError("Invoice is already fully paid")

        existing = await self.payment_repo.get_by_invoice(invoice_id)
        if existing and existing.status in (
            PaymentStatus.CREATED,
            PaymentStatus.AUTHORIZED,
        ):
            raise ValueError("A pending payment already exists for this invoice")

        amount_to_pay = round(invoice.total_amount - invoice.amount_paid, 2)
        amount_paise = int(amount_to_pay * 100)

        receipt_number = await self.payment_repo.next_receipt_number(
            datetime.now(UTC).year
        )

        order = await razorpay_client.create_order(
            amount_paise=amount_paise,
            currency="INR",
            receipt=receipt_number,
        )

        payment = Payment(
            invoice_id=invoice_id,
            amount=amount_to_pay,
            currency="INR",
            method=method,
            status=PaymentStatus.CREATED,
            razorpay_order_id=order.id,
            receipt_number=receipt_number,
        )
        payment = await self.payment_repo.create(payment)

        logger.info(
            f"Payment created: {payment.id} for invoice {invoice.invoice_number} "
            f"amount=₹{amount_to_pay:.2f} method={method.value}"
        )
        return payment

    async def confirm_payment(
        self,
        payment_id: UUID,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str,
    ) -> Payment:
        payment = await self.payment_repo.get_by_id(payment_id)
        if payment is None:
            raise ValueError(f"Payment {payment_id} not found")

        if payment.status not in (PaymentStatus.CREATED, PaymentStatus.AUTHORIZED):
            raise ValueError(
                f"Payment cannot be confirmed, current status: {payment.status.value}"
            )

        try:
            verified = await razorpay_client.verify_payment(
                razorpay_order_id=razorpay_order_id,
                razorpay_payment_id=razorpay_payment_id,
                razorpay_signature=razorpay_signature,
            )
        except RuntimeError as e:
            payment.status = PaymentStatus.FAILED
            payment.failure_reason = str(e)
            await self.db.flush()
            raise ValueError(f"Payment verification failed: {e}") from e

        payment.status = PaymentStatus.CAPTURED
        payment.razorpay_payment_id = verified.id
        payment.razorpay_signature = verified.signature
        await self.db.flush()

        invoice = await self.invoice_repo.get_by_id(payment.invoice_id)
        if invoice:
            invoice.amount_paid = round(
                invoice.amount_paid + payment.amount, 2
            )
            if invoice.amount_paid >= invoice.total_amount:
                invoice.status = InvoiceStatus.PAID
                invoice.paid_at = datetime.now(UTC)
            await self.db.flush()

        logger.info(
            f"Payment confirmed: {payment.id} receipt={payment.receipt_number} "
            f"invoice={invoice.invoice_number if invoice else '?'}"
        )
        return payment

    async def get_payment(self, payment_id: UUID) -> PaymentDetailResponse:
        payment = await self.payment_repo.get_by_id(payment_id)
        if payment is None:
            raise ValueError(f"Payment {payment_id} not found")
        return self._to_detail_response(payment)

    async def list_payments(self) -> list[PaymentDetailResponse]:
        payments = await self.payment_repo.list_all()
        return [self._to_detail_response(p) for p in payments]

    async def list_payments_by_client(
        self, client_id: UUID
    ) -> list[PaymentDetailResponse]:
        payments = await self.payment_repo.list_by_client(client_id)
        return [self._to_detail_response(p) for p in payments]

    async def get_payment_by_invoice(
        self, invoice_id: UUID
    ) -> PaymentDetailResponse:
        payment = await self.payment_repo.get_by_invoice(invoice_id)
        if payment is None:
            raise ValueError(f"No payment found for invoice {invoice_id}")
        return self._to_detail_response(payment)

    async def refund_payment(self, payment_id: UUID) -> Payment:
        payment = await self.payment_repo.get_by_id(payment_id)
        if payment is None:
            raise ValueError(f"Payment {payment_id} not found")

        if payment.status != PaymentStatus.CAPTURED:
            raise ValueError(
                f"Only captured payments can be refunded, "
                f"current status: {payment.status.value}"
            )

        amount_paise = int(payment.amount * 100)
        await razorpay_client.create_refund(
            razorpay_payment_id=payment.razorpay_payment_id or "",
            amount_paise=amount_paise,
        )

        payment.status = PaymentStatus.REFUNDED

        invoice = await self.invoice_repo.get_by_id(payment.invoice_id)
        if invoice:
            invoice.amount_paid = round(
                max(0, invoice.amount_paid - payment.amount), 2
            )
            if invoice.amount_paid < invoice.total_amount:
                invoice.status = InvoiceStatus.SENT
                invoice.paid_at = None
            await self.db.flush()

        logger.info(
            f"Payment refunded: {payment.id} amount=₹{payment.amount:.2f}"
        )
        return payment

    def _to_detail_response(self, payment: Payment) -> PaymentDetailResponse:
        invoice = payment.invoice
        return PaymentDetailResponse(
            id=payment.id,
            invoice_id=payment.invoice_id,
            amount=payment.amount,
            currency=payment.currency,
            method=payment.method,
            status=payment.status,
            razorpay_order_id=payment.razorpay_order_id,
            razorpay_payment_id=payment.razorpay_payment_id,
            razorpay_signature=payment.razorpay_signature,
            receipt_number=payment.receipt_number,
            failure_reason=payment.failure_reason,
            created_at=payment.created_at,
            updated_at=payment.updated_at,
            invoice_number=invoice.invoice_number if invoice else "",
            client_name=invoice.client.name if invoice and invoice.client else "",
            client_id=invoice.client_id if invoice else None,
        )


def build_receipt_pdf(payment: dict, invoice: dict, client: dict) -> bytes:
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
        title=f"Receipt {payment.get('receipt_number', '')}",
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
    story.append(Paragraph("COLD CHAIN MANAGEMENT — PAYMENT RECEIPT", h1))
    story.append(
        Paragraph(
            f"Receipt No <b>{payment.get('receipt_number', 'N/A')}</b> &nbsp;&nbsp; "
            f"Date <b>{str(payment.get('created_at', ''))[:10]}</b> &nbsp;&nbsp; "
            f"Invoice <b>{invoice.get('invoice_number', 'N/A')}</b>",
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
        Paragraph("RECEIVED FROM", label),
        Paragraph(f"<b>{client.get('name', '')}</b>", body),
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

    details = [
        ["Description", "Details"],
        ["Invoice Number", invoice.get("invoice_number", "N/A")],
        ["Payment Amount", _money(payment.get("amount", 0))],
        ["Payment Method", payment.get("method", "N/A").upper()],
        ["Razorpay Order ID", payment.get("razorpay_order_id", "N/A")],
        ["Razorpay Payment ID", payment.get("razorpay_payment_id", "N/A")],
        ["Status", payment.get("status", "N/A").upper()],
    ]
    tbl = Table(details, colWidths=[60 * mm, 110 * mm])
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

    summary = [
        ["Total Received", _money(payment.get("amount", 0))],
    ]
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

    story.append(Spacer(1, 16))
    story.append(
        Paragraph(
            "<i>This is a system-generated receipt. "
            "For any queries, please contact our billing department.</i>",
            label,
        )
    )

    doc.build(story)
    return buf.getvalue()
