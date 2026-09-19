import uuid
from collections.abc import AsyncGenerator, Mapping

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import NullPool, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.core.config import settings
from src.core.database import Base, get_db
from src.core.security import hash_password
from src.domains.users.model import User, UserRole
from src.main import app

# ---------------------------------------------------------------------------
# Engine & session factory (shared across all tests)
# ---------------------------------------------------------------------------
test_engine = create_async_engine(
    settings.DATABASE_URL, poolclass=NullPool, echo=False
)
TestAsyncSessionLocal = async_sessionmaker(
    test_engine, expire_on_commit=False, class_=AsyncSession
)


# ---------------------------------------------------------------------------
# Per-test DB isolation via SAVEPOINT rollback
# ---------------------------------------------------------------------------
@pytest.fixture(autouse=True)
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Wrap every test in a SAVEPOINT that is rolled back on teardown.

    The override_get_db dependency yields *this* session so that HTTP
    requests executed during the test share the same transaction.
    Auth fixtures use separate sessions and commit independently.
    """
    async with TestAsyncSessionLocal() as session:
        trans = await session.begin_nested()  # SAVEPOINT
        app.dependency_overrides[get_db] = lambda: session
        yield session
        app.dependency_overrides.clear()
        await trans.rollback()  # undo everything in the SAVEPOINT


# ---------------------------------------------------------------------------
# Session-scoped schema setup
# ---------------------------------------------------------------------------
@pytest.fixture(scope="session", autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


# ---------------------------------------------------------------------------
# Helper functions (importable by other test modules)
# ---------------------------------------------------------------------------
async def create_chamber(
    authed_client: AsyncClient, category: str = "frozen"
) -> dict:
    uid = uuid.uuid4().hex[:6]
    payload = {
        "name": f"Chamber-{category}-{uid}",
        "code": f"C{uid[:4].upper()}",
        "category": category,
        "temperature": -18.0 if category == "frozen" else 4.0,
        "num_racks": 1,
        "bays_per_rack": 2,
        "levels_per_rack": 2,
    }
    resp = await authed_client.post("/warehouses/chamber", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


async def create_client_for_setup(authed_client: AsyncClient) -> dict:
    payload = {
        "name": f"TestClient-{uuid.uuid4().hex[:6]}",
        "email": f"client-{uuid.uuid4().hex[:8]}@test.com",
        "phone_number": "9000000001",
        "address": "123 Test St",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pin_code": "400001",
        "gstin": "27AAACF0000F1Z2",
    }
    resp = await authed_client.post("/clients", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


async def create_order(authed_client: AsyncClient, client_id: str) -> dict:
    payload = {
        "client_id": client_id,
        "expected_delivery_date": "2026-12-31",
        "items": [
            {
                "product_name": "Frozen Peas",
                "quantity": 1500,
                "unit": "kg",
                "temperature_category": "frozen",
                "batch_number": f"BATCH-{uuid.uuid4().hex[:6]}",
            }
        ],
    }
    resp = await authed_client.post("/inbound-orders", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


async def advance_to_processing(
    authed_client: AsyncClient, order_id: str
) -> None:
    for s in ("approved", "in_transit", "arrived", "processing"):
        resp = await authed_client.patch(
            f"/inbound-orders/{order_id}/status", json={"status": s}
        )
        assert resp.status_code == 200, resp.text


async def palletise(authed_client: AsyncClient, order_id: str) -> dict:
    resp = await authed_client.post(
        f"/inventory/orders/{order_id}/pallets"
    )
    assert resp.status_code == 200, resp.text
    return resp.json()


async def mark_reserved(authed_client: AsyncClient, client_id: str) -> None:
    """Mark all available frozen slots as reserved for a client."""
    from src.domains.warehouse.model import Chamber, Rack, Slot, SlotStatus

    async with TestAsyncSessionLocal() as session:
        stmt = (
            select(Slot)
            .join(Rack, Slot.rack_id == Rack.id)
            .join(Chamber, Rack.chamber_id == Chamber.id)
            .where(
                Slot.status == SlotStatus.AVAILABLE,
                Chamber.category == "frozen",
            )
        )
        result = await session.execute(stmt)
        slots = result.scalars().all()
        for slot in slots:
            slot.status = SlotStatus.RESERVED
            slot.allocated_client_id = uuid.UUID(client_id)
        await session.commit()


async def allocate(
    authed_client: AsyncClient, order_id: str, chamber_id: str
) -> dict:
    resp = await authed_client.post(
        f"/inventory/orders/{order_id}/allocate",
        json={"chamber_id": chamber_id},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()


async def setup_invoice(authed_client: AsyncClient) -> dict:
    """Create a chamber, order, palletise, reserve, allocate, and generate invoice."""
    chamber = await create_chamber(authed_client, "frozen")
    client = await create_client_for_setup(authed_client)
    order = await create_order(authed_client, client["id"])
    await advance_to_processing(authed_client, order["id"])
    await palletise(authed_client, order["id"])
    await mark_reserved(authed_client, client["id"])
    await allocate(authed_client, order["id"], chamber["id"])

    resp = await authed_client.post(
        "/invoices/generate",
        json={
            "client_id": client["id"],
            "billing_period_start": "2026-01-01T00:00:00Z",
            "billing_period_end": "2026-01-31T23:59:59Z",
        },
    )
    assert resp.status_code == 201, resp.text
    return {
        "client": client,
        "order": order,
        "chamber": chamber,
        "invoice": resp.json(),
    }


# ---------------------------------------------------------------------------
# Unauthenticated client
# ---------------------------------------------------------------------------
@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------
async def _login_user(email: str) -> str:
    """Login via HTTP and return the access token."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as http:
        resp = await http.post(
            "/auth/login",
            json={"email": email, "password": "secret123"},
        )
        assert resp.status_code == 200, resp.text
        return resp.json()["access_token"]


