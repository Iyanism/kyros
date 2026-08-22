import uuid
from typing import Any

from httpx import AsyncClient

from src.domains.warehouse.model import Slot
from tests.conftest import TestAsyncSessionLocal


def _chamber_payload(
    code: str | None = None, name: str | None = None
) -> dict[str, str | float | int]:
    uid = uuid.uuid4().hex[:6]
    payload: dict[str, str | float | int] = {
        "name": name or f"CH-{uid}",
        "code": code or f"C{uid[:4].upper()}",
        "category": "frozen",
        "temperature": -25.0,
        "num_racks": 2,
        "slots_per_rack": 3,
    }
    return payload


async def _create_chamber(
    authed_client: AsyncClient, payload: dict[str, str | float | int] | None = None
) -> dict[str, Any]:
    body = payload or _chamber_payload()
    resp = await authed_client.post("/warehouses/chambers", json=body)
    assert resp.status_code == 201, resp.text
    data: dict[str, Any] = resp.json()
    return data


async def _get_first_rack_id(authed_client: AsyncClient, chamber_id: str) -> str:
    resp = await authed_client.get(f"/warehouses/chambers/{chamber_id}/racks")
    assert resp.status_code == 200
    racks: list[dict[str, Any]] = resp.json()
    assert len(racks) >= 1
    rack_id: str = racks[0]["id"]
    return rack_id


async def _get_first_slot_id(authed_client: AsyncClient, rack_id: str) -> str:
    resp = await authed_client.get(f"/warehouses/racks/{rack_id}/slots")
    assert resp.status_code == 200
    slots: list[dict[str, Any]] = resp.json()
    assert len(slots) >= 1
    slot_id: str = slots[0]["id"]
    return slot_id


async def _mark_slot_occupied(slot_id: str) -> None:
    async with TestAsyncSessionLocal() as session:
        slot = await session.get(Slot, uuid.UUID(slot_id))
        assert slot is not None
        slot.is_occupied = True
        await session.commit()


