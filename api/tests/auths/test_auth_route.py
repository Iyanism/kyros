import uuid
from collections.abc import Mapping

from httpx import AsyncClient


class TestAuthRoute:
    async def test_login_user(
        self,
        client: AsyncClient,
        created_user: Mapping[str, str],
        sample_user_data: Mapping[str, str],
    ):
        login_payload = {
            "email": created_user["email"],
            "password": sample_user_data["password_hash"],
        }
        response = await client.post("/auth/login", json=login_payload)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == sample_user_data["email"]
        assert data["role"] == sample_user_data["role"]
        assert data["user_id"] == created_user["id"]
        assert "access_token" in data
        assert "refresh_token" in data

    async def test_login_user_not_found(self, client: AsyncClient):
        login_payload = {
            "email": "sample@gmail.com",
            "password": "8645728dnsdk",
        }
        response = await client.post("/auth/login", json=login_payload)
        assert response.status_code == 404

    async def test_login_sets_cookies(
        self,
        client: AsyncClient,
        created_user: Mapping[str, str],
        sample_user_data: Mapping[str, str],
    ):
        login_payload = {
            "email": created_user["email"],
            "password": sample_user_data["password_hash"],
        }
        response = await client.post("/auth/login", json=login_payload)
        assert response.status_code == 200
        assert "access_token" in response.cookies
        assert "refresh_token" in response.cookies

    async def test_client_register_user(
        self,
        client: AsyncClient,
        sample_user_data: Mapping[str, str],
        sample_client_data: Mapping[str, str],
    ):
        user = {
            "email": sample_user_data["email"],
            "password_hash": sample_user_data["password_hash"],
            "full_name": sample_user_data["full_name"],
            "phone_number": sample_user_data["phone_number"],
        }
        register_payload = {"client": sample_client_data, "user": user}
        response = await client.post("/auth/register", json=register_payload)
        assert response.status_code == 201
        data = response.json()
        assert data["client"]["name"] == sample_client_data["name"]
        assert data["client"]["email"] == sample_client_data["email"]
        assert data["user"]["client_id"] == data["client"]["id"]
        assert data["user"]["email"] == sample_user_data["email"]
        assert data["user"]["full_name"] == sample_user_data["full_name"]
        assert "access_token" in data["login_info"]
        assert "refresh_token" in data["login_info"]

    async def test_register_sets_cookies(
        self,
        client: AsyncClient,
    ):
        register_payload = {
            "client": {
                "name": "Cookie Co",
                "email": f"cookie{uuid.uuid4().hex[:8]}@example.com",
                "phone_number": "9000000006",
                "address": "Cookie Address",
                "city": "Pune",
                "state": "Maharashtra",
                "pin_code": 411001,
            },
            "user": {
                "email": f"cookieuser{uuid.uuid4().hex[:8]}@gmail.com",
                "password_hash": "secret123",
                "full_name": "Cookie User",
                "phone_number": "9000000007",
            },
        }
        response = await client.post("/auth/register", json=register_payload)
        assert response.status_code == 201
        assert "access_token" in response.cookies
        assert "refresh_token" in response.cookies

    async def test_refresh_token(
        self,
        client: AsyncClient,
        created_user: Mapping[str, str],
        sample_user_data: Mapping[str, str],
    ):
        login_payload = {
            "email": created_user["email"],
            "password": sample_user_data["password_hash"],
        }
        login_response = await client.post("/auth/login", json=login_payload)
        assert login_response.status_code == 200

        refresh_cookie = login_response.cookies.get("refresh_token")
        assert refresh_cookie is not None

        refresh_response = await client.post(
            "/auth/refresh",
            cookies={"refresh_token": refresh_cookie},
        )
        assert refresh_response.status_code == 200
        data = refresh_response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user_id"] == created_user["id"]

    async def test_refresh_token_invalid(self, client: AsyncClient):
        response = await client.post(
            "/auth/refresh",
            cookies={"refresh_token": "invalidtoken"},
        )
        assert response.status_code == 401

    async def test_refresh_token_missing(self, client: AsyncClient):
        response = await client.post("/auth/refresh")
        assert response.status_code == 401

    async def test_logout_clears_cookies(
        self,
        client: AsyncClient,
        created_user: Mapping[str, str],
        sample_user_data: Mapping[str, str],
    ):
        login_payload = {
            "email": created_user["email"],
            "password": sample_user_data["password_hash"],
        }
        login_response = await client.post("/auth/login", json=login_payload)
        assert login_response.status_code == 200

        logout_response = await client.post("/auth/logout")
        assert logout_response.status_code == 204

    async def test_get_current_user(self, client: AsyncClient):
        register_payload = {
            "client": {
                "name": "Me Co",
                "email": f"me{uuid.uuid4().hex[:8]}@example.com",
                "phone_number": "9000000004",
                "address": "Me Address",
                "city": "Pune",
                "state": "Maharashtra",
                "pin_code": 411001,
            },
            "user": {
                "email": f"me{uuid.uuid4().hex[:8]}@gmail.com",
                "password_hash": "secret123",
                "full_name": "Me User",
                "phone_number": "9000000005",
            },
        }
        registration = await client.post("/auth/register", json=register_payload)
        assert registration.status_code == 201
        token = registration.json()["login_info"]["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.get("/auth/me", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == register_payload["user"]["email"]
        assert data["full_name"] == register_payload["user"]["full_name"]

    async def test_get_current_user_via_cookie(self, client: AsyncClient):
        register_payload = {
            "client": {
                "name": "Cookie Me Co",
                "email": f"cookieme{uuid.uuid4().hex[:8]}@example.com",
                "phone_number": "9000000008",
                "address": "Cookie Me Address",
                "city": "Pune",
                "state": "Maharashtra",
                "pin_code": 411001,
            },
            "user": {
                "email": f"cookiemeuser{uuid.uuid4().hex[:8]}@gmail.com",
                "password_hash": "secret123",
                "full_name": "Cookie Me User",
                "phone_number": "9000000009",
            },
        }
        registration = await client.post("/auth/register", json=register_payload)
        assert registration.status_code == 201

        response = await client.get("/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == register_payload["user"]["email"]

    async def test_get_current_user_requires_auth(self, client: AsyncClient):
        response = await client.get("/auth/me")
        assert response.status_code == 401
