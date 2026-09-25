"""End-to-end integration tests exercising the full inbound cold-storage lifecycle.

Unlike isolated route tests, these walk an order through the whole business
workflow - creation with items, approval/rejection, status progression,
palletisation and slot allocation - and assert that the interlocking API
endpoints, services and database state stay consistent at each step.
"""

import re
import uuid
from datetime import datetime
from typing import Any

from httpx import AsyncClient

_PALLET_CODE_RE = re.compile(r"PL-\d{4}-\d{4}")
_SLOT_CODE_RE = re.compile(r"^[A-Z0-9]+-R\d+-B\d+-L\d+$")


def _chamber_payload(category: str = "frozen") -> dict[str, Any]:
    uid = uuid.uuid4().hex[:6]
    temp = -25.0 if category == "frozen" else 2.0 if category == "chilled" else 15.0
    return {
        "name": f"INTG-{uid}",
        "code": f"ITG{uid[:4].upper()}",
        "category": category,
        "temperature": temp,
        "num_racks": 2,
        "bays_per_rack": 5,
        "levels_per_rack": 1,
    }


def _client_payload() -> dict[str, Any]:
    return {
        "name": "Global Fresh Exports",
        "email": f"global{uuid.uuid4().hex[:8]}@example.com",
        "phone_number": "9112345678",
        "address": "25 Dock Road",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pin_code": 400001,
        "gstin": "27ABCDE1234F1Z5",
    }


def _order_payload(client_id: str) -> dict[str, Any]:
    return {
        "client_id": client_id,
        "vehicle_number": "MH01AB2026",
        "total_quantity": 2000.0,
        "items": [
            {
                "product_name": "Frozen Chicken",
                "quantity": 1500.0,
                "temperature_category": "frozen",
                "batch_number": "FC-2026-001",
                "expiry_date": "2027-06-30T00:00:00Z",
            },
            {
                "product_name": "Chilled Vegetables",
                "quantity": 500.0,
                "temperature_category": "chilled",
                "batch_number": "CV-2026-002",
                "expiry_date": "2027-03-15T00:00:00Z",
            },
        ],
    }


def _assert_valid_iso(value: str) -> None:
    datetime.fromisoformat(value.replace("Z", "+00:00"))


