from collections.abc import Mapping

from httpx import AsyncClient


class TestUserRoute:

    async def test_create_user(self, client: AsyncClient, sample_user_data: Mapping[str, str]):
        response = await client.post("/users", json=sample_user_data)
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == sample_user_data["email"]
        assert data["full_name"] == sample_user_data["full_name"]
        assert data["phone_number"] == sample_user_data["phone_number"]

    async def test_create_user_duplicate(self, client: AsyncClient, created_user: Mapping[str, str], sample_user_data: Mapping[str, str]):
        response = await client.post("/users", json=sample_user_data)
        assert response.status_code == 400
        data = response.json()
        assert data["detail"]["code"] == "VALIDATION_ERROR"

    async def test_get_users(self, client: AsyncClient):
        response = await client.get("/users")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    async def test_get_user_by_id(self, client: AsyncClient, created_user: Mapping[str, str]):
        user_id = created_user["id"]
        response = await client.get(f"/users/{user_id}")
        assert response.status_code == 200
        assert response.json()["id"] == user_id

    async def test_get_user_not_found(self, client: AsyncClient):
        response = await client.get("/users/00000000-0000-0000-0000-000000000000")
        assert response.status_code == 404

    async def test_update_user(self, client: AsyncClient, created_user: Mapping[str, str]):
        user_id = created_user["id"]
        update_data = {"full_name": "Hello"}
        response = await client.patch(f"/users/{user_id}", json=update_data)
        assert response.status_code == 200
        assert response.json()["full_name"] == update_data["full_name"]

    async def test_update_user_not_found(self, client: AsyncClient):
        response = await client.patch("/users/00000000-0000-0000-0000-000000000000", json={"full_name": "Hello"})
        assert response.status_code == 404

    async def test_delete_user(self, client: AsyncClient, created_user: Mapping[str, str]):
        user_id = created_user["id"]
        response = await client.delete(f"/users/{user_id}")
        assert response.status_code == 204

    async def test_delete_user_not_found(self, client: AsyncClient):
        response = await client.delete("/users/00000000-0000-0000-0000-000000000000")
        print(response.json())
        assert response.status_code == 404
