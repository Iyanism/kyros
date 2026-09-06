import uuid
from datetime import UTC, datetime, timedelta

from httpx import AsyncClient


async def _create_chamber(authed_client: AsyncClient) -> dict:
    uid = uuid.uuid4().hex[:6]
    payload = {
        "name": f"PAY-{uid}",
        "code": f"PAY{uid[:4].upper()}",
        "category": "frozen",
        "temperature": -25.0,
        "num_racks": 2,
        "bays_per_rack": 5,
        "levels_per_rack": 1,
    }
    resp = await authed_client.post("/warehouses/chamber", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


async def _create_client(authed_client: AsyncClient) -> dict:
    payload = {
        "name": f"Pay Client {uuid.uuid4().hex[:4]}",
        "email": f"pay{uuid.uuid4().hex[:4]}@example.com",
        "phone_number": "9800000001",
        "address": "123 Test St",
        "city": "Pune",
        "state": "Maharashtra",
        "pin_code": "411001",
        "gstin": "27AABCA1234F5GB",
    }
    resp = await authed_client.post("/clients", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


async def _create_order(authed_client: AsyncClient, client_id: str) -> dict:
    payload = {
        "client_id": client_id,
        "vehicle_number": "MH12AB1234",
        "total_quantity": 100.0,
        "expected_delivery_at": "2026-12-01T10:00:00Z",
        "items": [
            {
                "product_name": "Frozen Peas",
                "quantity": 100,
                "unit_price": 50.0,
                "temperature_category": "frozen",
                "batch_number": f"BATCH-{uuid.uuid4().hex[:6]}",
                "expiry_date": "2027-06-01T00:00:00Z",
            }
        ],
    }
    resp = await authed_client.post("/inbound-orders", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


async def _advance_to_processing(authed_client: AsyncClient, order_id: str) -> None:
    for s in ("approved", "in_transit", "arrived", "processing"):
        resp = await authed_client.patch(
            f"/inbound-orders/{order_id}/status", json={"status": s}
        )
        assert resp.status_code == 200, resp.text


async def _palletise(authed_client: AsyncClient, order_id: str) -> None:
    resp = await authed_client.post(f"/inventory/orders/{order_id}/pallets")
    assert resp.status_code == 201, resp.text


async def _mark_reserved(authed_client: AsyncClient, client_id: str) -> None:
    from tests.conftest import TestAsyncSessionLocal
    from src.domains.warehouse.model import Slot, SlotStatus
    from sqlalchemy import select

    async with TestAsyncSessionLocal() as db:
        result = await db.execute(
            select(Slot).where(
                Slot.allocated_client_id == client_id,
                Slot.status != SlotStatus.OCCUPIED,
            )
        )
        slots = result.scalars().all()
        for s in slots:
            s.status = SlotStatus.RESERVED
        await db.commit()


async def _allocate(
    authed_client: AsyncClient, order_id: str, chamber_id: str
) -> None:
    resp = await authed_client.post(
        f"/inventory/orders/{order_id}/allocate",
        json={"chamber_id": chamber_id},
    )
    assert resp.status_code == 201, resp.text


async def _setup_stored_pallet(authed_client: AsyncClient) -> dict:
    chamber = await _create_chamber(authed_client)
    client = await _create_client(authed_client)
    order = await _create_order(authed_client, client["id"])
    order_id = order["id"]
    chamber_id = chamber["id"]

    await _advance_to_processing(authed_client, order_id)
    await _palletise(authed_client, order_id)
    await _mark_reserved(authed_client, client["id"])
    await _allocate(authed_client, order_id, chamber_id)

    return {
        "order_id": order_id,
        "chamber_id": chamber_id,
        "client_id": client["id"],
    }


async def _setup_invoice(authed_client: AsyncClient) -> dict:
    data = await _setup_stored_pallet(authed_client)
    now = datetime.now(UTC)
    payload = {
        "client_id": data["client_id"],
        "billing_period_start": (now - timedelta(days=5)).isoformat(),
        "billing_period_end": now.isoformat(),
    }
    gen_resp = await authed_client.post("/invoices/generate", json=payload)
    assert gen_resp.status_code == 201, gen_resp.text
    invoice = gen_resp.json()

    send_resp = await authed_client.patch(
        f"/invoices/{invoice['id']}/status",
        json={"status": "sent"},
    )
    assert send_resp.status_code == 200, send_resp.text

    return {
        **data,
        "invoice_id": invoice["id"],
        "invoice_number": invoice["invoice_number"],
        "total_amount": invoice["total_amount"],
    }


class TestPaymentRoutes:
    async def test_create_payment(self, authed_client: AsyncClient):
        data = await _setup_invoice(authed_client)
        payload = {
            "invoice_id": data["invoice_id"],
            "method": "upi",
        }
        resp = await authed_client.post("/payments", json=payload)
        assert resp.status_code == 201, resp.text
        body = resp.json()
        assert body["status"] == "created"
        assert body["amount"] > 0
        assert body["method"] == "upi"
        assert body["razorpay_order_id"].startswith("order_mock_")
        assert body["receipt_number"] is not None

    async def test_confirm_payment(self, authed_client: AsyncClient):
        data = await _setup_invoice(authed_client)
        create_resp = await authed_client.post(
            "/payments",
            json={"invoice_id": data["invoice_id"], "method": "upi"},
        )
        payment = create_resp.json()

        confirm_resp = await authed_client.post(
            f"/payments/{payment['id']}/confirm",
            json={
                "razorpay_order_id": payment["razorpay_order_id"],
                "razorpay_payment_id": "pay_mock_test123",
                "razorpay_signature": "sig_mock_test123",
            },
        )
        assert confirm_resp.status_code == 200, confirm_resp.text
        body = confirm_resp.json()
        assert body["status"] == "captured"
        assert body["razorpay_payment_id"] == "pay_mock_test123"

    async def test_confirm_payment_marks_invoice_paid(
        self, authed_client: AsyncClient
    ):
        data = await _setup_invoice(authed_client)
        create_resp = await authed_client.post(
            "/payments",
            json={"invoice_id": data["invoice_id"], "method": "card"},
        )
        payment = create_resp.json()

        await authed_client.post(
            f"/payments/{payment['id']}/confirm",
            json={
                "razorpay_order_id": payment["razorpay_order_id"],
                "razorpay_payment_id": "pay_mock_test456",
                "razorpay_signature": "sig_mock_test456",
            },
        )

        inv_resp = await authed_client.get(f"/invoices/{data['invoice_id']}")
        invoice = inv_resp.json()
        assert invoice["status"] == "paid"
        assert invoice["paid_at"] is not None

    async def test_create_payment_already_paid_conflict(
        self, authed_client: AsyncClient
    ):
        data = await _setup_invoice(authed_client)
        create_resp = await authed_client.post(
            "/payments",
            json={"invoice_id": data["invoice_id"], "method": "upi"},
        )
        payment = create_resp.json()

        await authed_client.post(
            f"/payments/{payment['id']}/confirm",
            json={
                "razorpay_order_id": payment["razorpay_order_id"],
                "razorpay_payment_id": "pay_mock_test789",
                "razorpay_signature": "sig_mock_test789",
            },
        )

        resp = await authed_client.post(
            "/payments",
            json={"invoice_id": data["invoice_id"], "method": "upi"},
        )
        assert resp.status_code == 409

    async def test_create_payment_draft_invoice_conflict(
        self, authed_client: AsyncClient
    ):
        data = await _setup_stored_pallet(authed_client)
        now = datetime.now(UTC)
        payload = {
            "client_id": data["client_id"],
            "billing_period_start": (now - timedelta(days=5)).isoformat(),
            "billing_period_end": now.isoformat(),
        }
        gen_resp = await authed_client.post("/invoices/generate", json=payload)
        invoice = gen_resp.json()

        resp = await authed_client.post(
            "/payments",
            json={"invoice_id": invoice["id"], "method": "upi"},
        )
        assert resp.status_code == 409

    async def test_get_payment(self, authed_client: AsyncClient):
        data = await _setup_invoice(authed_client)
        create_resp = await authed_client.post(
            "/payments",
            json={"invoice_id": data["invoice_id"], "method": "upi"},
        )
        payment = create_resp.json()

        resp = await authed_client.get(f"/payments/{payment['id']}")
        assert resp.status_code == 200
        assert resp.json()["id"] == payment["id"]

    async def test_get_payment_not_found(self, authed_client: AsyncClient):
        resp = await authed_client.get(
            "/payments/00000000-0000-0000-0000-000000000000"
        )
        assert resp.status_code == 404

    async def test_list_payments(self, authed_client: AsyncClient):
        data = await _setup_invoice(authed_client)
        await authed_client.post(
            "/payments",
            json={"invoice_id": data["invoice_id"], "method": "upi"},
        )

        resp = await authed_client.get("/payments")
        assert resp.status_code == 200
        payments = resp.json()
        assert len(payments) >= 1

    async def test_list_payments_by_client(self, authed_client: AsyncClient):
        data = await _setup_invoice(authed_client)
        await authed_client.post(
            "/payments",
            json={"invoice_id": data["invoice_id"], "method": "upi"},
        )

        resp = await authed_client.get(f"/payments/client/{data['client_id']}")
        assert resp.status_code == 200
        payments = resp.json()
        assert len(payments) >= 1

    async def test_get_payment_by_invoice(self, authed_client: AsyncClient):
        data = await _setup_invoice(authed_client)
        await authed_client.post(
            "/payments",
            json={"invoice_id": data["invoice_id"], "method": "upi"},
        )

        resp = await authed_client.get(
            f"/payments/invoice/{data['invoice_id']}"
        )
        assert resp.status_code == 200
        assert resp.json()["invoice_id"] == data["invoice_id"]

    async def test_refund_payment(self, authed_client: AsyncClient):
        data = await _setup_invoice(authed_client)
        create_resp = await authed_client.post(
            "/payments",
            json={"invoice_id": data["invoice_id"], "method": "upi"},
        )
        payment = create_resp.json()

        await authed_client.post(
            f"/payments/{payment['id']}/confirm",
            json={
                "razorpay_order_id": payment["razorpay_order_id"],
                "razorpay_payment_id": "pay_mock_refund",
                "razorpay_signature": "sig_mock_refund",
            },
        )

        resp = await authed_client.post(f"/payments/{payment['id']}/refund")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "refunded"

    async def test_refund_unpaid_conflict(self, authed_client: AsyncClient):
        data = await _setup_invoice(authed_client)
        create_resp = await authed_client.post(
            "/payments",
            json={"invoice_id": data["invoice_id"], "method": "upi"},
        )
        payment = create_resp.json()

        resp = await authed_client.post(f"/payments/{payment['id']}/refund")
        assert resp.status_code == 409

    async def test_download_receipt(self, authed_client: AsyncClient):
        data = await _setup_invoice(authed_client)
        create_resp = await authed_client.post(
            "/payments",
            json={"invoice_id": data["invoice_id"], "method": "upi"},
        )
        payment = create_resp.json()

        await authed_client.post(
            f"/payments/{payment['id']}/confirm",
            json={
                "razorpay_order_id": payment["razorpay_order_id"],
                "razorpay_payment_id": "pay_mock_receipt",
                "razorpay_signature": "sig_mock_receipt",
            },
        )

        resp = await authed_client.get(f"/payments/{payment['id']}/receipt")
        assert resp.status_code == 200
        assert resp.headers["content-type"] == "application/pdf"
        assert len(resp.content) > 0
