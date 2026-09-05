import uuid
from datetime import UTC, datetime, timedelta

from httpx import AsyncClient


async def _create_chamber(authed_client: AsyncClient) -> dict:
    uid = uuid.uuid4().hex[:6]
    payload = {
        "name": f"INV-{uid}",
        "code": f"INV{uid[:4].upper()}",
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
        "name": f"Invoice Client {uuid.uuid4().hex[:4]}",
        "email": f"inv{uuid.uuid4().hex[:4]}@example.com",
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
    resp = await authed_client.post(
        f"/inventory/orders/{order_id}/pallets"
    )
    assert resp.status_code == 201, resp.text


async def _approve(authed_client: AsyncClient, order_id: str) -> None:
    pass


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
    await _approve(authed_client, order_id)
    await _mark_reserved(authed_client, client["id"])
    await _allocate(authed_client, order_id, chamber_id)

    return {
        "order_id": order_id,
        "chamber_id": chamber_id,
        "client_id": client["id"],
    }


class TestInvoicingRoutes:
    async def test_generate_invoice(
        self, authed_client: AsyncClient
    ):
        data = await _setup_stored_pallet(authed_client)
        now = datetime.now(UTC)
        period_start = (now - timedelta(days=5)).isoformat()
        period_end = now.isoformat()

        payload = {
            "client_id": data["client_id"],
            "billing_period_start": period_start,
            "billing_period_end": period_end,
        }
        resp = await authed_client.post("/invoices/generate", json=payload)
        assert resp.status_code == 201, resp.text
        body = resp.json()
        assert body["status"] == "draft"
        assert body["subtotal"] > 0
        assert body["total_amount"] > 0
        assert len(body["line_items"]) >= 1
        assert body["client_name"] != ""
        assert body["invoice_number"].startswith("INV-")

    async def test_generate_invoice_duplicate_conflict(
        self, authed_client: AsyncClient
    ):
        data = await _setup_stored_pallet(authed_client)
        now = datetime.now(UTC)
        period_start = (now - timedelta(days=5)).isoformat()
        period_end = now.isoformat()

        payload = {
            "client_id": data["client_id"],
            "billing_period_start": period_start,
            "billing_period_end": period_end,
        }
        resp1 = await authed_client.post("/invoices/generate", json=payload)
        assert resp1.status_code == 201, resp1.text

        resp2 = await authed_client.post("/invoices/generate", json=payload)
        assert resp2.status_code == 409

    async def test_generate_invoice_no_billable_items(
        self, authed_client: AsyncClient
    ):
        client = await _create_client(authed_client)
        now = datetime.now(UTC)
        payload = {
            "client_id": client["id"],
            "billing_period_start": (now - timedelta(days=5)).isoformat(),
            "billing_period_end": now.isoformat(),
        }
        resp = await authed_client.post("/invoices/generate", json=payload)
        assert resp.status_code == 409

    async def test_list_invoices(
        self, authed_client: AsyncClient
    ):
        data = await _setup_stored_pallet(authed_client)
        now = datetime.now(UTC)
        payload = {
            "client_id": data["client_id"],
            "billing_period_start": (now - timedelta(days=5)).isoformat(),
            "billing_period_end": now.isoformat(),
        }
        await authed_client.post("/invoices/generate", json=payload)

        resp = await authed_client.get("/invoices")
        assert resp.status_code == 200
        invoices = resp.json()
        assert len(invoices) >= 1

    async def test_get_invoice(
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
        invoice_id = gen_resp.json()["id"]

        resp = await authed_client.get(f"/invoices/{invoice_id}")
        assert resp.status_code == 200
        body = resp.json()
        assert body["id"] == invoice_id
        assert len(body["line_items"]) >= 1

    async def test_get_invoice_not_found(self, authed_client: AsyncClient):
        resp = await authed_client.get(
            "/invoices/00000000-0000-0000-0000-000000000000"
        )
        assert resp.status_code == 404

    async def test_list_invoices_by_client(
        self, authed_client: AsyncClient
    ):
        data = await _setup_stored_pallet(authed_client)
        now = datetime.now(UTC)
        payload = {
            "client_id": data["client_id"],
            "billing_period_start": (now - timedelta(days=5)).isoformat(),
            "billing_period_end": now.isoformat(),
        }
        await authed_client.post("/invoices/generate", json=payload)

        resp = await authed_client.get(
            f"/invoices/client/{data['client_id']}"
        )
        assert resp.status_code == 200
        invoices = resp.json()
        assert len(invoices) >= 1

    async def test_update_invoice_status(
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
        invoice_id = gen_resp.json()["id"]

        resp = await authed_client.patch(
            f"/invoices/{invoice_id}/status",
            json={"status": "sent"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "sent"

    async def test_download_pdf(
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
        invoice_id = gen_resp.json()["id"]

        resp = await authed_client.get(f"/invoices/{invoice_id}/pdf")
        assert resp.status_code == 200
        assert resp.headers["content-type"] == "application/pdf"
        assert len(resp.content) > 0

    async def test_generate_invoice_gst_same_state(
        self, authed_client: AsyncClient
    ):
        data = await _setup_stored_pallet(authed_client)
        now = datetime.now(UTC)
        payload = {
            "client_id": data["client_id"],
            "billing_period_start": (now - timedelta(days=5)).isoformat(),
            "billing_period_end": now.isoformat(),
        }
        resp = await authed_client.post("/invoices/generate", json=payload)
        body = resp.json()
        assert body["cgst_rate"] is not None
        assert body["sgst_rate"] is not None
        assert body["igst_rate"] is None
        assert body["tax_amount"] == body["cgst_amount"] + body["sgst_amount"]

    async def test_generate_invoice_gst_different_state(
        self, authed_client: AsyncClient
    ):
        client_payload = {
            "name": f"Interstate Client {uuid.uuid4().hex[:4]}",
            "email": f"inter{uuid.uuid4().hex[:4]}@example.com",
            "phone_number": "9800000002",
            "address": "456 Other St",
            "city": "Delhi",
            "state": "Delhi",
            "pin_code": "110001",
            "gstin": "07AABCA1234F5GC",
        }
        client_resp = await authed_client.post("/clients", json=client_payload)
        assert client_resp.status_code == 201
        client = client_resp.json()

        chamber = await _create_chamber(authed_client)
        order = await _create_order(authed_client, client["id"])
        order_id = order["id"]

        await _advance_to_processing(authed_client, order_id)
        await _palletise(authed_client, order_id)
        await _approve(authed_client, order_id)
        await _mark_reserved(authed_client, client["id"])
        await _allocate(authed_client, order_id, chamber["id"])

        now = datetime.now(UTC)
        payload = {
            "client_id": client["id"],
            "billing_period_start": (now - timedelta(days=5)).isoformat(),
            "billing_period_end": now.isoformat(),
        }
        resp = await authed_client.post("/invoices/generate", json=payload)
        body = resp.json()
        assert body["igst_rate"] is not None
        assert body["cgst_rate"] is None
        assert body["sgst_rate"] is None
