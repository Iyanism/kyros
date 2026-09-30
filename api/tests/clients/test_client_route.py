from collections.abc import Mapping
from typing import Any

from httpx import AsyncClient


class TestClientRoute:
    async def test_create_client(
        self, authed_client: AsyncClient, sample_client_data: Mapping[str, str]
    ):
        response = await authed_client.post("/clients", json=sample_client_data)
        assert response.status_code == 201
        body = response.json()
        assert body["email"] == sample_client_data["email"]
        assert body["name"] == sample_client_data["name"]
        assert body["phone_number"] == sample_client_data["phone_number"]

    async def test_create_client_duplicate(
        self,
        authed_client: AsyncClient,
        sample_client_data: Mapping[str, str],
        created_client: Mapping[str, str],
    ):
        response = await authed_client.post("/clients", json=sample_client_data)
        assert response.status_code == 409
        body = response.json()
        assert body["detail"]["code"] == "CLIENT_ALREADY_EXISTS"

    async def test_create_client_invalid_phone(
        self, authed_client: AsyncClient, sample_client_data: Mapping[str, str]
    ):
        for phone in ("12345678901", "982319845x", "123456789"):
            payload = {**sample_client_data, "phone_number": phone}
            response = await authed_client.post("/clients", json=payload)
            assert response.status_code == 422
            detail = response.json()["detail"]
            assert isinstance(detail, list)
            assert detail[0]["loc"][1] == "phone_number"

    async def test_update_client_invalid_phone(
        self, authed_client: AsyncClient, created_client: Mapping[str, str]
    ):
        client_id = created_client["id"]
        response = await authed_client.patch(
            f"/clients/{client_id}", json={"phone_number": "98231984567890"}
        )
        assert response.status_code == 422

    async def test_get_clients(
        self, authed_client: AsyncClient, created_client: Mapping[str, str]
    ):
        response = await authed_client.get("/clients")
        assert response.status_code == 200
        data: Mapping[str, Any] = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    async def test_get_client_by_id(
        self, authed_client: AsyncClient, created_client: Mapping[str, str]
    ):
        client_id = created_client["id"]
        response = await authed_client.get(f"/clients/{client_id}")
        assert response.status_code == 200
        assert response.json()["id"] == client_id

    async def test_get_client_not_found(self, authed_client: AsyncClient):
        response = await authed_client.get(
            "/clients/00000000-0000-0000-0000-000000000000"
        )
        assert response.status_code == 404

    async def test_update_client(
        self, authed_client: AsyncClient, created_client: Mapping[str, str]
    ):
        client_id = created_client["id"]
        update_data = {"name": "New Name"}
        response = await authed_client.patch(f"/clients/{client_id}", json=update_data)
        assert response.status_code == 200
        assert response.json()["name"] == update_data["name"]

    async def test_update_client_not_found(self, authed_client: AsyncClient):
        response = await authed_client.patch(
            "/clients/00000000-0000-0000-0000-000000000000", json={"name": "New Name"}
        )
        assert response.status_code == 404

    async def test_deactivate_client(
        self, authed_client: AsyncClient, created_client: Mapping[str, str]
    ):
        client_id = created_client["id"]
        response = await authed_client.patch(f"/clients/{client_id}/status")
        assert response.status_code == 200

    async def test_deactivate_client_not_found(self, authed_client: AsyncClient):
        response = await authed_client.patch(
            "/clients/00000000-0000-0000-0000-000000000000/status"
        )
        assert response.status_code == 404

    async def test_delete_client(
        self, authed_client: AsyncClient, created_client: Mapping[str, str]
    ):
        client_id = created_client["id"]
        response = await authed_client.delete(f"/clients/{client_id}")
        assert response.status_code == 204

    async def test_delete_client_not_found(self, authed_client: AsyncClient):
        response = await authed_client.delete(
            "/clients/00000000-0000-0000-0000-000000000000"
        )
        assert response.status_code == 404

    async def test_clients_require_auth(self, client: AsyncClient):
        response = await client.get("/clients")
        assert response.status_code == 401
