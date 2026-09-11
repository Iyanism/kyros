from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from src.core.base import Base
from src.core.config import settings
from src.core.logger import logger

engine: AsyncEngine = create_async_engine(
    url=str(settings.DATABASE_URL),
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=settings.DATABASE_ECHO,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    autoflush=False,
    class_=AsyncSession,
)


async def init_db() -> None:
    """Development helper to create database tables.

    Ensure all models are imported prior to calling this function so they
    are registered on Base.metadata.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables verified/created successfully.")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for providing a transactional database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            logger.error(f"Database session exception encountered: {e}", exc_info=True)
            await session.rollback()
            raise