class TestWarehouseRoute:
    async def test_warehouses_require_auth(self, client: AsyncClient) -> None:
        resp = await client.get("/warehouses/chambers")
        assert resp.status_code == 401

    async def test_create_chamber(self, authed_client: AsyncClient) -> None:
        payload = _chamber_payload()
        resp = await authed_client.post("/warehouses/chambers", json=payload)
        assert resp.status_code == 201
        body: dict[str, Any] = resp.json()
        assert body["code"] == payload["code"]
        assert body["name"] == payload["name"]
        num_racks = int(payload["num_racks"])
        slots_per_rack = int(payload["slots_per_rack"])
        assert body["total_racks"] == num_racks
        assert body["total_slots"] == num_racks * slots_per_rack
        assert body["total_capacity"] == float(body["total_slots"])
        assert body["used_capacity"] == 0.0

    async def test_create_chamber_duplicate_code(
        self, authed_client: AsyncClient
    ) -> None:
        payload = _chamber_payload()
        await _create_chamber(authed_client, payload)
        resp = await authed_client.post("/warehouses/chambers", json=payload)
        assert resp.status_code == 409
        detail: dict[str, Any] = resp.json()["detail"]
        assert detail["code"] == "ALREADY_EXISTS"

    async def test_create_chamber_invalid_category(
        self, authed_client: AsyncClient
    ) -> None:
        payload = _chamber_payload()
        payload["category"] = "banana"
        resp = await authed_client.post("/warehouses/chambers", json=payload)
        assert resp.status_code == 422

    async def test_create_chamber_zero_racks(self, authed_client: AsyncClient) -> None:
        payload = _chamber_payload()
        payload["num_racks"] = 0
        resp = await authed_client.post("/warehouses/chambers", json=payload)
        assert resp.status_code == 422

    async def test_list_chambers(self, authed_client: AsyncClient) -> None:
        await _create_chamber(authed_client)
        resp = await authed_client.get("/warehouses/chambers")
        assert resp.status_code == 200
        data: list[dict[str, Any]] = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    async def test_get_chamber(self, authed_client: AsyncClient) -> None:
        created = await _create_chamber(authed_client)
        chamber_id: str = created["id"]
        resp = await authed_client.get(f"/warehouses/chambers/{chamber_id}")
        assert resp.status_code == 200
        body: dict[str, Any] = resp.json()
        assert body["id"] == created["id"]

    async def test_get_chamber_not_found(self, authed_client: AsyncClient) -> None:
        resp = await authed_client.get(
            "/warehouses/chambers/00000000-0000-0000-0000-000000000000"
        )
        assert resp.status_code == 404
        detail: dict[str, Any] = resp.json()["detail"]
        assert detail["code"] == "NOT_FOUND"

    async def test_list_racks(self, authed_client: AsyncClient) -> None:
        chamber = await _create_chamber(authed_client)
        chamber_id: str = chamber["id"]
        resp = await authed_client.get(f"/warehouses/chambers/{chamber_id}/racks")
        assert resp.status_code == 200
        racks: list[dict[str, Any]] = resp.json()
        assert len(racks) == 2
        first: dict[str, Any] = racks[0]
        assert first["slot_count"] == 3
        assert first["occupied_count"] == 0
        assert isinstance(first["full_code"], str)

    async def test_get_rack(self, authed_client: AsyncClient) -> None:
        chamber = await _create_chamber(authed_client)
        chamber_id: str = chamber["id"]
        rack_id = await _get_first_rack_id(authed_client, chamber_id)
        resp = await authed_client.get(f"/warehouses/racks/{rack_id}")
        assert resp.status_code == 200
        body: dict[str, Any] = resp.json()
        assert body["id"] == rack_id

    async def test_add_rack(self, authed_client: AsyncClient) -> None:
        chamber = await _create_chamber(authed_client)
        chamber_id: str = chamber["id"]
        resp = await authed_client.post(
            f"/warehouses/chambers/{chamber_id}/racks?slots_per_rack=4"
        )
        assert resp.status_code == 201
        body: dict[str, Any] = resp.json()
        assert body["slot_count"] == 4
        # verify count increased
        list_resp = await authed_client.get(f"/warehouses/chambers/{chamber_id}/racks")
        racks: list[dict[str, Any]] = list_resp.json()
        assert len(racks) == 3

    async def test_add_rack_duplicate_number(self, authed_client: AsyncClient) -> None:
        chamber = await _create_chamber(authed_client)
        chamber_id: str = chamber["id"]
        resp = await authed_client.post(
            f"/warehouses/chambers/{chamber_id}/racks?rack_number=R01&slots_per_rack=2"
        )
        assert resp.status_code == 409
        detail: dict[str, Any] = resp.json()["detail"]
        assert detail["code"] == "ALREADY_EXISTS"

    async def test_list_slots(self, authed_client: AsyncClient) -> None:
        chamber = await _create_chamber(authed_client)
        chamber_id: str = chamber["id"]
        rack_id = await _get_first_rack_id(authed_client, chamber_id)
        resp = await authed_client.get(f"/warehouses/racks/{rack_id}/slots")
        assert resp.status_code == 200
        slots: list[dict[str, Any]] = resp.json()
        assert len(slots) == 3
        first: dict[str, Any] = slots[0]
        assert first["occupancy"] == "empty"
        assert first["is_occupied"] is False
        assert isinstance(first["full_code"], str)

    async def test_get_slot(self, authed_client: AsyncClient) -> None:
        chamber = await _create_chamber(authed_client)
        chamber_id: str = chamber["id"]
        rack_id = await _get_first_rack_id(authed_client, chamber_id)
        slot_id = await _get_first_slot_id(authed_client, rack_id)
        resp = await authed_client.get(f"/warehouses/slots/{slot_id}")
        assert resp.status_code == 200
        body: dict[str, Any] = resp.json()
        assert body["id"] == slot_id

    async def test_delete_slot_ok(self, authed_client: AsyncClient) -> None:
        chamber = await _create_chamber(authed_client)
        chamber_id: str = chamber["id"]
        rack_id = await _get_first_rack_id(authed_client, chamber_id)
        slot_id = await _get_first_slot_id(authed_client, rack_id)
        resp = await authed_client.delete(f"/warehouses/slots/{slot_id}")
        assert resp.status_code == 204
        # verify gone
        get_resp = await authed_client.get(f"/warehouses/slots/{slot_id}")
        assert get_resp.status_code == 404

    async def test_delete_slot_occupied_conflict(
        self, authed_client: AsyncClient
    ) -> None:
        chamber = await _create_chamber(authed_client)
        chamber_id: str = chamber["id"]
        rack_id = await _get_first_rack_id(authed_client, chamber_id)
        slot_id = await _get_first_slot_id(authed_client, rack_id)
        await _mark_slot_occupied(slot_id)
        resp = await authed_client.delete(f"/warehouses/slots/{slot_id}")
        assert resp.status_code == 409
        detail: dict[str, Any] = resp.json()["detail"]
        assert detail["code"] == "CONFLICT"

    async def test_delete_rack_occupied_conflict(
        self, authed_client: AsyncClient
    ) -> None:
        chamber = await _create_chamber(authed_client)
        chamber_id: str = chamber["id"]
        rack_id = await _get_first_rack_id(authed_client, chamber_id)
        slot_id = await _get_first_slot_id(authed_client, rack_id)
        await _mark_slot_occupied(slot_id)
        resp = await authed_client.delete(f"/warehouses/racks/{rack_id}")
        assert resp.status_code == 409
        detail: dict[str, Any] = resp.json()["detail"]
        assert detail["code"] == "CONFLICT"

    async def test_delete_rack_ok(self, authed_client: AsyncClient) -> None:
        payload = _chamber_payload()
        payload["num_racks"] = 1
        payload["slots_per_rack"] = 2
        chamber = await _create_chamber(authed_client, payload)
        chamber_id: str = chamber["id"]
        # add extra rack so delete does not wipe chamber
        extra = await authed_client.post(
            f"/warehouses/chambers/{chamber_id}/racks?slots_per_rack=2"
        )
        assert extra.status_code == 201
        extra_body: dict[str, Any] = extra.json()
        rack_id: str = extra_body["id"]
        resp = await authed_client.delete(f"/warehouses/racks/{rack_id}")
        assert resp.status_code == 204

    async def test_delete_chamber_occupied_conflict(
        self, authed_client: AsyncClient
    ) -> None:
        chamber = await _create_chamber(authed_client)
        chamber_id: str = chamber["id"]
        rack_id = await _get_first_rack_id(authed_client, chamber_id)
        slot_id = await _get_first_slot_id(authed_client, rack_id)
        await _mark_slot_occupied(slot_id)
        resp = await authed_client.delete(f"/warehouses/chambers/{chamber_id}")
        assert resp.status_code == 409
        detail: dict[str, Any] = resp.json()["detail"]
        assert detail["code"] == "CONFLICT"

    async def test_delete_chamber_ok(self, authed_client: AsyncClient) -> None:
        chamber = await _create_chamber(authed_client)
        chamber_id: str = chamber["id"]
        resp = await authed_client.delete(f"/warehouses/chambers/{chamber_id}")
        assert resp.status_code == 204
        get_resp = await authed_client.get(f"/warehouses/chambers/{chamber_id}")
        assert get_resp.status_code == 404

    async def test_full_code_format(self, authed_client: AsyncClient) -> None:
        payload = _chamber_payload()
        chamber = await _create_chamber(authed_client, payload)
        chamber_id: str = chamber["id"]
        code: str = chamber["code"]
        rack_resp = await authed_client.get(f"/warehouses/chambers/{chamber_id}/racks")
        racks: list[dict[str, Any]] = rack_resp.json()
        rack: dict[str, Any] = racks[0]
        slot_resp = await authed_client.get(f"/warehouses/racks/{rack['id']}/slots")
        slots: list[dict[str, Any]] = slot_resp.json()
        slot: dict[str, Any] = slots[0]
        # e.g. CAbc-R01 , CAbc-R01-S01
        rack_full_code: str = rack["full_code"]
        slot_full_code: str = slot["full_code"]
        rack_number: str = rack["rack_number"]
        slot_number: str = slot["slot_number"]
        assert rack_full_code.startswith(f"{code}-R")
        assert slot_full_code == f"{code}-{rack_number}-{slot_number}"
