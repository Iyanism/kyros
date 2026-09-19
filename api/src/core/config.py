from __future__ import annotations

from typing import ClassVar, Literal

from dotenv import load_dotenv
from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

_ = load_dotenv()


class Settings(BaseSettings):
    APP_NAME: str = "Cold Storage Platform"
    APP_VERSION: str = "v0.1.0"
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"

    # Database Configurations
    DATABASE_URL: str = ""  # Database url
    DATABASE_POOL_SIZE: int = 10  # Database session connection pool size
    DATABASE_MAX_OVERFLOW: int = 20  # Maximum amount the connection pool size can grow
    DATABASE_ECHO: bool = False  # If sqlalchemy debug log should be shown or not

    # Jwt Configurations
    JWT_ALGORITHM: str = "HS256"  # A Symetrical encryption algorithm

    # Access token
    ACCESS_TOKEN_SECRET_KEY: SecretStr
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Refresh token
    REFRESH_TOKEN_SECRET_KEY: SecretStr
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    FACILITY_NAME: str = "Cold Chain Facility Pvt Ltd"
    FACILITY_ADDRESS: str = "Plot 7, Logistics Park, Bhiwandi 421302"
    FACILITY_GSTIN: str = "27AAACF0000F1Z2"
    FACILITY_STATE: str = "Maharashtra"
    STORAGE_DAILY_RATE_MT: float = 50.0
    HANDLING_RATE_MT: float = 25.0
    CGST_RATE: float = 9.0
    SGST_RATE: float = 9.0
    IGST_RATE: float = 18.0

    model_config: ClassVar[SettingsConfigDict] = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


settings: Settings = Settings()
