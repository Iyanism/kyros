
from collections.abc import Mapping

from httpx import AsyncClient


class TestAuthRoute:
    async def test_login_user(self, client: AsyncClient, created_user: Mapping[str, str], sample_user_data: Mapping[str, str]):
        login_payload = {
            "email": created_user["email"],
            "password": sample_user_data["password_hash"]
        }
        response = await client.post("/auth/login", json=login_payload)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == sample_user_data["email"]
        assert data["role"] == sample_user_data["role"]
        assert data["user_id"] == created_user["id"]


    async def test_login_user_not_found(self, client: AsyncClient):
        login_payload = {
            "email": "sample@gmail.com",
            "password": "8645728dnsdk",
        }
        response = await client.post("/auth/login", json=login_payload)
        assert response.status_code == 404

    async def test_client_register_user(self, client: AsyncClient, sample_user_data: Mapping[str, str], sample_client_data: Mapping[str, str]):
        user = {
            "email": sample_user_data["email"],
            "password_hash": sample_user_data["password_hash"],
            "full_name": sample_user_data["full_name"],
            "phone_number": sample_user_data["phone_number"],
        }
        register_payload = {
            "client": sample_client_data,
            "user": user
        }
        response = await client.post("/auth/register", json=register_payload)
        assert response.status_code == 201
        data = response.json()
        assert data["client"]["name"] == sample_client_data["name"]
        assert data["client"]["email"] == sample_client_data["email"]
        assert data["user"]["client_id"] == data["client"]["id"]
        assert data["user"]["email"] == sample_user_data["email"]
        assert data["user"]["full_name"] == sample_user_data["full_name"]
