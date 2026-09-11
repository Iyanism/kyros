from datetime import UTC, datetime, timedelta

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import HashingError, InvalidHash, VerificationError, VerifyMismatchError
from jwt import ExpiredSignatureError, PyJWTError

from src.core.config import settings
from src.core.logger import logger

ph = PasswordHasher()


def hash_password(password: str) -> str:
    try:
        return ph.hash(password)
    except HashingError as e:
        logger.error("Password hashing failed: %s", e, exc_info=True)
        raise RuntimeError("Unable to process password") from e


def verify_password(password: str, hash_password: str) -> bool:
    try:
        return ph.verify(hash_password, password)
    except VerifyMismatchError:
        logger.warning("Invalid password attempt")
        return False
    except (VerificationError, InvalidHash) as e:
        logger.error("Password verification error: %s", e)
        return False


def create_access_token(data: dict[str, object]) -> str:
    return _create_token(
        data=data,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        secret=settings.ACCESS_TOKEN_SECRET_KEY.get_secret_value(),
        token_type="access",
    )


def verify_access_token(token: str) -> dict[str, object] | None:
    try:
        payload = jwt.decode(
            token,
            settings.ACCESS_TOKEN_SECRET_KEY.get_secret_value(),
            settings.JWT_ALGORITHM,
        )

        return payload

    except ExpiredSignatureError:
        logger.warning("Token has expired")
        return None
    except PyJWTError as e:
        logger.warning("Token verification failed: %s", e)
        return None


def create_refresh_token(data: dict[str, object]) -> str:
    return _create_token(
        data=data,
        expires_delta=timedelta(settings.REFRESH_TOKEN_EXPIRE_DAYS),
        secret=settings.REFRESH_TOKEN_SECRET_KEY.get_secret_value(),
        token_type="refresh",
    )


def verify_refresh_token(token: str) -> dict[str, object] | None:
    try:
        payload = jwt.decode(
            token,
            settings.REFRESH_TOKEN_SECRET_KEY.get_secret_value(),
            settings.JWT_ALGORITHM,
        )

        if payload.get("type") != "refresh":
            logger.warning("Invalid token type in refresh token")
            return None

        return payload

    except ExpiredSignatureError:
        logger.warning("Refresh token has expired")
        return None
    except PyJWTError as e:
        logger.warning("Refresh token verification failed: %s", e)
        return None


def _create_token(
    data: dict[str, object], expires_delta: timedelta, secret: str, token_type: str
) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.now(UTC) + expires_delta
    to_encode["type"] = token_type

    try:
        return jwt.encode(
            payload=to_encode,
            key=secret,
            algorithm=settings.JWT_ALGORITHM,
        )
    except PyJWTError as e:
        logger.error("Token creation failed: %s", e)
        raise RuntimeError("Failed to create token") from e
