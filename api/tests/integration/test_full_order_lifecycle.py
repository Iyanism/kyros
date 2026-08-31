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
_SLOT_CODE_RE = re.compile(r"^[A-Z0-9]+-R\d+-S\d+$")


def _chamber_payload() -> dict[str, Any]:
    uid = uuid.uuid4().hex[:6]
    return {
        "name": f"INTG-{uid}",
        "code": f"ITG{uid[:4].upper()}",
        "category": "frozen",
        "temperature": -25.0,
        "num_racks": 2,
        "slots_per_rack": 5,
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
        "total_quantity": 2000,
        "items": [
            {
                "product_name": "Frozen Chicken",
                "quantity": 1500,
                "unit": "kg",
                "temperature_category": "frozen",
                "batch_number": "FC-2026-001",
                "expiry_date": "2027-06-30T00:00:00Z",
            },
            {
                "product_name": "Chilled Vegetables",
                "quantity": 500,
                "unit": "kg",
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

        # --- Step 2: create chamber with racks and slots ----------
        chamber = await self._create_chamber(authed_client)
        chamber_id: str = chamber["id"]
        assert chamber["total_racks"] == 2
        assert chamber["total_slots"] == 10
        assert all(
            slot["is_occupied"] is False
            for rack in chamber["racks"]
            for slot in rack["slots"]
        )

        # --- Step 3: create order with two items ------------------
        order = await self._create_order(authed_client, client_id)
        order_id: str = order["id"]
        assert order["client_id"] == client_id
        assert order["vehicle_number"] == "MH01AB2026"
        assert order["total_quantity"] == 2000
        assert order["status"] == "submitted"
        assert len(order["items"]) == 2
        for item in order["items"]:
            assert item["order_id"] == order_id
            assert item["id"]
            assert item["product_name"]
            assert item["quantity"] > 0
            assert item["unit"] == "kg"
            assert item["temperature_category"] in {"frozen", "chilled"}
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
        assert item_a["quantity"] == 1500
        assert item_a["unit"] == "kg"
        assert item_a["temperature_category"] == "frozen"
        assert item_a["batch_number"] == "FC-2026-001"
        assert item_b["product_name"] == "Chilled Vegetables"
        assert item_b["quantity"] == 500
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

        for pallet in pallets:
            assert re.fullmatch(_PALLET_CODE_RE, pallet["pallet_code"]), pallet
            assert pallet["status"] == "allocated"
        codes = [p["pallet_code"] for p in pallets]
        assert len(set(codes)) == len(codes)

        # --- Step 12: verify pallets persist ----------------------
        list_pallets = await authed_client.get(f"/inventory/orders/{order_id}/pallets")
        assert list_pallets.status_code == 200
        persisted_pallets: list[dict[str, Any]] = list_pallets.json()
        assert len(persisted_pallets) == 3
        assert {p["pallet_code"] for p in persisted_pallets} == set(codes)

        # --- Step 13: allocate to chamber -------------------------
        alloc_resp = await authed_client.post(
            f"/inventory/orders/{order_id}/allocate",
            json={"chamber_id": chamber_id},
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
        chamber_detail = await authed_client.get(
            f"/warehouses/chambers/{chamber_id}/detail"
        )
        assert chamber_detail.status_code == 200
        all_slots = [
            slot for rack in chamber_detail.json()["racks"] for slot in rack["slots"]
        ]
        occupied = [slot for slot in all_slots if slot["is_occupied"]]
        assert len(occupied) == 3
        assert all(slot["allocated_client_id"] == client_id for slot in occupied)
        assert occupied[0]["full_code"] in {a["slot_code"] for a in allocations}

        # --- Step 17: allocations persist --------------------------
        alloc_list = await authed_client.get(
            f"/inventory/orders/{order_id}/allocations"
        )
        assert alloc_list.status_code == 200
        assert len(alloc_list.json()) == 3

        # --- Step 18: re-palletise and re-allocate rejected --------
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
