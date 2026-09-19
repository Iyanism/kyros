import uuid

from httpx import AsyncClient

from tests.conftest import (
    advance_to_processing,
    allocate,
    create_chamber,
    create_client_for_setup,
    create_order,
    mark_reserved,
    palletise,
    setup_invoice,
)

_MISSING_UUID = "00000000-0000-0000-0000-000000000000"


class TestWriteRoleAccess:
    """Verify OPERATOR and CLIENT are denied ADMIN-only write endpoints."""

    # --- POST /invoices/generate (ADMIN-only) ---

    async def test_generate_invoice_denied_operator(
        self, operator_client: AsyncClient
    ) -> None:
        resp = await operator_client.post(
            "/invoices/generate",
            json={
                "client_id": _MISSING_UUID,
                "billing_period_start": "2026-01-01T00:00:00Z",
                "billing_period_end": "2026-01-31T23:59:59Z",
            },
        )
        assert resp.status_code == 403

    async def test_generate_invoice_denied_client(
        self, client_user_client: AsyncClient
    ) -> None:
        resp = await client_user_client.post(
            "/invoices/generate",
            json={
                "client_id": _MISSING_UUID,
                "billing_period_start": "2026-01-01T00:00:00Z",
                "billing_period_end": "2026-01-31T23:59:59Z",
            },
        )
        assert resp.status_code == 403

    # --- PATCH /invoices/{id}/status (ADMIN-only) ---

    async def test_update_invoice_status_denied_operator(
        self, operator_client: AsyncClient
    ) -> None:
        resp = await operator_client.patch(
            f"/invoices/{_MISSING_UUID}/status",
            json={"status": "sent"},
        )
        assert resp.status_code == 403

    async def test_update_invoice_status_denied_client(
        self, client_user_client: AsyncClient
    ) -> None:
        resp = await client_user_client.patch(
            f"/invoices/{_MISSING_UUID}/status",
            json={"status": "sent"},
        )
        assert resp.status_code == 403

    # --- POST /payments/{id}/refund (ADMIN-only) ---

    async def test_refund_payment_denied_operator(
        self, operator_client: AsyncClient
    ) -> None:
        resp = await operator_client.post(f"/payments/{_MISSING_UUID}/refund")
        assert resp.status_code == 403

    async def test_refund_payment_denied_client(
        self, client_user_client: AsyncClient
    ) -> None:
        resp = await client_user_client.post(f"/payments/{_MISSING_UUID}/refund")
        assert resp.status_code == 403

    # --- PATCH /inbound-orders/{id}/status (ADMIN + OPERATOR) ---

    async def test_update_order_status_denied_client(
        self, client_user_client: AsyncClient
    ) -> None:
        resp = await client_user_client.patch(
            f"/inbound-orders/{_MISSING_UUID}/status",
            json={"status": "approved"},
        )
        assert resp.status_code == 403

    # --- DELETE /inbound-orders/{id} (ADMIN + OPERATOR) ---

    async def test_delete_order_denied_client(
        self, client_user_client: AsyncClient
    ) -> None:
        resp = await client_user_client.delete(f"/inbound-orders/{_MISSING_UUID}")
        assert resp.status_code == 403

    # --- POST /inventory/pick-list (ADMIN + OPERATOR) ---

    async def test_generate_pick_list_denied_client(
        self, client_user_client: AsyncClient
    ) -> None:
        resp = await client_user_client.post(
            "/inventory/pick-list",
            json={"outbound_order_id": _MISSING_UUID},
        )
        assert resp.status_code == 403

    # --- PATCH /outbound-orders/{id}/status (ADMIN + OPERATOR) ---

    async def test_update_outbound_status_denied_client(
        self, client_user_client: AsyncClient
    ) -> None:
        resp = await client_user_client.patch(
            f"/outbound-orders/{_MISSING_UUID}/status",
            json={"status": "approved"},
        )
        assert resp.status_code == 403

    # --- DELETE /outbound-orders/{id} (ADMIN + OPERATOR) ---

    async def test_delete_outbound_order_denied_client(
        self, client_user_client: AsyncClient
    ) -> None:
        resp = await client_user_client.delete(f"/outbound-orders/{_MISSING_UUID}")
        assert resp.status_code == 403

    # --- POST /inventory/orders/{id}/pallets (ADMIN + OPERATOR) ---

    async def test_palletise_denied_client(
        self, client_user_client: AsyncClient
    ) -> None:
        resp = await client_user_client.post(
            f"/inventory/orders/{_MISSING_UUID}/pallets"
        )
        assert resp.status_code == 403

    # --- POST /inventory/orders/{id}/allocate (ADMIN + OPERATOR) ---

    async def test_allocate_denied_client(
        self, client_user_client: AsyncClient
    ) -> None:
        resp = await client_user_client.post(
            f"/inventory/orders/{_MISSING_UUID}/allocate",
            json={"chamber_id": _MISSING_UUID},
        )
        assert resp.status_code == 403
