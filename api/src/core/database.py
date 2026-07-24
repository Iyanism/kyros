from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.ext.declarative import declarative_base

from src.core.config import setting

engine = create_async_engine(
    setting.DATABASE_URL,
    pool_size=setting.DATABASE_POOL_SIZE,
    max_overflow=setting.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=setting.DATABASE_ECHO,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    autoflush=False,
    autocommit=False,
)
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
