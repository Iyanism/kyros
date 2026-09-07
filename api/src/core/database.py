from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from src.core.config import settings
from src.core.logger import logger


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy domain models."""

    pass


def create_db_engine() -> AsyncEngine:
    """Factory to build the async database engine."""
    try:
        return create_async_engine(
            str(settings.DATABASE_URL),
            pool_size=settings.DATABASE_POOL_SIZE,
            max_overflow=settings.DATABASE_MAX_OVERFLOW,
            pool_pre_ping=True,
            pool_recycle=3600,
            echo=settings.DATABASE_ECHO,
        )
    except Exception as e:
        logger.error(f"Failed to initialize database engine: {e}", exc_info=True)
        raise


# Module-level engine and session factory
engine: AsyncEngine = create_db_engine()

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
    """Dependency for providing a transactional database session per request.

    Handles rollback on unhandled exceptions. Commits should be explicitly
    managed by the caller / service layer.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"Database session exception encountered: {e}", exc_info=True)
            await session.rollback()
            raise