async def _create_and_login_user(
    authed_client: AsyncClient,
    email: str,
    full_name: str,
    role: UserRole,
    client_id: str | None = None,
) -> tuple[dict, str]:
    """Create a user via API and login to get a token."""
    payload = {
        "email": email,
        "password": "secret123",
        "full_name": full_name,
        "phone_number": "9000000001",
        "role": role.value,
    }
    if client_id:
        payload["client_id"] = client_id
    resp = await authed_client.post("/users", json=payload)
    assert resp.status_code == 201, resp.text
    user_data = resp.json()
    token = await _login_user(email)
    return user_data, token


@pytest.fixture
async def auth_token(db_session: AsyncSession) -> str:
    """Create an ADMIN user, login via HTTP."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as http:
        async with TestAsyncSessionLocal() as session:
            existing = await session.execute(
                select(User).where(User.email == "admin_user@test.com")
            )
            existing_user = existing.scalar_one_or_none()
            if existing_user:
                await session.delete(existing_user)
                await session.commit()

            user = User(
                email="admin_user@test.com",
                password_hash=hash_password("secret123"),
                full_name="Admin User",
                phone_number="9000000001",
                role=UserRole.ADMIN,
                is_active=True,
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)

        login_response = await http.post(
            "/auth/login",
            json={"email": "admin_user@test.com", "password": "secret123"},
        )
        assert login_response.status_code == 200
        return login_response.json()["access_token"]


@pytest.fixture
async def authed_client(auth_token: str) -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    headers = {"Authorization": f"Bearer {auth_token}"}
    async with AsyncClient(
        transport=transport, base_url="http://test", headers=headers
    ) as c:
        yield c


@pytest.fixture
async def operator_client(authed_client: AsyncClient) -> AsyncGenerator[AsyncClient, None]:
    """Create an OPERATOR user and return an authenticated client."""
    email = f"operator{uuid.uuid4().hex[:8]}@test.com"
    _, token = await _create_and_login_user(
        authed_client, email, "Operator User", UserRole.OPERATOR
    )
    transport = ASGITransport(app=app)
    headers = {"Authorization": f"Bearer {token}"}
    async with AsyncClient(
        transport=transport, base_url="http://test", headers=headers
    ) as c:
        yield c


@pytest.fixture
async def client_user_token(authed_client: AsyncClient) -> tuple[dict, str]:
    """Create a CLIENT user and return (user_data, token)."""
    # First create a client entity
    client_payload = {
        "name": f"ClientUser-{uuid.uuid4().hex[:6]}",
        "email": f"cu-entity-{uuid.uuid4().hex[:8]}@test.com",
        "phone_number": "9000000002",
        "address": "456 Client St",
        "city": "Pune",
        "state": "Maharashtra",
        "pin_code": "411001",
        "gstin": "27AAACF0000F1Z3",
    }
    resp = await authed_client.post("/clients", json=client_payload)
    assert resp.status_code == 201, resp.text
    client_entity = resp.json()

    email = f"clientuser{uuid.uuid4().hex[:8]}@test.com"
    user_data, token = await _create_and_login_user(
        authed_client, email, "Client User", UserRole.CLIENT, client_entity["id"]
    )
    return {**user_data, "client_entity": client_entity}, token


@pytest.fixture
async def client_user_client(client_user_token: tuple) -> AsyncGenerator[AsyncClient, None]:
    """Authenticated client as CLIENT role."""
    _, token = client_user_token
    transport = ASGITransport(app=app)
    headers = {"Authorization": f"Bearer {token}"}
    async with AsyncClient(
        transport=transport, base_url="http://test", headers=headers
    ) as c:
        yield c


@pytest.fixture
async def second_client_user_token(authed_client: AsyncClient) -> tuple[dict, str]:
    """Create a SECOND CLIENT user (different client entity) for scoping tests."""
    client_payload = {
        "name": f"SecondClient-{uuid.uuid4().hex[:6]}",
        "email": f"second-entity-{uuid.uuid4().hex[:8]}@test.com",
        "phone_number": "9000000003",
        "address": "789 Second St",
        "city": "Delhi",
        "state": "Delhi",
        "pin_code": "110001",
        "gstin": "27AAACF0000F1Z4",
    }
    resp = await authed_client.post("/clients", json=client_payload)
    assert resp.status_code == 201, resp.text
    client_entity = resp.json()

    email = f"secondclient{uuid.uuid4().hex[:8]}@test.com"
    user_data, token = await _create_and_login_user(
        authed_client, email, "Second Client User", UserRole.CLIENT, client_entity["id"]
    )
    return {**user_data, "client_entity": client_entity}, token


@pytest.fixture
async def second_client_user_client(
    second_client_user_token: tuple,
) -> AsyncGenerator[AsyncClient, None]:
    """Authenticated client as a different CLIENT role (for scoping tests)."""
    _, token = second_client_user_token
    transport = ASGITransport(app=app)
    headers = {"Authorization": f"Bearer {token}"}
    async with AsyncClient(
        transport=transport, base_url="http://test", headers=headers
    ) as c:
        yield c


# ---------------------------------------------------------------------------
# Standard data fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def sample_user_data():
    return {
        "email": f"pradeep{uuid.uuid4().hex[:8]}@gmail.com",
        "password": "secret123",
        "full_name": "Pradeep",
        "phone_number": "9876543218",
        "role": "admin",
    }


@pytest.fixture
def sample_client_data():
    return {
        "name": "Nivia",
        "email": f"nivia{uuid.uuid4().hex[:8]}@example.com",
        "phone_number": "9745321897",
        "address": "41 Industrial Area",
        "city": "Pune",
        "state": "Maharashtra",
        "pin_code": "411001",
        "gstin": "27AABCA1234F5GB",
    }


@pytest.fixture
async def created_user(
    authed_client: AsyncClient, sample_user_data: dict[str, str]
) -> dict[str, str]:
    response = await authed_client.post("/users", json=sample_user_data)
    assert response.status_code == 201
    return response.json()


@pytest.fixture
async def another_user(authed_client: AsyncClient) -> dict[str, str]:
    data = {
        "email": f"jane{uuid.uuid4().hex[:8]}@example.com",
        "password": "secret123",
        "full_name": "Jane",
        "phone_number": "1234567789",
        "role": "operator",
    }
    response = await authed_client.post("/users", json=data)
    assert response.status_code == 201
    return response.json()


@pytest.fixture
async def created_client(
    authed_client: AsyncClient, sample_client_data: Mapping[str, str]
):
    response = await authed_client.post("/clients", json=sample_client_data)
    assert response.status_code == 201
    return response.json()
