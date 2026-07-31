from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import NullPool
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.core.config import settings
from src.core.database import Base, get_db
from src.core.logger import logger
from src.main import app

test_engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool, echo=False)
TestAsyncSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False, class_=AsyncSession)


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestAsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"Database session error: {str(e)}", exc_info=True)
            await session.rollback()
            raise
        finally:
            await session.close()

app.dependency_overrides[get_db] = db_session

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


@pytest.fixture
def sample_user_data():
    return {
        "email": "pradeep@gmail.com",
        "password_hash": "1234567890",
        "full_name": "Pradeep",
        "phone_number": "9876543218",
        "role": "admin",
    }

@pytest.fixture
async def created_user(client: AsyncClient, sample_user_data: dict[str, str]) -> dict[str, str]:
    response = await client.post("/users", json=sample_user_data)
    assert response.status_code == 201
    return response.json()  # pyright: ignore[reportAny]

@pytest.fixture
async def another_user(client: AsyncClient) -> dict[str, str]:
    data = {
        "email": "jane@example.com",
        "password_hash": "1234567890O",
        "full_name": "Jane",
        "phone_number": "1234567789",
        "role": "operator",
    }
    response = await client.post("/users", json=data)
    assert response.status_code == 201
    return response.json()  # pyright: ignore[reportAny]
