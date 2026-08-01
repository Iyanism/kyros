import uuid
from collections.abc import Mapping

from httpx import AsyncClient


def _client_data() -> Mapping[str, str | int]:
    return {
        "name": "Acme Cold Storage",
        "email": f"acme{uuid.uuid4().hex[:8]}@example.com",
        "phone_number": "9876543210",
        "address": "42 Industrial Area",
        "city": "Pune",
        "state": "Maharashtra",
        "pin_code": 411001,
        "gstin": "27AABCA1234F1Z5",
    }


class TestClientRoute:
    async def test_create_client(self, client: AsyncClient):
        data = _client_data()
        response = await client.post("/clients", json=data)
        assert response.status_code == 201
        body = response.json()
        assert body["email"] == data["email"]
        assert body["name"] == data["name"]
        assert body["phone_number"] == data["phone_number"]

    async def test_create_client_duplicate(self, client: AsyncClient):
        data = _client_data()
        first = await client.post("/clients", json=data)
        assert first.status_code == 201
        response = await client.post("/clients", json=data)
        assert response.status_code == 400
        body = response.json()
        assert body["detail"]["code"] == "VALIDATION_ERROR"

    async def test_get_clients(self, client: AsyncClient):
        response = await client.get("/clients")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    async def test_get_client_by_id(self, client: AsyncClient):
        data = _client_data()
        created = await client.post("/clients", json=data)
        assert created.status_code == 201
        client_id = created.json()["id"]
        response = await client.get(f"/clients/{client_id}")
        assert response.status_code == 200
        assert response.json()["id"] == client_id

    async def test_get_client_not_found(self, client: AsyncClient):
        response = await client.get("/clients/00000000-0000-0000-0000-000000000000")
        assert response.status_code == 404

    async def test_update_client(self, client: AsyncClient):
        data = _client_data()
        created = await client.post("/clients", json=data)
        assert created.status_code == 201
        client_id = created.json()["id"]
        update_data = {"name": "New Name"}
        response = await client.patch(f"/clients/{client_id}", json=update_data)
        assert response.status_code == 200
        assert response.json()["name"] == update_data["name"]

    async def test_update_client_not_found(self, client: AsyncClient):
        response = await client.patch(
            "/clients/00000000-0000-0000-0000-000000000000", json={"name": "New Name"}
        )
        assert response.status_code == 404

    async def test_deactivate_client(self, client: AsyncClient):
        data = _client_data()
        created = await client.post("/clients", json=data)
        assert created.status_code == 201
        client_id = created.json()["id"]
        response = await client.patch(f"/clients/{client_id}/deactivate")
        assert response.status_code == 200

    async def test_deactivate_client_not_found(self, client: AsyncClient):
        response = await client.patch(
            "/clients/00000000-0000-0000-0000-000000000000/deactivate"
        )
        assert response.status_code == 404

    async def test_delete_client(self, client: AsyncClient):
        data = _client_data()
        created = await client.post("/clients", json=data)
        assert created.status_code == 201
        client_id = created.json()["id"]
        response = await client.delete(f"/clients/{client_id}")
        assert response.status_code == 204

    async def test_delete_client_not_found(self, client: AsyncClient):
        response = await client.delete("/clients/00000000-0000-0000-0000-000000000000")
        assert response.status_code == 404
