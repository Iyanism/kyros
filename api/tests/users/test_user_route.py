import uuid
from collections.abc import Mapping
from typing import Any

from httpx import AsyncClient


class TestUserRoute:
    async def test_create_user(
        self, authed_client: AsyncClient, sample_user_data: Mapping[str, str]
    ):
        response = await authed_client.post("/users", json=sample_user_data)
        assert response.status_code == 201
        data: Mapping[str, Any] = response.json()
        assert data["email"] == sample_user_data["email"]
        assert data["full_name"] == sample_user_data["full_name"]
        assert data["phone_number"] == sample_user_data["phone_number"]

    async def test_create_user_duplicate(
        self,
        authed_client: AsyncClient,
        created_user: Mapping[str, str],
        sample_user_data: Mapping[str, str],
    ):
        response = await authed_client.post("/users", json=sample_user_data)
        assert response.status_code == 400
        data: Mapping[str, Any] = response.json()
        assert data["detail"]["code"] == "VALIDATION_ERROR"

    async def test_get_users(self, authed_client: AsyncClient):
        response = await authed_client.get("/users")
        assert response.status_code == 200
        data: Mapping[str, Any] = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    async def test_get_user_by_id(
        self, authed_client: AsyncClient, created_user: Mapping[str, str]
    ):
        user_id = created_user["id"]
        response = await authed_client.get(f"/users/{user_id}")
        assert response.status_code == 200
        assert response.json()["id"] == user_id

    async def test_get_user_not_found(self, authed_client: AsyncClient):
        response = await authed_client.get(
            "/users/00000000-0000-0000-0000-000000000000"
        )
        assert response.status_code == 404

    async def test_update_user(
        self, authed_client: AsyncClient, created_user: Mapping[str, str]
    ):
        user_id = created_user["id"]
        update_data = {"full_name": "Hello"}
        response = await authed_client.patch(f"/users/{user_id}", json=update_data)
        assert response.status_code == 200
        assert response.json()["full_name"] == update_data["full_name"]

    async def test_update_user_not_found(self, authed_client: AsyncClient):
        response = await authed_client.patch(
            "/users/00000000-0000-0000-0000-000000000000", json={"full_name": "Hello"}
        )
        assert response.status_code == 404

    async def test_delete_user(
        self, authed_client: AsyncClient, created_user: Mapping[str, str]
    ):
        user_id = created_user["id"]
        response = await authed_client.delete(f"/users/{user_id}")
        assert response.status_code == 204

    async def test_delete_user_not_found(self, authed_client: AsyncClient):
        response = await authed_client.delete(
            "/users/00000000-0000-0000-0000-000000000000"
        )
        assert response.status_code == 404

    async def test_deactivate_user(
        self, authed_client: AsyncClient, created_user: Mapping[str, str]
    ):
        user_id = created_user["id"]
        response = await authed_client.patch(f"/users/{user_id}/status")
        assert response.status_code == 200

    async def test_deactivate_user_not_found(self, authed_client: AsyncClient):
        response = await authed_client.patch(
            "/users/00000000-0000-0000-0000-000000000000/status"
        )
        assert response.status_code == 404

    async def test_users_require_auth(self, client: AsyncClient):
        response = await client.get("/users")
        assert response.status_code == 401

    async def test_users_reject_invalid_token(self, client: AsyncClient):
        response = await client.get(
            "/users", headers={"Authorization": "Bearer invalid.token.value"}
        )
        assert response.status_code == 401

    async def test_deactivated_user_rejected(
        self, client: AsyncClient, authed_client: AsyncClient
    ):
        register_payload = {
            "client": {
                "name": "Blocked Co",
                "email": f"blocked{uuid.uuid4().hex[:8]}@example.com",
                "phone_number": "9000000002",
                "address": "Blocked Address",
                "city": "Pune",
                "state": "Maharashtra",
                "pin_code": 411001,
            },
            "user": {
                "email": f"blocked{uuid.uuid4().hex[:8]}@gmail.com",
                "password_hash": "secret123",
                "full_name": "Blocked User",
                "phone_number": "9000000003",
            },
        }
        registration = await client.post("/auth/register", json=register_payload)
        assert registration.status_code == 201
        token = registration.json()["login_info"]["access_token"]
        user_id = registration.json()["user"]["id"]
        blocked_headers = {"Authorization": f"Bearer {token}"}

        deactivate = await authed_client.patch(f"/users/{user_id}/status")
        assert deactivate.status_code == 200

        response = await client.get("/auth/me", headers=blocked_headers)
        assert response.status_code == 403
