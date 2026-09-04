import uuid

from httpx import AsyncClient


async def _create_chamber(
    authed_client: AsyncClient, category: str = "frozen"
) -> dict:
    uid = uuid.uuid4().hex[:6]
    temp = -25.0 if category == "frozen" else 2.0 if category == "chilled" else 15.0
    payload = {
        "name": f"SM-{uid}",
        "code": f"SM{uid[:4].upper()}",
        "category": category,
        "temperature": temp,
        "num_racks": 2,
        "bays_per_rack": 5,
        "levels_per_rack": 1,
    }
    resp = await authed_client.post("/warehouses/chamber", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


async def _create_client(authed_client: AsyncClient) -> dict:
    payload = {
        "name": f"SM Client {uuid.uuid4().hex[:4]}",
        "email": f"sm{uuid.uuid4().hex[:4]}@example.com",
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


async def _setup_full(authed_client: AsyncClient) -> dict:
    chamber = await _create_chamber(authed_client, "frozen")
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


class TestStockMovementRoutes:
    async def test_list_stock_levels_empty(self, authed_client: AsyncClient):
        response = await authed_client.get("/stock-movements/levels")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    async def test_list_stock_movements_empty(self, authed_client: AsyncClient):
        response = await authed_client.get("/stock-movements/movements")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    async def test_list_stock_levels_after_allocation(
        self, authed_client: AsyncClient
    ):
        await _setup_full(authed_client)
        response = await authed_client.get("/stock-movements/levels")
        assert response.status_code == 200
        levels = response.json()
        assert len(levels) >= 1
        level = levels[0]
        assert "pallet_code" in level
        assert "slot_code" in level
        assert "quantity" in level
        assert "weight_mt" in level
        assert level["quantity"] > 0

    async def test_list_stock_movements_after_allocation(
        self, authed_client: AsyncClient
    ):
        await _setup_full(authed_client)
        response = await authed_client.get("/stock-movements/movements")
        assert response.status_code == 200
        movements = response.json()
        assert len(movements) >= 1
        movement = movements[0]
        assert movement["movement_type"] == "inbound"
        assert movement["quantity"] > 0
        assert movement["weight_mt"] > 0

    async def test_list_stock_movements_by_order(
        self, authed_client: AsyncClient
    ):
        data = await _setup_full(authed_client)
        order_id = data["order_id"]
        response = await authed_client.get(
            f"/stock-movements/movements/order/{order_id}"
        )
        assert response.status_code == 200
        movements = response.json()
        assert len(movements) >= 1
        for m in movements:
            assert m["reference_order_id"] == order_id

    async def test_list_stock_levels_by_client(
        self, authed_client: AsyncClient
    ):
        data = await _setup_full(authed_client)
        client_id = data["client_id"]
        response = await authed_client.get(
            f"/stock-movements/levels/client/{client_id}"
        )
        assert response.status_code == 200
        levels = response.json()
        assert len(levels) >= 1
        for level in levels:
            assert "pallet_code" in level
            assert "slot_code" in level
