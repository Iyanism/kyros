import uuid
from collections.abc import Mapping
from typing import Any

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

_MISSING_UUID = "00000000-0000-0000-0000-000000000000"


def _chamber_payload(category: str = "frozen") -> dict[str, Any]:
    uid = uuid.uuid4().hex[:6]
    temp = -25.0 if category == "frozen" else 2.0 if category == "chilled" else 15.0
    return {
        "name": f"INV-{uid}",
        "code": f"INV{uid[:4].upper()}",
        "category": category,
        "temperature": temp,
        "num_racks": 2,
        "bays_per_rack": 5,
        "levels_per_rack": 1,
    }


def _order_payload(client_id: str) -> dict[str, Any]:
    return {
        "client_id": client_id,
        "vehicle_number": "MH12AB1234",
        "total_quantity": 1500.0,
        "items": [
            {
                "product_name": "Potato",
                "quantity": 1500.0,
                "temperature_category": "frozen",
                "batch_number": "POT-2026-001",
                "expiry_date": "2027-06-30T00:00:00Z",
            },
        ],
    }


class TestInventoryRoute:
    async def _create_chamber(
        self, authed_client: AsyncClient, category: str = "frozen"
    ) -> dict[str, Any]:
        resp = await authed_client.post(
            "/warehouses/chamber", json=_chamber_payload(category)
        )
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
        for s in ("approved", "in_transit", "arrived", "processing"):
            resp = await authed_client.patch(
                f"/inbound-orders/{order_id}/status", json={"status": s}
            )
            assert resp.status_code == 200, resp.text

    async def _palletise_and_allocate(
        self,
        authed_client: AsyncClient,
        order_id: str,
        chamber_id: str | None = None,
    ) -> None:
        resp = await authed_client.post(f"/inventory/orders/{order_id}/pallets")
        assert resp.status_code == 201, resp.text
        alloc: dict[str, Any] = {"chamber_id": chamber_id} if chamber_id else {}
        resp = await authed_client.post(
            f"/inventory/orders/{order_id}/allocate", json=alloc
        )
        assert resp.status_code == 201, resp.text

    async def test_inventory_require_auth(self, client: AsyncClient) -> None:
        resp = await client.post(f"/inventory/orders/{_MISSING_UUID}/pallets")
        assert resp.status_code == 401

    async def test_palletise_full_and_partial(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        await self._create_chamber(authed_client)
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
        assert pallets[0]["quantity"] == 1000.0
        assert pallets[1]["is_partial"] is True
        assert pallets[1]["weight"] == 0.5
        assert pallets[1]["quantity"] == 500.0
        assert pallets[0]["temperature_category"] == "frozen"
        assert pallets[0]["pallet_code"].startswith(f"PL-{2026}-")
        assert pallets[0]["order_item_id"] == order["items"][0]["id"]
        assert pallets[1]["order_item_id"] == order["items"][0]["id"]
        assert pallets[0]["batch_code"] == "POT-2026-001"
        assert pallets[0]["expiry_date"] is not None
        assert pallets[0]["client_id"] == created_client["id"]

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
        await self._create_chamber(authed_client)
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
        await self._create_chamber(authed_client)
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
        await self._create_chamber(authed_client, "frozen")
        await self._create_chamber(authed_client, "chilled")
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
        db_session: AsyncSession,
    ) -> None:
        await self._create_chamber(authed_client)
        order = await self._create_order(authed_client, created_client["id"])
        await authed_client.patch(
            f"/inbound-orders/{order['id']}/status", json={"status": "approved"}
        )
        await authed_client.patch(
            f"/inbound-orders/{order['id']}/status", json={"status": "in_transit"}
        )
        await authed_client.patch(
            f"/inbound-orders/{order['id']}/status", json={"status": "arrived"}
        )
        await authed_client.patch(
            f"/inbound-orders/{order['id']}/status", json={"status": "processing"}
        )
        await authed_client.post(f"/inventory/orders/{order['id']}/pallets")
        from src.domains.warehouse.model import Slot, SlotStatus
        from sqlalchemy import select as sel
        from src.domains.warehouse.model import Rack

        stmt = (
            sel(Slot)
            .join(Rack, Slot.rack_id == Rack.id)
            .where(
                Slot.status == SlotStatus.RESERVED,
                Slot.allocated_client_id == uuid.UUID(created_client["id"]),
            )
        )
        result = await db_session.execute(stmt)
        slots = result.scalars().all()
        for slot in slots:
            slot.status = SlotStatus.AVAILABLE
            slot.allocated_client_id = None
        resp = await authed_client.post(
            f"/inventory/orders/{order['id']}/allocate", json={}
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

    async def test_client_inventory_summary(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        await self._create_chamber(authed_client, "frozen")
        await self._create_chamber(authed_client, "chilled")
        order = await self._create_order_two_items(authed_client, created_client["id"])
        await self._advance_to_processing(authed_client, order["id"])
        await authed_client.post(f"/inventory/orders/{order['id']}/pallets")
        await authed_client.post(f"/inventory/orders/{order['id']}/allocate", json={})

        resp = await authed_client.get(
            f"/inventory/clients/{created_client['id']}/inventory/summary"
        )
        assert resp.status_code == 200, resp.text
        summary: list[dict[str, Any]] = resp.json()
        by_name = {row["product_name"]: row for row in summary}
        assert set(by_name) == {"A", "B"}
        assert by_name["A"]["total_quantity"] == 1000.0
        assert by_name["A"]["total_weight_mt"] == 1.0
        assert by_name["A"]["pallet_count"] == 1
        assert by_name["A"]["temperature_category"] == "frozen"
        assert by_name["A"]["batch_code"]
        assert by_name["A"]["expiry_date"]
        assert by_name["B"]["total_quantity"] == 1000.0
        assert by_name["B"]["total_weight_mt"] == 1.0
        assert by_name["B"]["pallet_count"] == 1
        assert by_name["B"]["temperature_category"] == "chilled"

    async def test_client_inventory_summary_not_found(
        self, authed_client: AsyncClient
    ) -> None:
        resp = await authed_client.get(
            f"/inventory/clients/{_MISSING_UUID}/inventory/summary"
        )
        assert resp.status_code == 404
        detail: dict[str, Any] = resp.json()["detail"]
        assert detail["code"] == "NOT_FOUND"

    async def test_client_inventory_summary_empty(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        resp = await authed_client.get(
            f"/inventory/clients/{created_client['id']}/inventory/summary"
        )
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_client_inventory_pallets(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        chamber = await self._create_chamber(authed_client)
        order = await self._create_order(authed_client, created_client["id"])
        await self._advance_to_processing(authed_client, order["id"])
        await self._palletise_and_allocate(authed_client, order["id"], chamber["id"])

        resp = await authed_client.get(
            f"/inventory/clients/{created_client['id']}/inventory"
        )
        assert resp.status_code == 200, resp.text
        pallets: list[dict[str, Any]] = resp.json()
        assert len(pallets) == 2
        for p in pallets:
            assert p["product_name"] == "Potato"
            assert p["batch_code"] == "POT-2026-001"
            assert p["expiry_date"]
            assert p["slot_code"]
            assert p["chamber_code"]
            assert p["chamber_name"]
            assert p["rack_number"]
            assert p["status"] == "stored"
            assert p["quantity"] > 0

    async def test_client_inventory_pallets_empty(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        resp = await authed_client.get(
            f"/inventory/clients/{created_client['id']}/inventory"
        )
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_client_inventory_pallets_not_found(
        self, authed_client: AsyncClient
    ) -> None:
        resp = await authed_client.get(f"/inventory/clients/{_MISSING_UUID}/inventory")
        assert resp.status_code == 404
        detail: dict[str, Any] = resp.json()["detail"]
        assert detail["code"] == "NOT_FOUND"

    async def test_all_inventory(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        chamber = await self._create_chamber(authed_client)
        order = await self._create_order(authed_client, created_client["id"])
        await self._advance_to_processing(authed_client, order["id"])
        await self._palletise_and_allocate(authed_client, order["id"], chamber["id"])

        resp = await authed_client.get("/inventory/inventory")
        assert resp.status_code == 200, resp.text
        pallets: list[dict[str, Any]] = resp.json()
        assert len(pallets) >= 2
        assert all(p["status"] == "stored" for p in pallets)
        assert all(p["slot_code"] for p in pallets)

    async def test_all_inventory_returns_list(
        self,
        authed_client: AsyncClient,
    ) -> None:
        resp = await authed_client.get("/inventory/inventory")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def _create_outbound_order(
        self,
        authed_client: AsyncClient,
        client_id: str,
        items: list[dict[str, Any]],
        total_quantity: float,
    ) -> dict[str, Any]:
        resp = await authed_client.post(
            "/outbound-orders",
            json={
                "client_id": client_id,
                "total_quantity": total_quantity,
                "items": items,
            },
        )
        assert resp.status_code == 201, resp.text
        return resp.json()

    async def _approve_outbound(
        self, authed_client: AsyncClient, order_id: str
    ) -> None:
        resp = await authed_client.patch(
            f"/outbound-orders/{order_id}/status", json={"status": "approved"}
        )
        assert resp.status_code == 200, resp.text

    async def test_generate_pick_list(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        chamber = await self._create_chamber(authed_client)
        order = await self._create_order(authed_client, created_client["id"])
        await self._advance_to_processing(authed_client, order["id"])
        await self._palletise_and_allocate(authed_client, order["id"], chamber["id"])

        outbound = await self._create_outbound_order(
            authed_client,
            created_client["id"],
            [{"product_name": "Potato", "quantity": 1500.0}],
            1500.0,
        )
        await self._approve_outbound(authed_client, outbound["id"])

        resp = await authed_client.post(
            "/inventory/pick-list",
            json={"outbound_order_id": outbound["id"]},
        )
        assert resp.status_code == 201, resp.text
        result: dict[str, Any] = resp.json()
        assert result["outbound_order_id"] == outbound["id"]
        assert result["total_lines"] == 2
        assert result["total_quantity"] == 1500.0
        assert result["total_weight_mt"] == 1.5
        records = result["records"]
        assert len(records) == 2
        for record in records:
            assert record["product_name"] == "Potato"
            assert record["batch_code"] == "POT-2026-001"
            assert record["quantity"] > 0
            assert record["weight"] > 0
            assert record["slot_code"]
            assert record["pallet_code"]
            assert record["picked"] is False

    async def test_generate_pick_list_partial_first(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        chamber = await self._create_chamber(authed_client)
        order = await self._create_order(authed_client, created_client["id"])
        await self._advance_to_processing(authed_client, order["id"])
        await self._palletise_and_allocate(authed_client, order["id"], chamber["id"])

        outbound = await self._create_outbound_order(
            authed_client,
            created_client["id"],
            [{"product_name": "Potato", "quantity": 500.0}],
            500.0,
        )
        await self._approve_outbound(authed_client, outbound["id"])

        resp = await authed_client.post(
            "/inventory/pick-list",
            json={"outbound_order_id": outbound["id"]},
        )
        assert resp.status_code == 201, resp.text
        result: dict[str, Any] = resp.json()
        assert result["total_lines"] == 1
        record = result["records"][0]
        assert record["quantity"] == 500.0
        assert record["pallet_code"]

    async def test_generate_pick_list_insufficient_stock(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        chamber = await self._create_chamber(authed_client)
        order = await self._create_order(authed_client, created_client["id"])
        await self._advance_to_processing(authed_client, order["id"])
        await self._palletise_and_allocate(authed_client, order["id"], chamber["id"])

        outbound = await self._create_outbound_order(
            authed_client,
            created_client["id"],
            [{"product_name": "Potato", "quantity": 99999.0}],
            99999.0,
        )
        await self._approve_outbound(authed_client, outbound["id"])

        resp = await authed_client.post(
            "/inventory/pick-list",
            json={"outbound_order_id": outbound["id"]},
        )
        assert resp.status_code == 409
        detail: dict[str, Any] = resp.json()["detail"]
        assert detail["code"] == "INSUFFICIENT_STOCK"

    async def test_generate_pick_list_no_product(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        chamber = await self._create_chamber(authed_client)
        order = await self._create_order(authed_client, created_client["id"])
        await self._advance_to_processing(authed_client, order["id"])
        await self._palletise_and_allocate(authed_client, order["id"], chamber["id"])

        outbound = await self._create_outbound_order(
            authed_client,
            created_client["id"],
            [{"product_name": "NonExistent", "quantity": 100.0}],
            100.0,
        )
        await self._approve_outbound(authed_client, outbound["id"])

        resp = await authed_client.post(
            "/inventory/pick-list",
            json={"outbound_order_id": outbound["id"]},
        )
        assert resp.status_code == 409
        detail: dict[str, Any] = resp.json()["detail"]
        assert detail["code"] == "INSUFFICIENT_STOCK"

    async def test_generate_pick_list_client_not_found(
        self, authed_client: AsyncClient
    ) -> None:
        resp = await authed_client.post(
            "/inventory/pick-list",
            json={"outbound_order_id": _MISSING_UUID},
        )
        assert resp.status_code == 404
        detail: dict[str, Any] = resp.json()["detail"]
        assert detail["code"] == "NOT_FOUND"

    async def test_generate_pick_list_multi_product(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        await self._create_chamber(authed_client, "frozen")
        await self._create_chamber(authed_client, "chilled")
        order = await self._create_order_two_items(authed_client, created_client["id"])
        await self._advance_to_processing(authed_client, order["id"])
        await authed_client.post(f"/inventory/orders/{order['id']}/pallets")
        await authed_client.post(f"/inventory/orders/{order['id']}/allocate", json={})

        outbound = await self._create_outbound_order(
            authed_client,
            created_client["id"],
            [
                {"product_name": "A", "quantity": 500.0},
                {"product_name": "B", "quantity": 1000.0},
            ],
            1500.0,
        )
        await self._approve_outbound(authed_client, outbound["id"])

        resp = await authed_client.post(
            "/inventory/pick-list",
            json={"outbound_order_id": outbound["id"]},
        )
        assert resp.status_code == 201, resp.text
        result: dict[str, Any] = resp.json()
        assert result["total_lines"] == 2
        records_by_product = {r["product_name"]: r for r in result["records"]}
        assert records_by_product["A"]["quantity"] == 500.0
        assert records_by_product["B"]["quantity"] == 1000.0

    async def _create_order_two_items(
        self, authed_client: AsyncClient, client_id: str
    ) -> dict[str, Any]:
        payload = {
            "client_id": client_id,
            "vehicle_number": "MH12AB1234",
            "total_quantity": 2000.0,
            "items": [
                {
                    "product_name": "A",
                    "quantity": 1000.0,
                    "temperature_category": "frozen",
                    "batch_number": "A-2026-001",
                    "expiry_date": "2027-06-30T00:00:00Z",
                },
                {
                    "product_name": "B",
                    "quantity": 1000.0,
                    "temperature_category": "chilled",
                    "batch_number": "B-2026-002",
                    "expiry_date": "2027-03-15T00:00:00Z",
                },
            ],
        }
        resp = await authed_client.post("/inbound-orders", json=payload)
        assert resp.status_code == 201
        return resp.json()

    async def _create_order_many_pallets(
        self, authed_client: AsyncClient, client_id: str
    ) -> dict[str, Any]:
        payload = {
            "client_id": client_id,
            "vehicle_number": "MH12AB1234",
            "total_quantity": 11000.0,
            "items": [
                {
                    "product_name": "Potato",
                    "quantity": 11000.0,
                    "temperature_category": "frozen",
                    "batch_number": "POT-2026-003",
                    "expiry_date": "2027-06-30T00:00:00Z",
                },
            ],
        }
        resp = await authed_client.post("/inbound-orders", json=payload)
        assert resp.status_code == 201
        return resp.json()
