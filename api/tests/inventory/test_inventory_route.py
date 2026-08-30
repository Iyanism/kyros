import uuid
from collections.abc import Mapping
from typing import Any

from httpx import AsyncClient

_MISSING_UUID = "00000000-0000-0000-0000-000000000000"


def _chamber_payload() -> dict[str, Any]:
    uid = uuid.uuid4().hex[:6]
    return {
        "name": f"INV-{uid}",
        "code": f"INV{uid[:4].upper()}",
        "category": "frozen",
        "temperature": -25.0,
        "num_racks": 2,
        "slots_per_rack": 5,
    }


def _order_payload(client_id: str) -> dict[str, Any]:
    return {
        "client_id": client_id,
        "vehicle_number": "MH12AB1234",
        "total_quantity": 1500,
        "items": [
            {
                "product_name": "Potato",
                "quantity": 1500,
                "unit": "kg",
                "temperature_category": "frozen",
                "batch_number": None,
                "expiry_date": None,
            },
        ],
    }


class TestInventoryRoute:
    async def _create_chamber(self, authed_client: AsyncClient) -> dict[str, Any]:
        resp = await authed_client.post("/warehouses/chamber", json=_chamber_payload())
        assert resp.status_code == 201, resp.text
        return resp.json()

    async def _create_order(
        self, authed_client: AsyncClient, client_id: str
    ) -> dict[str, Any]:
        resp = await authed_client.post(
            "/inbound-orders", json=_order_payload(client_id)
        )
        assert resp.status_code == 201, resp.text
        return resp.json()

    async def _advance_to_processing(
        self, authed_client: AsyncClient, order_id: str
    ) -> None:
        for status in ("approved", "in_transit", "arrived", "processing"):
            resp = await authed_client.patch(
                f"/inbound-orders/{order_id}/status", json={"status": status}
            )
            assert resp.status_code == 200, resp.text

    async def test_inventory_require_auth(self, client: AsyncClient) -> None:
        resp = await client.post(f"/inventory/orders/{_MISSING_UUID}/pallets")
        assert resp.status_code == 401

    async def test_palletise_full_and_partial(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        order = await self._create_order(authed_client, created_client["id"])
        await self._advance_to_processing(authed_client, order["id"])
        resp = await authed_client.post(f"/inventory/orders/{order['id']}/pallets")
        assert resp.status_code == 201, resp.text
        body: dict[str, Any] = resp.json()
        assert body["order_id"] == order["id"]
        assert body["total_pallets"] == 2
        assert body["total_weight_mt"] == 1.5
        pallets = body["pallets"]
        assert pallets[0]["is_partial"] is False
        assert pallets[0]["weight"] == 1.0
        assert pallets[1]["is_partial"] is True
        assert pallets[1]["weight"] == 0.5
        assert pallets[0]["temperature_category"] == "frozen"
        assert pallets[0]["pallet_code"].startswith(f"PL-{2026}-")

    async def test_palletise_not_found(self, authed_client: AsyncClient) -> None:
        resp = await authed_client.post(f"/inventory/orders/{_MISSING_UUID}/pallets")
        assert resp.status_code == 404
        detail: dict[str, Any] = resp.json()["detail"]
        assert detail["code"] == "NOT_FOUND"

    async def test_palletise_requires_processing_status(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        order = await self._create_order(authed_client, created_client["id"])
        resp = await authed_client.post(f"/inventory/orders/{order['id']}/pallets")
        assert resp.status_code == 400
        detail: dict[str, Any] = resp.json()["detail"]
        assert detail["code"] == "VALIDATION_ERROR"

    async def test_palletise_already_palletised(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        order = await self._create_order(authed_client, created_client["id"])
        await self._advance_to_processing(authed_client, order["id"])
        await authed_client.post(f"/inventory/orders/{order['id']}/pallets")
        resp = await authed_client.post(f"/inventory/orders/{order['id']}/pallets")
        assert resp.status_code == 409
        detail: dict[str, Any] = resp.json()["detail"]
        assert detail["code"] == "CONFLICT"

    async def test_list_pallets(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        order = await self._create_order(authed_client, created_client["id"])
        await self._advance_to_processing(authed_client, order["id"])
        await authed_client.post(f"/inventory/orders/{order['id']}/pallets")
        resp = await authed_client.get(f"/inventory/orders/{order['id']}/pallets")
        assert resp.status_code == 200
        pallets: list[dict[str, Any]] = resp.json()
        assert len(pallets) == 2

    async def test_list_pallets_empty(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        order = await self._create_order(authed_client, created_client["id"])
        resp = await authed_client.get(f"/inventory/orders/{order['id']}/pallets")
        assert resp.status_code == 404
        detail: dict[str, Any] = resp.json()["detail"]
        assert detail["code"] == "NOT_FOUND"

    async def test_palletise_multiple_items_unique_codes(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        order = await self._create_order_two_items(authed_client, created_client["id"])
        await self._advance_to_processing(authed_client, order["id"])
        resp = await authed_client.post(f"/inventory/orders/{order['id']}/pallets")
        assert resp.status_code == 201
        pallets: list[dict[str, Any]] = resp.json()["pallets"]
        codes = [p["pallet_code"] for p in pallets]
        assert len(set(codes)) == len(codes)

    async def test_allocate_success(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        await self._create_chamber(authed_client)
        order = await self._create_order(authed_client, created_client["id"])
        await self._advance_to_processing(authed_client, order["id"])
        await authed_client.post(f"/inventory/orders/{order['id']}/pallets")
        resp = await authed_client.post(
            f"/inventory/orders/{order['id']}/allocate", json={}
        )
        assert resp.status_code == 201, resp.text
        allocs: list[dict[str, Any]] = resp.json()
        assert len(allocs) == 2
        assert all(a["slot_code"] for a in allocs)
        assert all(a["pallet_code"] for a in allocs)
        assert allocs[0]["temperature_category"] == "frozen"

    async def test_allocate_updates_order_status(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        await self._create_chamber(authed_client)
        order = await self._create_order(authed_client, created_client["id"])
        await self._advance_to_processing(authed_client, order["id"])
        await authed_client.post(f"/inventory/orders/{order['id']}/pallets")
        resp = await authed_client.post(
            f"/inventory/orders/{order['id']}/allocate", json={}
        )
        assert resp.status_code == 201
        order_resp = await authed_client.get(f"/inbound-orders/{order['id']}")
        assert order_resp.status_code == 200
        assert order_resp.json()["status"] == "stored"

    async def test_allocate_without_palletising_conflict(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        await self._create_chamber(authed_client)
        order = await self._create_order(authed_client, created_client["id"])
        await self._advance_to_processing(authed_client, order["id"])
        resp = await authed_client.post(
            f"/inventory/orders/{order['id']}/allocate", json={}
        )
        assert resp.status_code == 409
        detail: dict[str, Any] = resp.json()["detail"]
        assert detail["code"] == "CONFLICT"

    async def test_allocate_insufficient_slots(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        chamber = await self._create_chamber(authed_client)
        order = await self._create_order_many_pallets(
            authed_client, created_client["id"]
        )
        await self._advance_to_processing(authed_client, order["id"])
        await authed_client.post(f"/inventory/orders/{order['id']}/pallets")
        resp = await authed_client.post(
            f"/inventory/orders/{order['id']}/allocate",
            json={"chamber_id": chamber["id"]},
        )
        assert resp.status_code == 409
        detail: dict[str, Any] = resp.json()["detail"]
        assert detail["code"] == "CONFLICT"

    async def test_allocate_not_found(self, authed_client: AsyncClient) -> None:
        resp = await authed_client.post(
            f"/inventory/orders/{_MISSING_UUID}/allocate", json={}
        )
        assert resp.status_code == 404

    async def test_list_allocations(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        await self._create_chamber(authed_client)
        order = await self._create_order(authed_client, created_client["id"])
        await self._advance_to_processing(authed_client, order["id"])
        await authed_client.post(f"/inventory/orders/{order['id']}/pallets")
        await authed_client.post(f"/inventory/orders/{order['id']}/allocate", json={})
        resp = await authed_client.get(f"/inventory/orders/{order['id']}/allocations")
        assert resp.status_code == 200
        allocs: list[dict[str, Any]] = resp.json()
        assert len(allocs) == 2

    async def test_list_allocations_empty(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        order = await self._create_order(authed_client, created_client["id"])
        resp = await authed_client.get(f"/inventory/orders/{order['id']}/allocations")
        assert resp.status_code == 404
        detail: dict[str, Any] = resp.json()["detail"]
        assert detail["code"] == "NOT_FOUND"

    async def _create_order_two_items(
        self, authed_client: AsyncClient, client_id: str
    ) -> dict[str, Any]:
        payload = _order_payload(client_id)
        payload["items"] = [
            {
                "product_name": "A",
                "quantity": 1000,
                "unit": "kg",
                "temperature_category": "frozen",
                "batch_number": None,
                "expiry_date": None,
            },
            {
                "product_name": "B",
                "quantity": 1000,
                "unit": "kg",
                "temperature_category": "chilled",
                "batch_number": None,
                "expiry_date": None,
            },
        ]
        payload["total_quantity"] = 2000
        resp = await authed_client.post("/inbound-orders", json=payload)
        assert resp.status_code == 201
        return resp.json()

    async def _create_order_many_pallets(
        self, authed_client: AsyncClient, client_id: str
    ) -> dict[str, Any]:
        payload = {
            "client_id": client_id,
            "vehicle_number": "MH12AB1234",
            "total_quantity": 11000,
            "items": [
                {
                    "product_name": "Potato",
                    "quantity": 11000,
                    "unit": "kg",
                    "temperature_category": "frozen",
                    "batch_number": None,
                    "expiry_date": None,
                },
            ],
        }
        resp = await authed_client.post("/inbound-orders", json=payload)
        assert resp.status_code == 201
        return resp.json()