class TestFullOrderLifecycle:
    async def _create_client(self, authed_client: AsyncClient) -> dict[str, Any]:
        resp = await authed_client.post("/clients", json=_client_payload())
        assert resp.status_code == 201, resp.text
        return resp.json()

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

    async def _set_status(
        self, authed_client: AsyncClient, order_id: str, status: str
    ) -> dict[str, Any]:
        resp = await authed_client.patch(
            f"/inbound-orders/{order_id}/status", json={"status": status}
        )
        assert resp.status_code == 200, resp.text
        return resp.json()

    async def test_happy_path_full_order_to_storage(
        self,
        authed_client: AsyncClient,
    ) -> None:
        # --- Step 1: create client --------------------------------
        client = await self._create_client(authed_client)
        client_id: str = client["id"]
        assert client["name"] == "Global Fresh Exports"
        assert client["email"].startswith("global")
        assert client["is_active"] is True
        assert client["city"] == "Mumbai"
        assert client["state"] == "Maharashtra"
        assert client["pin_code"] == 400001
        _assert_valid_iso(client["created_at"])

        # --- Step 2: create chambers with racks and slots ---------
        frozen_chamber = await self._create_chamber(authed_client, "frozen")
        chamber_id: str = frozen_chamber["id"]
        chilled_chamber = await self._create_chamber(authed_client, "chilled")
        assert frozen_chamber["total_racks"] == 2
        assert frozen_chamber["total_slots"] == 10
        assert all(
            slot["status"] == "available"
            for rack in frozen_chamber["racks"]
            for slot in rack["slots"]
        )

        # --- Step 3: create order with two items ------------------
        order = await self._create_order(authed_client, client_id)
        order_id: str = order["id"]
        assert order["client_id"] == client_id
        assert order["vehicle_number"] == "MH01AB2026"
        assert order["total_quantity"] == 2000.0
        assert order["status"] == "submitted"
        assert len(order["items"]) == 2
        for item in order["items"]:
            assert item["order_id"] == order_id
            assert item["id"]
            assert item["product_name"]
            assert item["quantity"] > 0
            assert item["temperature_category"] in {"frozen", "chilled"}
            assert item["batch_number"]
            assert item["expiry_date"]
        _assert_valid_iso(order["created_at"])
        _assert_valid_iso(order["updated_at"])

        # --- Step 4: fetch order detail ---------------------------
        fetched = await authed_client.get(f"/inbound-orders/{order_id}")
        assert fetched.status_code == 200
        body: dict[str, Any] = fetched.json()
        assert body["id"] == order_id
        assert body["client_id"] == client_id
        assert body["status"] == "submitted"
        assert len(body["items"]) == 2

        # --- Step 5: fetch client detail (who is this client?) ----
        client_resp = await authed_client.get(f"/clients/{client_id}")
        assert client_resp.status_code == 200
        client_body: dict[str, Any] = client_resp.json()
        assert client_body["id"] == client_id
        assert client_body["name"] == "Global Fresh Exports"
        assert client_body["phone_number"] == "9112345678"
        assert client_body["city"] == "Mumbai"
        _assert_valid_iso(client_body["created_at"])

        # --- Step 6: approval -------------------------------------
        approved = await self._set_status(authed_client, order_id, "approved")
        assert approved["status"] == "approved"
        recheck = await authed_client.get(f"/inbound-orders/{order_id}")
        assert recheck.json()["status"] == "approved"

        # --- Step 7: in transit -----------------------------------
        in_transit = await self._set_status(authed_client, order_id, "in_transit")
        assert in_transit["status"] == "in_transit"

        # --- Step 8: arrived --------------------------------------
        arrived = await self._set_status(authed_client, order_id, "arrived")
        assert arrived["status"] == "arrived"

        # --- Step 9: processing -----------------------------------
        processing = await self._set_status(authed_client, order_id, "processing")
        assert processing["status"] == "processing"

        # --- Step 10: verify order item details -------------------
        detail_resp = await authed_client.get(f"/inbound-orders/{order_id}")
        assert detail_resp.status_code == 200
        detail: dict[str, Any] = detail_resp.json()
        item_a, item_b = detail["items"]
        assert item_a["product_name"] == "Frozen Chicken"
        assert item_a["quantity"] == 1500.0
        assert item_a["temperature_category"] == "frozen"
        assert item_a["batch_number"] == "FC-2026-001"
        assert item_b["product_name"] == "Chilled Vegetables"
        assert item_b["quantity"] == 500.0
        assert item_b["temperature_category"] == "chilled"
        assert item_b["batch_number"] == "CV-2026-002"

        # --- Step 11: palletise -----------------------------------
        pal_resp = await authed_client.post(f"/inventory/orders/{order_id}/pallets")
        assert pal_resp.status_code == 201, pal_resp.text
        palletised: dict[str, Any] = pal_resp.json()
        assert palletised["order_id"] == order_id
        assert palletised["total_pallets"] == 3
        assert palletised["total_weight_mt"] == 2.0
        pallets: list[dict[str, Any]] = palletised["pallets"]
        assert len(pallets) == 3

        frozen_pallets = [p for p in pallets if p["temperature_category"] == "frozen"]
        chilled_pallets = [p for p in pallets if p["temperature_category"] == "chilled"]
        assert len(frozen_pallets) == 2
        assert len(chilled_pallets) == 1

        full_frozen = [p for p in frozen_pallets if not p["is_partial"]]
        partial_frozen = [p for p in frozen_pallets if p["is_partial"]]
        assert len(full_frozen) == 1 and full_frozen[0]["weight"] == 1.0
        assert len(partial_frozen) == 1 and partial_frozen[0]["weight"] == 0.5
        assert chilled_pallets[0]["is_partial"] is True
        assert chilled_pallets[0]["weight"] == 0.5

        item_a_id = next(
            i["id"] for i in detail["items"] if i["product_name"] == "Frozen Chicken"
        )
        item_b_id = next(
            i["id"]
            for i in detail["items"]
            if i["product_name"] == "Chilled Vegetables"
        )
        for pallet in full_frozen + partial_frozen:
            assert pallet["order_item_id"] == item_a_id
        for pallet in frozen_pallets:
            assert pallet["quantity"] in (1000.0, 500.0)
        assert sum(p["quantity"] for p in frozen_pallets) == 1500.0
        assert chilled_pallets[0]["order_item_id"] == item_b_id
        assert chilled_pallets[0]["quantity"] == 500.0

        for pallet in pallets:
            assert re.fullmatch(_PALLET_CODE_RE, pallet["pallet_code"]), pallet
            assert pallet["status"] == "allocated"
            assert pallet["batch_code"]
            assert pallet["expiry_date"]
            assert pallet["client_id"] == client_id
        codes = [p["pallet_code"] for p in pallets]
        assert len(set(codes)) == len(codes)

        # --- Step 12: verify pallets persist ----------------------
        list_pallets = await authed_client.get(f"/inventory/orders/{order_id}/pallets")
        assert list_pallets.status_code == 200
        persisted_pallets: list[dict[str, Any]] = list_pallets.json()
        assert len(persisted_pallets) == 3
        assert {p["pallet_code"] for p in persisted_pallets} == set(codes)

        # --- Step 13: allocate to chambers ------------------------
        alloc_resp = await authed_client.post(
            f"/inventory/orders/{order_id}/allocate",
            json={},
        )
        assert alloc_resp.status_code == 201, alloc_resp.text
        allocations: list[dict[str, Any]] = alloc_resp.json()
        assert len(allocations) == 3
        for allocation in allocations:
            assert allocation["order_id"] == order_id
            assert allocation["pallet_id"]
            assert allocation["slot_id"]
            assert allocation["pallet_code"] in codes
            assert allocation["temperature_category"] in {"frozen", "chilled"}
            assert re.fullmatch(_SLOT_CODE_RE, allocation["slot_code"]), allocation
            _assert_valid_iso(allocation["allocated_at"])

        # --- Step 14: order auto-moved to stored ------------------
        stored = await authed_client.get(f"/inbound-orders/{order_id}")
        assert stored.json()["status"] == "stored"

        # --- Step 15: pallets moved to stored ---------------------
        stored_pallets = await authed_client.get(
            f"/inventory/orders/{order_id}/pallets"
        )
        assert stored_pallets.status_code == 200
        assert all(p["status"] == "stored" for p in stored_pallets.json())

        # --- Step 16: slots now occupied by this client -----------
        frozen_detail = await authed_client.get(
            f"/warehouses/chambers/{chamber_id}/detail"
        )
        assert frozen_detail.status_code == 200
        chilled_detail = await authed_client.get(
            f"/warehouses/chambers/{chilled_chamber['id']}/detail"
        )
        assert chilled_detail.status_code == 200
        all_slots = [
            slot
            for ch in [frozen_detail.json(), chilled_detail.json()]
            for rack in ch["racks"]
            for slot in rack["slots"]
        ]
        occupied = [slot for slot in all_slots if slot["status"] == "occupied"]
        assert len(occupied) == 3
        assert all(slot["allocated_client_id"] == client_id for slot in occupied)
        occupied_codes = {slot["location_code"] for slot in occupied}
        assert all(a["slot_code"] in occupied_codes for a in allocations)

        # --- Step 17: allocations persist --------------------------
        alloc_list = await authed_client.get(
            f"/inventory/orders/{order_id}/allocations"
        )
        assert alloc_list.status_code == 200
        assert len(alloc_list.json()) == 3

        # --- Step 18: client inventory summary (pallet-based) -----
        summary_resp = await authed_client.get(
            f"/inventory/clients/{client_id}/inventory/summary"
        )
        assert summary_resp.status_code == 200, summary_resp.text
        summary: list[dict[str, Any]] = summary_resp.json()
        assert len(summary) == 2
        by_name = {row["product_name"]: row for row in summary}
        assert by_name["Frozen Chicken"]["total_quantity"] == 1500.0
        assert by_name["Frozen Chicken"]["total_weight_mt"] == 1.5
        assert by_name["Frozen Chicken"]["pallet_count"] == 2
        assert by_name["Frozen Chicken"]["temperature_category"] == "frozen"
        assert by_name["Frozen Chicken"]["batch_code"] == "FC-2026-001"
        assert by_name["Chilled Vegetables"]["total_quantity"] == 500.0
        assert by_name["Chilled Vegetables"]["total_weight_mt"] == 0.5
        assert by_name["Chilled Vegetables"]["pallet_count"] == 1
        assert by_name["Chilled Vegetables"]["temperature_category"] == "chilled"

        # --- Step 19: client inventory pallets ---------------------
        inv_resp = await authed_client.get(f"/inventory/clients/{client_id}/inventory")
        assert inv_resp.status_code == 200, inv_resp.text
        inv_pallets: list[dict[str, Any]] = inv_resp.json()
        assert len(inv_pallets) == 3
        assert all(p["status"] == "stored" for p in inv_pallets)
        assert all(p["slot_code"] for p in inv_pallets)
        assert all(p["batch_code"] for p in inv_pallets)

        # --- Step 20: generate pick list via outbound order ---------
        outbound_resp = await authed_client.post(
            "/outbound-orders",
            json={
                "client_id": client_id,
                "total_quantity": 2000.0,
                "items": [
                    {"product_name": "Frozen Chicken", "quantity": 1500.0},
                    {"product_name": "Chilled Vegetables", "quantity": 500.0},
                ],
            },
        )
        assert outbound_resp.status_code == 201, outbound_resp.text
        outbound_order = outbound_resp.json()
        assert outbound_order["status"] == "submitted"
        resp = await authed_client.patch(
            f"/outbound-orders/{outbound_order['id']}/status",
            json={"status": "approved"},
        )
        assert resp.status_code == 200, resp.text

        pick_resp = await authed_client.post(
            "/inventory/pick-list",
            json={"outbound_order_id": outbound_order["id"]},
        )
        assert pick_resp.status_code == 201, pick_resp.text
        pick_result: dict[str, Any] = pick_resp.json()
        assert pick_result["outbound_order_id"] == outbound_order["id"]
        assert pick_result["total_lines"] == 3
        assert pick_result["total_quantity"] == 2000.0
        pick_records = pick_result["records"]
        frozen_pick = [
            r for r in pick_records if r["product_name"] == "Frozen Chicken"
        ]
        chilled_pick = [
            r for r in pick_records if r["product_name"] == "Chilled Vegetables"
        ]
        assert len(frozen_pick) == 2
        assert len(chilled_pick) == 1
        assert sum(r["quantity"] for r in frozen_pick) == 1500.0
        assert chilled_pick[0]["quantity"] == 500.0
        for record in pick_records:
            assert re.fullmatch(_SLOT_CODE_RE, record["slot_code"]), record
            assert record["pallet_code"]
            assert record["batch_code"]
            assert record["picked"] is False

        # --- Step 21: re-palletise and re-allocate rejected --------
        repal = await authed_client.post(f"/inventory/orders/{order_id}/pallets")
        assert repal.status_code == 409
        assert repal.json()["detail"]["code"] == "CONFLICT"
        real = await authed_client.post(
            f"/inventory/orders/{order_id}/allocate", json={}
        )
        assert real.status_code == 409
        assert real.json()["detail"]["code"] == "CONFLICT"

    async def test_rejection_is_terminal(
        self,
        authed_client: AsyncClient,
    ) -> None:
        # --- Setup ------------------------------------------------
        client = await self._create_client(authed_client)
        order = await self._create_order(authed_client, client["id"])
        order_id: str = order["id"]

        # --- Reject ------------------------------------------------
        rejected = await authed_client.patch(
            f"/inbound-orders/{order_id}/status", json={"status": "rejected"}
        )
        assert rejected.status_code == 200
        assert rejected.json()["status"] == "rejected"

        # --- Terminal: cannot move out of rejected -----------------
        resp = await authed_client.patch(
            f"/inbound-orders/{order_id}/status", json={"status": "approved"}
        )
        assert resp.status_code == 409
        assert resp.json()["detail"]["code"] == "CONFLICT"

        # --- Status still rejected ---------------------------------
        fetched = await authed_client.get(f"/inbound-orders/{order_id}")
        assert fetched.json()["status"] == "rejected"

        # --- Cannot palletise a rejected order ---------------------
        pal_resp = await authed_client.post(f"/inventory/orders/{order_id}/pallets")
        assert pal_resp.status_code == 400
        assert pal_resp.json()["detail"]["code"] == "VALIDATION_ERROR"

        # --- Cannot allocate a rejected (non-processing) order -----
        alloc_resp = await authed_client.post(
            f"/inventory/orders/{order_id}/allocate", json={}
        )
        assert alloc_resp.status_code in (400, 409)
        assert alloc_resp.json()["detail"]["code"] in {
            "VALIDATION_ERROR",
            "CONFLICT",
        }


