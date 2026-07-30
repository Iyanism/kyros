from datetime import UTC, datetime, timedelta

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHash, VerificationError
from jose import ExpiredSignatureError, JWTError, jwt

from src.core.config import settings
from src.core.logger import logger

ph = PasswordHasher()


def hash_password(password: str) -> str:
    try:
        return ph.hash(password)
    except Exception as e:
        logger.error(f"Password hashing failed: {str(e)}", exc_info=True)
        raise RuntimeError("Unable to process password") from e


def verify_password(password: str, hash_password: str) -> bool:
    try:
        return ph.verify(password, hash_password)

    except VerificationError:
        logger.warning("Invalid password attempt")
        return False

    except InvalidHash:
        logger.error("Invalid hash format in database")
        return False

    except Exception as e:
        logger.error(f"Password verification error: {str(e)}")
        return False


def create_access_token(data: dict[str, object]) -> str:
    to_encode = data.copy()
    expire = datetime.now(UTC) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    try:
        encode_jwt = jwt.encode(
            to_encode,
            settings.JWT_SECRET_KEY.get_secret_value(),
            settings.JWT_ALGORITHM,
        )

        return encode_jwt
    except JWTError as e:
        logger.error(f"Token creation failed: {str(e)}")
        raise RuntimeError("Failed to create access token") from e
    except Exception as e:
        logger.error(f"Token creation failed: {str(e)}")
        raise


def verify_access_token(token: str) -> dict[str, object] | None:
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY.get_secret_value(), settings.JWT_ALGORITHM
        )

        return payload

    except ExpiredSignatureError:
        logger.warning("Token has expired")
    except JWTError as e:
        logger.warning(f"Token verification failed: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected token error: {str(e)}")
        return None
