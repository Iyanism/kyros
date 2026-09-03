from collections.abc import Mapping
from typing import Any

from httpx import AsyncClient

_MISSING_UUID = "00000000-0000-0000-0000-000000000000"


def _outbound_order_payload(client_id: str) -> dict[str, Any]:
    return {
        "client_id": client_id,
        "total_quantity": 1500.0,
        "items": [
            {"product_name": "Frozen Chicken", "quantity": 1000.0},
            {"product_name": "Chilled Vegetables", "quantity": 500.0},
        ],
    }


class TestOutboundOrderRoute:
    async def _create_order(
        self, authed_client: AsyncClient, client_id: str
    ) -> dict[str, Any]:
        payload = _outbound_order_payload(client_id)
        response = await authed_client.post("/outbound-orders", json=payload)
        assert response.status_code == 201
        return response.json()

    async def _update_status(
        self, authed_client: AsyncClient, order_id: str, status: str
    ) -> dict[str, Any]:
        response = await authed_client.patch(
            f"/outbound-orders/{order_id}/status", json={"status": status}
        )
        return response.json()

    async def test_outbound_orders_require_auth(self, client: AsyncClient) -> None:
        response = await client.get("/outbound-orders")
        assert response.status_code == 401

    async def test_create_outbound_order(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        order = await self._create_order(authed_client, created_client["id"])
        assert order["client_id"] == created_client["id"]
        assert order["total_quantity"] == 1500.0
        assert order["status"] == "draft"
        assert len(order["items"]) == 2
        assert order["items"][0]["product_name"] == "Frozen Chicken"
        assert order["items"][0]["quantity"] == 1000.0
        assert order["items"][1]["product_name"] == "Chilled Vegetables"
        assert order["items"][1]["quantity"] == 500.0

    async def test_create_outbound_order_client_not_found(
        self, authed_client: AsyncClient
    ) -> None:
        payload = _outbound_order_payload(_MISSING_UUID)
        response = await authed_client.post("/outbound-orders", json=payload)
        assert response.status_code == 404
        detail: dict[str, Any] = response.json()["detail"]
        assert detail["code"] == "NOT_FOUND"

    async def test_create_outbound_order_quantity_mismatch(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        payload = _outbound_order_payload(created_client["id"])
        payload["total_quantity"] = 99
        response = await authed_client.post("/outbound-orders", json=payload)
        assert response.status_code == 400
        detail: dict[str, Any] = response.json()["detail"]
        assert detail["code"] == "VALIDATION_ERROR"

    async def test_get_outbound_order(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        order = await self._create_order(authed_client, created_client["id"])
        response = await authed_client.get(f"/outbound-orders/{order['id']}")
        assert response.status_code == 200
        body: dict[str, Any] = response.json()
        assert body["id"] == order["id"]
        assert len(body["items"]) == 2

    async def test_get_outbound_order_not_found(
        self, authed_client: AsyncClient
    ) -> None:
        response = await authed_client.get(f"/outbound-orders/{_MISSING_UUID}")
        assert response.status_code == 404
        detail: dict[str, Any] = response.json()["detail"]
        assert detail["code"] == "NOT_FOUND"

    async def test_list_outbound_orders(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        await self._create_order(authed_client, created_client["id"])
        response = await authed_client.get("/outbound-orders")
        assert response.status_code == 200
        data: list[dict[str, Any]] = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert all(order["items"] is not None for order in data)

    async def test_list_outbound_orders_by_client(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        await self._create_order(authed_client, created_client["id"])
        response = await authed_client.get(
            f"/outbound-orders/client/{created_client['id']}"
        )
        assert response.status_code == 200
        data: list[dict[str, Any]] = response.json()
        assert len(data) >= 1
        assert all(order["client_id"] == created_client["id"] for order in data)

    async def test_list_outbound_orders_by_client_not_found(
        self, authed_client: AsyncClient
    ) -> None:
        response = await authed_client.get(f"/outbound-orders/client/{_MISSING_UUID}")
        assert response.status_code == 404
        detail: dict[str, Any] = response.json()["detail"]
        assert detail["code"] == "NOT_FOUND"

    async def test_update_outbound_order(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        order = await self._create_order(authed_client, created_client["id"])
        response = await authed_client.patch(
            f"/outbound-orders/{order['id']}",
            json={"total_quantity": 2000.0, "status": "approved"},
        )
        assert response.status_code == 200
        body: dict[str, Any] = response.json()
        assert body["total_quantity"] == 2000.0
        assert body["status"] == "approved"

    async def test_update_outbound_order_not_found(
        self, authed_client: AsyncClient
    ) -> None:
        response = await authed_client.patch(
            f"/outbound-orders/{_MISSING_UUID}", json={"total_quantity": 2000.0}
        )
        assert response.status_code == 404
        detail: dict[str, Any] = response.json()["detail"]
        assert detail["code"] == "NOT_FOUND"

    async def test_status_transition_happy_path(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        order = await self._create_order(authed_client, created_client["id"])
        order_id: str = order["id"]

        response = await authed_client.patch(
            f"/outbound-orders/{order_id}/status", json={"status": "submitted"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "submitted"

        response = await authed_client.patch(
            f"/outbound-orders/{order_id}/status", json={"status": "approved"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "approved"

    async def test_status_reject_is_terminal(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        order = await self._create_order(authed_client, created_client["id"])
        order_id: str = order["id"]

        response = await authed_client.patch(
            f"/outbound-orders/{order_id}/status", json={"status": "rejected"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "rejected"

        response = await authed_client.patch(
            f"/outbound-orders/{order_id}/status", json={"status": "approved"}
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
            f"/outbound-orders/{order_id}/status", json={"status": "dispatched"}
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

        await self._update_status(authed_client, order_id, "submitted")
        response = await authed_client.patch(
            f"/outbound-orders/{order_id}/status", json={"status": "submitted"}
        )
        assert response.status_code == 409
        detail: dict[str, Any] = response.json()["detail"]
        assert detail["code"] == "CONFLICT"
        assert "already in status" in detail["message"]

    async def test_status_transition_not_found(
        self, authed_client: AsyncClient
    ) -> None:
        response = await authed_client.patch(
            f"/outbound-orders/{_MISSING_UUID}/status",
            json={"status": "approved"},
        )
        assert response.status_code == 404
        detail: dict[str, Any] = response.json()["detail"]
        assert detail["code"] == "NOT_FOUND"

    async def test_delete_outbound_order(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        order = await self._create_order(authed_client, created_client["id"])
        response = await authed_client.delete(f"/outbound-orders/{order['id']}")
        assert response.status_code == 204
        get_response = await authed_client.get(f"/outbound-orders/{order['id']}")
        assert get_response.status_code == 404

    async def test_delete_outbound_order_not_found(
        self, authed_client: AsyncClient
    ) -> None:
        response = await authed_client.delete(f"/outbound-orders/{_MISSING_UUID}")
        assert response.status_code == 404
        detail: dict[str, Any] = response.json()["detail"]
        assert detail["code"] == "NOT_FOUND"

    async def test_create_outbound_order_invalid_uuid(
        self, authed_client: AsyncClient
    ) -> None:
        payload = _outbound_order_payload("not-a-uuid")
        response = await authed_client.post("/outbound-orders", json=payload)
        assert response.status_code == 422

    async def test_get_outbound_order_invalid_uuid(
        self, authed_client: AsyncClient
    ) -> None:
        response = await authed_client.get("/outbound-orders/not-a-uuid")
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
            f"/outbound-orders/client/{created_client['id']}"
        )
        data: list[dict[str, Any]] = response.json()
        assert len(data) == 2

    async def test_status_draft_to_rejected(
        self,
        authed_client: AsyncClient,
        created_client: Mapping[str, str],
    ) -> None:
        order = await self._create_order(authed_client, created_client["id"])
        order_id: str = order["id"]

        response = await authed_client.patch(
            f"/outbound-orders/{order_id}/status", json={"status": "rejected"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "rejected"
