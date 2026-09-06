from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from src.domains.payments.model import PaymentMethod, PaymentStatus


class CreatePaymentRequest(BaseModel):
    invoice_id: UUID
    method: PaymentMethod


class ConfirmPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class RefundPaymentRequest(BaseModel):
    amount: float | None = None


class PaymentResponse(BaseModel):
    id: UUID
    invoice_id: UUID
    amount: float
    currency: str
    method: PaymentMethod
    status: PaymentStatus
    razorpay_order_id: str
    razorpay_payment_id: str | None = None
    razorpay_signature: str | None = None
    receipt_number: str | None = None
    failure_reason: str | None = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PaymentDetailResponse(PaymentResponse):
    invoice_number: str = ""
    client_name: str = ""
    client_id: UUID | None = None
