from httpx import AsyncClient


class TestRoleAccess:
    async def test_admin_can_access_warehouses(
        self, authed_client: AsyncClient
    ) -> None:
        resp = await authed_client.get("/warehouses/chambers")
        assert resp.status_code == 200

    async def test_operator_can_access_warehouses(
        self, operator_client: AsyncClient
    ) -> None:
        resp = await operator_client.get("/warehouses/chambers")
        assert resp.status_code == 200

    async def test_client_cannot_access_warehouses(
        self, client_user_client: AsyncClient
    ) -> None:
        resp = await client_user_client.get("/warehouses/chambers")
        assert resp.status_code == 403

    async def test_admin_can_access_inbound_orders(
        self, authed_client: AsyncClient
    ) -> None:
        resp = await authed_client.get("/inbound-orders")
        assert resp.status_code == 200

    async def test_operator_can_access_inbound_orders(
        self, operator_client: AsyncClient
    ) -> None:
        resp = await operator_client.get("/inbound-orders")
        assert resp.status_code == 200

    async def test_client_can_access_inbound_orders(
        self, client_user_client: AsyncClient
    ) -> None:
        resp = await client_user_client.get("/inbound-orders")
        assert resp.status_code == 200

    async def test_admin_can_access_clients(
        self, authed_client: AsyncClient
    ) -> None:
        resp = await authed_client.get("/clients")
        assert resp.status_code == 200

    async def test_operator_cannot_access_clients(
        self, operator_client: AsyncClient
    ) -> None:
        resp = await operator_client.get("/clients")
        assert resp.status_code == 403

    async def test_client_cannot_access_clients(
        self, client_user_client: AsyncClient
    ) -> None:
        resp = await client_user_client.get("/clients")
        assert resp.status_code == 403

    async def test_admin_can_access_inventory(
        self, authed_client: AsyncClient
    ) -> None:
        resp = await authed_client.get("/inventory/inventory")
        assert resp.status_code == 200

    async def test_operator_can_access_inventory(
        self, operator_client: AsyncClient
    ) -> None:
        resp = await operator_client.get("/inventory/inventory")
        assert resp.status_code == 200

    async def test_client_can_access_own_inventory(
        self, client_user_client: AsyncClient
    ) -> None:
        resp = await client_user_client.get("/inventory/inventory")
        assert resp.status_code == 200

    async def test_admin_can_access_payments(
        self, authed_client: AsyncClient
    ) -> None:
        resp = await authed_client.get("/payments")
        assert resp.status_code == 200

    async def test_operator_can_access_payments(
        self, operator_client: AsyncClient
    ) -> None:
        resp = await operator_client.get("/payments")
        assert resp.status_code == 200

    async def test_client_can_access_payments(
        self, client_user_client: AsyncClient
    ) -> None:
        resp = await client_user_client.get("/payments")
        assert resp.status_code == 200

    async def test_admin_can_access_invoices(
        self, authed_client: AsyncClient
    ) -> None:
        resp = await authed_client.get("/invoices")
        assert resp.status_code == 200

    async def test_operator_can_access_invoices(
        self, operator_client: AsyncClient
    ) -> None:
        resp = await operator_client.get("/invoices")
        assert resp.status_code == 200

    async def test_client_can_access_invoices(
        self, client_user_client: AsyncClient
    ) -> None:
        resp = await client_user_client.get("/invoices")
        assert resp.status_code == 200

    async def test_admin_can_access_users(
        self, authed_client: AsyncClient
    ) -> None:
        resp = await authed_client.get("/users")
        assert resp.status_code == 200

    async def test_operator_cannot_access_users(
        self, operator_client: AsyncClient
    ) -> None:
        resp = await operator_client.get("/users")
        assert resp.status_code == 403

    async def test_client_cannot_access_users(
        self, client_user_client: AsyncClient
    ) -> None:
        resp = await client_user_client.get("/users")
        assert resp.status_code == 403
