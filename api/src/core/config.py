from __future__ import annotations

from dotenv import load_dotenv
from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

_ = load_dotenv()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    APP_NAME: str = "Cold Chain Management System"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DATABASE_URL: str = ""
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    DATABASE_ECHO: bool = False

    JWT_SECRET_KEY: SecretStr = SecretStr("mysecretkey")

    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30


settings: Settings = Settings()