class TestOutboundOrderLifecycle:
    async def _create_client(self, authed_client: AsyncClient) -> dict[str, Any]:
        resp = await authed_client.post("/clients", json=_client_payload())
        assert resp.status_code == 201, resp.text
        return resp.json()

    async def _create_chamber(
        self, authed_client: AsyncClient, category: str = "frozen"
    ) -> dict[str, Any]:
        resp = await authed_client.post(
            "/warehouses/chamber", json=_chamber_payload(category)
        )
        assert resp.status_code == 201, resp.text
        return resp.json()

    async def _seed_inventory(
        self, authed_client: AsyncClient, client_id: str
    ) -> None:
        """Walk an inbound order through to 'stored' so inventory exists."""
        inbound = await authed_client.post(
            "/inbound-orders", json=_order_payload(client_id)
        )
        assert inbound.status_code == 201, inbound.text
        oid = inbound.json()["id"]
        for s in ("approved", "in_transit", "arrived", "processing"):
            resp = await authed_client.patch(
                f"/inbound-orders/{oid}/status", json={"status": s}
            )
            assert resp.status_code == 200, resp.text
        await authed_client.post(f"/inventory/orders/{oid}/pallets")
        await authed_client.post(f"/inventory/orders/{oid}/allocate", json={})
        stored = await authed_client.get(f"/inbound-orders/{oid}")
        assert stored.json()["status"] == "stored"

    async def _outbound_payload(self, client_id: str) -> dict[str, Any]:
        return {
            "client_id": client_id,
            "total_quantity": 1000.0,
            "items": [
                {"product_name": "Frozen Chicken", "quantity": 1000.0},
            ],
        }

    async def _create_outbound(
        self, authed_client: AsyncClient, client_id: str
    ) -> dict[str, Any]:
        resp = await authed_client.post(
            "/outbound-orders", json=await self._outbound_payload(client_id)
        )
        assert resp.status_code == 201, resp.text
        return resp.json()

    async def _set_outbound_status(
        self, authed_client: AsyncClient, order_id: str, status: str
    ) -> dict[str, Any]:
        resp = await authed_client.patch(
            f"/outbound-orders/{order_id}/status", json={"status": status}
        )
        assert resp.status_code == 200, resp.text
        return resp.json()

    async def test_outbound_happy_path_submitted_to_dispatched(
        self,
        authed_client: AsyncClient,
    ) -> None:
        # --- Step 1: create client and seed inbound inventory ------
        client = await self._create_client(authed_client)
        client_id: str = client["id"]
        await self._create_chamber(authed_client, "frozen")
        await self._create_chamber(authed_client, "chilled")
        await self._seed_inventory(authed_client, client_id)

        # --- Step 2: create outbound order (submitted) ------------
        outbound = await self._create_outbound(authed_client, client_id)
        outbound_id: str = outbound["id"]
        assert outbound["client_id"] == client_id
        assert outbound["total_quantity"] == 1000.0
        assert outbound["status"] == "submitted"
        assert len(outbound["items"]) == 1
        assert outbound["items"][0]["product_name"] == "Frozen Chicken"
        assert outbound["items"][0]["quantity"] == 1000.0
        _assert_valid_iso(outbound["created_at"])
        _assert_valid_iso(outbound["updated_at"])

        # --- Step 3: fetch outbound order detail -------------------
        fetched = await authed_client.get(f"/outbound-orders/{outbound_id}")
        assert fetched.status_code == 200
        body: dict[str, Any] = fetched.json()
        assert body["id"] == outbound_id
        assert body["client_id"] == client_id
        assert body["status"] == "submitted"
        assert len(body["items"]) == 1

        # --- Step 4: list outbound orders --------------------------
        list_resp = await authed_client.get("/outbound-orders")
        assert list_resp.status_code == 200
        orders: list[dict[str, Any]] = list_resp.json()
        assert any(o["id"] == outbound_id for o in orders)

        # --- Step 5: list outbound by client -----------------------
        client_list = await authed_client.get(
            f"/outbound-orders/client/{client_id}"
        )
        assert client_list.status_code == 200
        assert any(o["id"] == outbound_id for o in client_list.json())

        # --- Step 6: update outbound order -------------------------
        update_resp = await authed_client.patch(
            f"/outbound-orders/{outbound_id}",
            json={"total_quantity": 800.0},
        )
        assert update_resp.status_code == 200
        assert update_resp.json()["total_quantity"] == 800.0

        # --- Step 7: order already submitted on create ------------
        recheck = await authed_client.get(f"/outbound-orders/{outbound_id}")
        assert recheck.json()["status"] == "submitted"

        # --- Step 8: approve (submitted → approved) ----------------
        approved = await self._set_outbound_status(
            authed_client, outbound_id, "approved"
        )
        assert approved["status"] == "approved"

        # --- Step 9: generate pick list ----------------------------
        pick_resp = await authed_client.post(
            "/inventory/pick-list",
            json={"outbound_order_id": outbound_id},
        )
        assert pick_resp.status_code == 201, pick_resp.text
        pick_result: dict[str, Any] = pick_resp.json()
        assert pick_result["outbound_order_id"] == outbound_id
        assert pick_result["total_lines"] == 2
        assert pick_result["total_quantity"] == 1000.0
        assert len(pick_result["records"]) == 2
        pick_record = pick_result["records"][0]
        assert pick_record["product_name"] == "Frozen Chicken"
        assert pick_record["picked"] is False

        # --- Step 10: dispatch (approved → dispatched) -------------
        dispatched = await self._set_outbound_status(
            authed_client, outbound_id, "dispatched"
        )
        assert dispatched["status"] == "dispatched"
        final = await authed_client.get(f"/outbound-orders/{outbound_id}")
        assert final.json()["status"] == "dispatched"

        # --- Step 11: verify pick record marked picked -------------
        pick_check = await authed_client.get(
            f"/inventory/pick-lists/outbound/{outbound_id}"
        )
        assert pick_check.status_code == 200
        pick_check_data = pick_check.json()
        assert pick_check_data["records"][0]["picked"] is True
        assert pick_check_data["records"][0]["picked_at"] is not None

        # --- Step 12: dispatched is terminal -----------------------
        resp = await authed_client.patch(
            f"/outbound-orders/{outbound_id}/status",
            json={"status": "submitted"},
        )
        assert resp.status_code == 409
        assert resp.json()["detail"]["code"] == "CONFLICT"

    async def test_outbound_rejection_is_terminal(
        self,
        authed_client: AsyncClient,
    ) -> None:
        client = await self._create_client(authed_client)
        await self._create_chamber(authed_client, "frozen")
        await self._create_chamber(authed_client, "chilled")
        await self._seed_inventory(authed_client, client["id"])

        outbound = await self._create_outbound(authed_client, client["id"])
        outbound_id: str = outbound["id"]

        # --- Reject from submitted --------------------------------
        rejected = await self._set_outbound_status(
            authed_client, outbound_id, "rejected"
        )
        assert rejected["status"] == "rejected"

        # --- Terminal: cannot move out of rejected ----------------
        resp = await authed_client.patch(
            f"/outbound-orders/{outbound_id}/status",
            json={"status": "approved"},
        )
        assert resp.status_code == 409
        assert resp.json()["detail"]["code"] == "CONFLICT"

        # --- Status still rejected --------------------------------
        fetched = await authed_client.get(f"/outbound-orders/{outbound_id}")
        assert fetched.json()["status"] == "rejected"

    async def test_outbound_rejection_at_submitted(
        self,
        authed_client: AsyncClient,
    ) -> None:
        client = await self._create_client(authed_client)
        await self._create_chamber(authed_client, "frozen")
        await self._create_chamber(authed_client, "chilled")
        await self._seed_inventory(authed_client, client["id"])

        outbound = await self._create_outbound(authed_client, client["id"])
        outbound_id: str = outbound["id"]

        # --- Order is already submitted on create -----------------
        rejected = await self._set_outbound_status(
            authed_client, outbound_id, "rejected"
        )
        assert rejected["status"] == "rejected"

        # --- Terminal ---------------------------------------------
        resp = await authed_client.patch(
            f"/outbound-orders/{outbound_id}/status",
            json={"status": "approved"},
        )
        assert resp.status_code == 409

    async def test_outbound_skipped_transition_conflict(
        self,
        authed_client: AsyncClient,
    ) -> None:
        client = await self._create_client(authed_client)
        await self._create_chamber(authed_client, "frozen")
        await self._create_chamber(authed_client, "chilled")
        await self._seed_inventory(authed_client, client["id"])

        outbound = await self._create_outbound(authed_client, client["id"])
        outbound_id: str = outbound["id"]

        # --- Cannot jump from submitted directly to dispatched ----
        resp = await authed_client.patch(
            f"/outbound-orders/{outbound_id}/status",
            json={"status": "dispatched"},
        )
        assert resp.status_code == 409
        detail: dict[str, Any] = resp.json()["detail"]
        assert detail["code"] == "CONFLICT"
        assert "allowed transitions" in detail["message"]
