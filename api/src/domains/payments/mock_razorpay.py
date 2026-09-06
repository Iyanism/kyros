"""Mock Razorpay API client.

Simulates Razorpay order creation, payment verification, and refund
without hitting the real Razorpay API. Replace this module with the
actual Razorpay SDK when ready to go live.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass


@dataclass
class RazorpayOrder:
    id: str
    amount: int
    currency: str
    receipt: str
    status: str = "created"


@dataclass
class RazorpayPayment:
    id: str
    order_id: str
    amount: int
    currency: str
    method: str
    status: str = "captured"
    signature: str = ""


class RazorpayMock:
    """Simulates Razorpay API. Always succeeds unless fail=True."""

    def __init__(self, *, fail: bool = False) -> None:
        self._fail = fail
        self._orders: dict[str, RazorpayOrder] = {}
        self._payments: dict[str, RazorpayPayment] = {}

    async def create_order(
        self,
        amount_paise: int,
        currency: str,
        receipt: str,
    ) -> RazorpayOrder:
        if self._fail:
            raise RuntimeError("Mock Razorpay: order creation failed")

        order = RazorpayOrder(
            id=f"order_mock_{uuid.uuid4().hex[:14]}",
            amount=amount_paise,
            currency=currency,
            receipt=receipt,
            status="created",
        )
        self._orders[order.id] = order
        return order

    async def verify_payment(
        self,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str,
    ) -> RazorpayPayment:
        if self._fail:
            raise RuntimeError("Mock Razorpay: payment verification failed")

        order = self._orders.get(razorpay_order_id)
        amount = order.amount if order else 0

        payment = RazorpayPayment(
            id=razorpay_payment_id or f"pay_mock_{uuid.uuid4().hex[:14]}",
            order_id=razorpay_order_id,
            amount=amount,
            currency=order.currency if order else "INR",
            method="upi",
            status="captured",
            signature=razorpay_signature or f"sig_mock_{uuid.uuid4().hex[:14]}",
        )
        self._payments[payment.id] = payment
        return payment

    async def fetch_payment(self, razorpay_payment_id: str) -> RazorpayPayment:
        if self._fail:
            raise RuntimeError("Mock Razorpay: fetch payment failed")

        if razorpay_payment_id in self._payments:
            return self._payments[razorpay_payment_id]

        return RazorpayPayment(
            id=razorpay_payment_id,
            order_id="",
            amount=0,
            currency="INR",
            method="upi",
            status="captured",
        )

    async def create_refund(
        self, razorpay_payment_id: str, amount_paise: int
    ) -> dict:
        if self._fail:
            raise RuntimeError("Mock Razorpay: refund creation failed")

        return {
            "id": f"refund_mock_{uuid.uuid4().hex[:14]}",
            "payment_id": razorpay_payment_id,
            "amount": amount_paise,
            "status": "processed",
        }
