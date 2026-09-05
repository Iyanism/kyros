from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from src.domains.invoicing.model import InvoiceStatus


class InvoiceLineItemResponse(BaseModel):
    id: UUID
    description: str
    quantity: float
    unit: str
    unit_rate_snapshot: float
    total_price: float
    model_config = ConfigDict(from_attributes=True)


class InvoiceResponse(BaseModel):
    id: UUID
    client_id: UUID
    invoice_number: str
    status: InvoiceStatus
    billing_period_start: datetime
    billing_period_end: datetime
    subtotal: float
    cgst_rate: float | None = None
    cgst_amount: float | None = None
    sgst_rate: float | None = None
    sgst_amount: float | None = None
    igst_rate: float | None = None
    igst_amount: float | None = None
    tax_amount: float
    total_amount: float
    amount_paid: float
    due_date: datetime
    viewed_at: datetime | None = None
    paid_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class InvoiceDetailResponse(InvoiceResponse):
    line_items: list[InvoiceLineItemResponse] = []
    client_name: str = ""
    client_address: str = ""
    client_gstin: str | None = None
    client_state: str = ""


class GenerateInvoiceRequest(BaseModel):
    client_id: UUID
    billing_period_start: datetime
    billing_period_end: datetime
    storage_daily_rate: float = Field(gt=0, default=50.0)
    handling_rate: float = Field(gt=0, default=25.0)


class UpdateInvoiceStatusRequest(BaseModel):
    status: InvoiceStatus
