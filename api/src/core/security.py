from datetime import UTC, datetime, timedelta

from argon2 import PasswordHasher
from argon2.exceptions import VerificationError, VerifyMismatchError
from jose import ExpiredSignatureError, JWTError, jwt

from src.core.config import settings

ph = PasswordHasher()


def hash_password(password: str) -> str:
    return ph.hash(password)


def verify_password(password: str, hash_password: str) -> bool:
    try:
        return ph.verify(password, hash_password)

    except VerifyMismatchError:
        return False

    except VerificationError as e:
        print("Password Verfication ERROR:", e)
        return False


def create_access_token(data: dict[str, object]) -> str | None:
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
    except JWTError as jwterr:
        print(f"JWT Token Creation ERROR: {jwterr}")
        return None


def verify_access_token(token: str) -> dict[str, object] | None:
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY.get_secret_value(), settings.JWT_ALGORITHM
        )

        return payload

    except ExpiredSignatureError:
        print("Token has Expired")
    except JWTError as jwterr:
        print(f"JWT Verification ERROR: {jwterr}")
        return None
