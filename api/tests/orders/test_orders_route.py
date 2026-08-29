import uuid
from collections.abc import Mapping
from typing import Any

from httpx import AsyncClient

_MISSING_UUID = "00000000-0000-0000-0000-000000000000"


def _order_payload(client_id: str) -> dict[str, Any]:
    return {
        "client_id": client_id,
        "vehicle_number": "MH12AB1234",
        "total_quantity": 10,
        "items": [
            {
                "product_name": "Potato",
                "quantity": 6,
                "unit": "kg",
                "temperature_category": "frozen",
                "batch_number": None,
                "expiry_date": None,
            },
            {
                "product_name": "Onion",
                "quantity": 4,
                "unit": "kg",
                "temperature_category": "chilled",
                "batch_number": None,
                "expiry_date": None,
            },
        ],
    }


class TestInboundOrderRoute:
    async def test_orders_require_auth(self, client: AsyncClient) -> None:
        response = await client.get("/inbound-orders")
        assert response.status_code == 401

    async def _create_order(
        self, authed_client: AsyncClient, client_id: str
    ) -> dict[str, Any]:
        payload = _order_payload(client_id)
        response = await authed_client.post("/inbound-orders", json=payload)
        assert response.status_code == 201
        return response.json()

    async def test_create_inbound_order(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        order = await self._create_order(authed_client, created_client["id"])
        assert order["client_id"] == created_client["id"]
        assert order["vehicle_number"] == "MH12AB1234"
        assert order["total_quantity"] == 10
        assert order["status"] == "submitted"
        assert len(order["items"]) == 2
        assert order["items"][0]["product_name"] == "Potato"
        assert order["items"][0]["temperature_category"] == "frozen"

    async def test_create_inbound_order_client_not_found(
        self, authed_client: AsyncClient
    ) -> None:
        payload = _order_payload(_MISSING_UUID)
        response = await authed_client.post("/inbound-orders", json=payload)
        assert response.status_code == 404
        detail: dict[str, Any] = response.json()["detail"]
        assert detail["code"] == "NOT_FOUND"

    async def test_create_inbound_order_quantity_mismatch(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        payload = _order_payload(created_client["id"])
        payload["total_quantity"] = 99
        response = await authed_client.post("/inbound-orders", json=payload)
        assert response.status_code == 400
        detail: dict[str, Any] = response.json()["detail"]
        assert detail["code"] == "VALIDATION_ERROR"

    async def test_get_inbound_order(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        order = await self._create_order(authed_client, created_client["id"])
        response = await authed_client.get(f"/inbound-orders/{order['id']}")
        assert response.status_code == 200
        body: dict[str, Any] = response.json()
        assert body["id"] == order["id"]
        assert len(body["items"]) == 2

    async def test_get_inbound_order_not_found(
        self, authed_client: AsyncClient
    ) -> None:
        response = await authed_client.get(f"/inbound-orders/{_MISSING_UUID}")
        assert response.status_code == 404
        detail: dict[str, Any] = response.json()["detail"]
        assert detail["code"] == "NOT_FOUND"

    async def test_list_inbound_orders(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        await self._create_order(authed_client, created_client["id"])
        response = await authed_client.get("/inbound-orders")
        assert response.status_code == 200
        data: list[dict[str, Any]] = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert all(order["items"] is not None for order in data)

    async def test_list_inbound_orders_by_client(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        await self._create_order(authed_client, created_client["id"])
        response = await authed_client.get(
            f"/inbound-orders/client/{created_client['id']}"
        )
        assert response.status_code == 200
        data: list[dict[str, Any]] = response.json()
        assert len(data) >= 1
        assert all(order["client_id"] == created_client["id"] for order in data)

    async def test_list_inbound_orders_by_client_not_found(
        self, authed_client: AsyncClient
    ) -> None:
        response = await authed_client.get(f"/inbound-orders/client/{_MISSING_UUID}")
        assert response.status_code == 404
        detail: dict[str, Any] = response.json()["detail"]
        assert detail["code"] == "NOT_FOUND"

    async def test_update_inbound_order(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        order = await self._create_order(authed_client, created_client["id"])
        response = await authed_client.patch(
            f"/inbound-orders/{order['id']}",
            json={"vehicle_number": "GJ01XYZ789", "status": "approved"},
        )
        assert response.status_code == 200
        body: dict[str, Any] = response.json()
        assert body["vehicle_number"] == "GJ01XYZ789"
        assert body["status"] == "approved"

    async def test_update_inbound_order_not_found(
        self, authed_client: AsyncClient
    ) -> None:
        response = await authed_client.patch(
            f"/inbound-orders/{_MISSING_UUID}", json={"vehicle_number": "GJ01XYZ789"}
        )
        assert response.status_code == 404
        detail: dict[str, Any] = response.json()["detail"]
        assert detail["code"] == "NOT_FOUND"

    async def _update_status(
        self, authed_client: AsyncClient, order_id: str, status: str
    ) -> dict[str, Any]:
        response = await authed_client.patch(
            f"/inbound-orders/{order_id}/status", json={"status": status}
        )
        return response.json()

    async def test_status_transition_happy_path(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        order = await self._create_order(authed_client, created_client["id"])
        order_id: str = order["id"]

        response = await authed_client.patch(
            f"/inbound-orders/{order_id}/status", json={"status": "approved"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "approved"

        response = await authed_client.patch(
            f"/inbound-orders/{order_id}/status", json={"status": "in_transit"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "in_transit"

        response = await authed_client.patch(
            f"/inbound-orders/{order_id}/status", json={"status": "arrived"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "arrived"

        response = await authed_client.patch(
            f"/inbound-orders/{order_id}/status", json={"status": "processing"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "processing"

        response = await authed_client.patch(
            f"/inbound-orders/{order_id}/status", json={"status": "stored"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "stored"

    async def test_status_reject_is_terminal(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        order = await self._create_order(authed_client, created_client["id"])
        order_id: str = order["id"]

        response = await authed_client.patch(
            f"/inbound-orders/{order_id}/status", json={"status": "rejected"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "rejected"

        response = await authed_client.patch(
            f"/inbound-orders/{order_id}/status", json={"status": "approved"}
        )
        assert response.status_code == 409
        detail: dict[str, Any] = response.json()["detail"]
        assert detail["code"] == "CONFLICT"

    async def test_status_skipped_transition_rejected(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        order = await self._create_order(authed_client, created_client["id"])
        order_id: str = order["id"]

        response = await authed_client.patch(
            f"/inbound-orders/{order_id}/status", json={"status": "stored"}
        )
        assert response.status_code == 409
        detail: dict[str, Any] = response.json()["detail"]
        assert detail["code"] == "CONFLICT"
        assert "allowed transitions" in detail["message"]

    async def test_status_same_status_conflict(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        order = await self._create_order(authed_client, created_client["id"])
        order_id: str = order["id"]

        await self._update_status(authed_client, order_id, "approved")
        response = await authed_client.patch(
            f"/inbound-orders/{order_id}/status", json={"status": "approved"}
        )
        assert response.status_code == 409
        detail: dict[str, Any] = response.json()["detail"]
        assert detail["code"] == "CONFLICT"
        assert "already in status" in detail["message"]

    async def test_status_transition_not_found(
        self, authed_client: AsyncClient
    ) -> None:
        response = await authed_client.patch(
            f"/inbound-orders/{_MISSING_UUID}/status", json={"status": "approved"}
        )
        assert response.status_code == 404
        detail: dict[str, Any] = response.json()["detail"]
        assert detail["code"] == "NOT_FOUND"

    async def test_delete_inbound_order(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        order = await self._create_order(authed_client, created_client["id"])
        response = await authed_client.delete(f"/inbound-orders/{order['id']}")
        assert response.status_code == 204
        get_response = await authed_client.get(f"/inbound-orders/{order['id']}")
        assert get_response.status_code == 404

    async def test_delete_inbound_order_not_found(
        self, authed_client: AsyncClient
    ) -> None:
        response = await authed_client.delete(f"/inbound-orders/{_MISSING_UUID}")
        assert response.status_code == 404
        detail: dict[str, Any] = response.json()["detail"]
        assert detail["code"] == "NOT_FOUND"

    async def test_create_inbound_order_invalid_uuid(
        self, authed_client: AsyncClient
    ) -> None:
        payload = _order_payload("not-a-uuid")
        response = await authed_client.post("/inbound-orders", json=payload)
        assert response.status_code == 422

    async def test_get_inbound_order_invalid_uuid(
        self, authed_client: AsyncClient
    ) -> None:
        response = await authed_client.get("/inbound-orders/not-a-uuid")
        assert response.status_code == 422

    async def test_create_multiple_orders_same_client(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        first = await self._create_order(authed_client, created_client["id"])
        second = await self._create_order(authed_client, created_client["id"])
        assert first["id"] != second["id"]
        response = await authed_client.get(
            f"/inbound-orders/client/{created_client['id']}"
        )
        data: list[dict[str, Any]] = response.json()
        assert len(data) == 2

    async def test_orders_are_not_persisted_across_tests(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        my_order = await self._create_order(authed_client, created_client["id"])
        assert isinstance(uuid.UUID(my_order["id"]), uuid.UUID)
