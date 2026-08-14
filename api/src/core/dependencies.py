from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.security import verify_access_token
from src.domains.users.model import User

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    if credentials is None:
        raise unauthorized_error()

    payload = verify_access_token(credentials.credentials)
    if payload is None or "sub" not in payload:
        raise unauthorized_error()

    try:
        user_id = uuid.UUID(str(payload["sub"]))
    except ValueError:
        raise unauthorized_error() from None

    user = await db.get(User, user_id)
    if user is None:
        raise unauthorized_error()

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    return user


def unauthorized_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )