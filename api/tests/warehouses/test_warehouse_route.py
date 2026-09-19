import uuid
from typing import Any

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.warehouse.model import Slot, SlotStatus


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
        "bays_per_rack": 3,
        "levels_per_rack": 1,
    }
    return payload


async def _create_chamber(
    authed_client: AsyncClient, payload: dict[str, str | float | int] | None = None
) -> dict[str, Any]:
    body = payload or _chamber_payload()
    resp = await authed_client.post("/warehouses/chamber", json=body)
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


async def _mark_slot_occupied(slot_id: str, session: AsyncSession) -> None:
    slot = await session.get(Slot, uuid.UUID(slot_id))
    assert slot is not None
    slot.status = SlotStatus.OCCUPIED


class TestWarehouseRoute:
    async def test_warehouses_require_auth(self, client: AsyncClient) -> None:
        resp = await client.get("/warehouses/chambers")
        assert resp.status_code == 401

    async def test_create_chamber(self, authed_client: AsyncClient) -> None:
        payload = _chamber_payload()
        resp = await authed_client.post("/warehouses/chamber", json=payload)
        assert resp.status_code == 201
        body: dict[str, Any] = resp.json()
        assert body["code"] == payload["code"]
        assert body["name"] == payload["name"]
        num_racks = int(payload["num_racks"])
        bays = int(payload["bays_per_rack"])
        levels = int(payload["levels_per_rack"])
        assert body["total_racks"] == num_racks
        assert body["total_slots"] == num_racks * bays * levels
        assert body["total_capacity"] == float(body["total_slots"])
        assert body["used_capacity"] == 0.0

    async def test_create_chamber_duplicate_code(
        self, authed_client: AsyncClient
    ) -> None:
        payload = _chamber_payload()
        await _create_chamber(authed_client, payload)
        resp = await authed_client.post("/warehouses/chamber", json=payload)
        assert resp.status_code == 409
        detail: dict[str, Any] = resp.json()["detail"]
        assert detail["code"] == "ALREADY_EXISTS"

    async def test_create_chamber_invalid_category(
        self, authed_client: AsyncClient
    ) -> None:
        payload = _chamber_payload()
        payload["category"] = "banana"
        resp = await authed_client.post("/warehouses/chamber", json=payload)
        assert resp.status_code == 422

    async def test_create_chamber_zero_racks(self, authed_client: AsyncClient) -> None:
        payload = _chamber_payload()
        payload["num_racks"] = 0
        resp = await authed_client.post("/warehouses/chamber", json=payload)
        assert resp.status_code == 422

    async def test_create_chamber_returns_nested_tree(
        self, authed_client: AsyncClient
    ) -> None:
        payload = _chamber_payload()
        resp = await authed_client.post("/warehouses/chamber", json=payload)
        assert resp.status_code == 201
        body: dict[str, Any] = resp.json()
        racks: list[dict[str, Any]] = body["racks"]
        assert len(racks) == payload["num_racks"]
        first: dict[str, Any] = racks[0]
        expected_slots = int(payload["bays_per_rack"]) * int(payload["levels_per_rack"])
        assert len(first["slots"]) == expected_slots
        slot: dict[str, Any] = first["slots"][0]
        assert slot["status"] == "available"
        # location_code format: CHxx-R01-B01-L01
        assert (
            slot["location_code"]
            == f"{body['code']}-{first['rack_number']}-B01-L01"
        )

    async def test_get_chamber_detail(self, authed_client: AsyncClient) -> None:
        created = await _create_chamber(authed_client)
        chamber_id: str = created["id"]
        resp = await authed_client.get(f"/warehouses/chambers/{chamber_id}/detail")
        assert resp.status_code == 200
        body: dict[str, Any] = resp.json()
        assert body["id"] == chamber_id
        racks: list[dict[str, Any]] = body["racks"]
        assert len(racks) == body["total_racks"]
        total_slots = sum(len(r["slots"]) for r in racks)
        assert total_slots == body["total_slots"]
        assert all(
            slot["status"] == "available" for r in racks for slot in r["slots"]
        )

    async def test_get_chamber_detail_not_found(
        self, authed_client: AsyncClient
    ) -> None:
        resp = await authed_client.get(
            "/warehouses/chambers/00000000-0000-0000-0000-000000000000/detail"
        )
        assert resp.status_code == 404
        detail: dict[str, Any] = resp.json()["detail"]
        assert detail["code"] == "NOT_FOUND"

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
            f"/warehouses/chambers/{chamber_id}/racks?bays_per_rack=4&levels_per_rack=1"
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
            f"/warehouses/chambers/{chamber_id}/racks?rack_number=R01&bays_per_rack=2&levels_per_rack=1"
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
        assert first["status"] == "available"
        assert isinstance(first["location_code"], str)

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
        self, authed_client: AsyncClient, db_session: AsyncSession
    ) -> None:
        chamber = await _create_chamber(authed_client)
        chamber_id: str = chamber["id"]
        rack_id = await _get_first_rack_id(authed_client, chamber_id)
        slot_id = await _get_first_slot_id(authed_client, rack_id)
        await _mark_slot_occupied(slot_id, db_session)
        resp = await authed_client.delete(f"/warehouses/slots/{slot_id}")
        assert resp.status_code == 409
        detail: dict[str, Any] = resp.json()["detail"]
        assert detail["code"] == "CONFLICT"

    async def test_delete_rack_occupied_conflict(
        self, authed_client: AsyncClient, db_session: AsyncSession
    ) -> None:
        chamber = await _create_chamber(authed_client)
        chamber_id: str = chamber["id"]
        rack_id = await _get_first_rack_id(authed_client, chamber_id)
        slot_id = await _get_first_slot_id(authed_client, rack_id)
        await _mark_slot_occupied(slot_id, db_session)
        resp = await authed_client.delete(f"/warehouses/racks/{rack_id}")
        assert resp.status_code == 409
        detail: dict[str, Any] = resp.json()["detail"]
        assert detail["code"] == "CONFLICT"

    async def test_delete_rack_ok(self, authed_client: AsyncClient) -> None:
        payload = _chamber_payload()
        payload["num_racks"] = 1
        payload["bays_per_rack"] = 2
        payload["levels_per_rack"] = 1
        chamber = await _create_chamber(authed_client, payload)
        chamber_id: str = chamber["id"]
        # add extra rack so delete does not wipe chamber
        extra = await authed_client.post(
            f"/warehouses/chambers/{chamber_id}/racks?bays_per_rack=2&levels_per_rack=1"
        )
        assert extra.status_code == 201
        extra_body: dict[str, Any] = extra.json()
        rack_id: str = extra_body["id"]
        resp = await authed_client.delete(f"/warehouses/racks/{rack_id}")
        assert resp.status_code == 204

    async def test_delete_chamber_occupied_conflict(
        self, authed_client: AsyncClient, db_session: AsyncSession
    ) -> None:
        chamber = await _create_chamber(authed_client)
        chamber_id: str = chamber["id"]
        rack_id = await _get_first_rack_id(authed_client, chamber_id)
        slot_id = await _get_first_slot_id(authed_client, rack_id)
        await _mark_slot_occupied(slot_id, db_session)
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

    async def test_location_code_format(self, authed_client: AsyncClient) -> None:
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
        # e.g. CAbc-R01 , CAbc-R01-B01-L01
        rack_full_code: str = rack["full_code"]
        slot_location_code: str = slot["location_code"]
        rack_number: str = rack["rack_number"]
        bay: int = slot["bay"]
        level: int = slot["level"]
        assert rack_full_code.startswith(f"{code}-R")
        assert slot_location_code == f"{code}-{rack_number}-B{bay:02d}-L{level:02d}"
