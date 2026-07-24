from datetime import datetime, timedelta, timezone

from argon2 import PasswordHasher
from argon2.exceptions import VerificationError, VerifyMismatchError
from jose import JWTError, jwt

from src.core.config import setting

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


def create_access_token(
    data: dict[str, object], expire_delta: timedelta | None = None
) -> str:
    to_encode = data.copy()

    if expire_delta:
        expire = datetime.now(timezone.utc) + expire_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=setting.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire, "type": "access"})
    try:
        encode_jwt = jwt.encode(
            to_encode, setting.SECRET_KEY.get_secret_value(), setting.ALGORITHM
        )
    except JWTError as jwterr:
        print(f"JWT Encoding ERROR: {jwterr}")

    return encode_jwt


def verify_access_token(token: str) -> dict[str, object] | None:
    try:
        payload = jwt.decode(
            token, setting.SECRET_KEY.get_secret_value(), setting.ALGORITHM
        )

        return payload
    except JWTError as jwterr:
        print(f"JWT Verification ERROR: {jwterr}")
        return None
    except ExpiredSignatureError as jwterr:
        print(f"JWT Verification ERROR: {jwterr}")
        return None
    except JWTClaimsError as jwterr:
        print(f"JWT Verification ERROR: {jwterr}")
        return None
