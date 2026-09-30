
from httpx import AsyncClient

_MISSING_UUID = "00000000-0000-0000-0000-000000000000"


class TestClientScopedAccess:
    """Verify CLIENT users are denied access to another client's resources."""

    async def test_inbound_orders_by_other_client(
        self, second_client_user_client: AsyncClient
    ) -> None:
        resp = await second_client_user_client.get(
            f"/inbound-orders/client/{_MISSING_UUID}"
        )
        assert resp.status_code == 403

    async def test_outbound_orders_by_other_client(
        self, second_client_user_client: AsyncClient
    ) -> None:
        resp = await second_client_user_client.get(
            f"/outbound-orders/client/{_MISSING_UUID}"
        )
        assert resp.status_code == 403

    async def test_inventory_summary_other_client(
        self, second_client_user_client: AsyncClient
    ) -> None:
        resp = await second_client_user_client.get(
            f"/inventory/clients/{_MISSING_UUID}/inventory/summary"
        )
        assert resp.status_code == 403

    async def test_inventory_pallets_other_client(
        self, second_client_user_client: AsyncClient
    ) -> None:
        resp = await second_client_user_client.get(
            f"/inventory/clients/{_MISSING_UUID}/inventory"
        )
        assert resp.status_code == 403

    async def test_invoices_by_other_client(
        self, second_client_user_client: AsyncClient
    ) -> None:
        resp = await second_client_user_client.get(
            f"/invoices/client/{_MISSING_UUID}"
        )
        assert resp.status_code == 403

    async def test_payments_by_other_client(
        self, second_client_user_client: AsyncClient
    ) -> None:
        resp = await second_client_user_client.get(
            f"/payments/client/{_MISSING_UUID}"
        )
        assert resp.status_code == 403

    async def test_stock_levels_other_client(
        self, second_client_user_client: AsyncClient
    ) -> None:
        resp = await second_client_user_client.get(
            f"/stock-movements/levels/client/{_MISSING_UUID}"
        )
        assert resp.status_code == 403

    async def test_stock_movements_other_client(
        self, second_client_user_client: AsyncClient
    ) -> None:
        resp = await second_client_user_client.get(
            f"/stock-movements/movements/client/{_MISSING_UUID}"
        )
        assert resp.status_code == 403
