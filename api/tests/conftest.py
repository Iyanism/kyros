import uuid
from collections.abc import AsyncGenerator, Mapping

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import NullPool
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.core.config import settings
from src.core.database import Base, get_db
from src.main import app

test_engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool, echo=False)
TestAsyncSessionLocal = async_sessionmaker(
    test_engine, expire_on_commit=False, class_=AsyncSession
)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestAsyncSessionLocal() as session:
        yield session
        await session.commit()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session", autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.fixture(scope="session")
async def auth_token() -> str:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        register_payload = {
            "client": {
                "name": "Auth Co",
                "email": f"auth{uuid.uuid4().hex[:8]}@example.com",
                "phone_number": "9000000000",
                "address": "Auth Address",
                "city": "Pune",
                "state": "Maharashtra",
                "pin_code": 411001,
                "gstin": "27AABCA1234F5GB",
            },
            "user": {
                "email": f"authuser{uuid.uuid4().hex[:8]}@gmail.com",
                "password_hash": "secret123",
                "full_name": "Auth User",
                "phone_number": "9000000001",
            },
        }
        response = await client.post("/auth/register", json=register_payload)
        assert response.status_code == 201
        return response.json()["login_info"]["access_token"]


@pytest.fixture
async def authed_client(auth_token: str) -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    headers = {"Authorization": f"Bearer {auth_token}"}
    async with AsyncClient(
        transport=transport, base_url="http://test", headers=headers
    ) as client:
        yield client


@pytest.fixture
def sample_user_data():
    return {
        "email": f"pradeep{uuid.uuid4().hex[:8]}@gmail.com",
        "password_hash": "1234567890",
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
    return response.json()  # pyright: ignore[reportAny]


@pytest.fixture
async def another_user(authed_client: AsyncClient) -> dict[str, str]:
    data = {
        "email": f"jane{uuid.uuid4().hex[:8]}@example.com",
        "password_hash": "1234567890O",
        "full_name": "Jane",
        "phone_number": "1234567789",
        "role": "operator",
    }
    response = await authed_client.post("/users", json=data)
    assert response.status_code == 201
    return response.json()  # pyright: ignore[reportAny]


@pytest.fixture
async def created_client(
    authed_client: AsyncClient, sample_client_data: Mapping[str, str]
):
    response = await authed_client.post("/clients", json=sample_client_data)
    assert response.status_code == 201
    return response.json()
