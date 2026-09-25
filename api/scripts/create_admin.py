"""Standalone script to bootstrap an ADMIN user via the user domain.

Bypasses routers and HTTP entirely; uses the same services/repositories
the API uses so password hashing and validation stay consistent.

Usage (from api/):
    uv run python scripts/create_admin.py
    uv run python scripts/create_admin.py --email tester@x.com --password Test@12345
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy.exc import ProgrammingError  # noqa: E402

from src.core.database import AsyncSessionLocal  # noqa: E402
from src.domains.users.model import UserRole  # noqa: E402
from src.domains.users.schema import UserCreate  # noqa: E402
from src.domains.users.service import (  # noqa: E402
    UserAlreadyExistsError,
    UserNotFoundError,
    UserService,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create an ADMIN user directly through the user domain."
    )
    parser.add_argument("--name", default="Pradeep", help="Full name of the user.")
    parser.add_argument("--email", default="pradeep@gmail.com", help="Login email.")
    parser.add_argument("--password", default="admin123", help="Login password.")
    parser.add_argument(
        "--phone", default="+919876543210", help="Phone number in E.164 format."
    )
    parser.add_argument(
        "--role",
        choices=[role.value for role in UserRole],
        default=UserRole.ADMIN.value,
        help="User role (defaults to admin).",
    )
    return parser.parse_args()


async def main() -> int:
    args = parse_args()

    async with AsyncSessionLocal() as session:
        service = UserService(session)

        try:
            existing = await service.get_by_email(args.email)
            if existing is not None:
                print(
                    f"User already exists: email={existing.email} "
                    f"id={existing.id} role={existing.role}"
                )
                return 0
        except UserNotFoundError:
            pass

        user_data = UserCreate(
            email=args.email,
            full_name=args.name,
            phone_number=args.phone,
            role=UserRole(args.role),
            password=args.password,
        )

        try:
            user = await service.create(user_data)
        except UserAlreadyExistsError:
            print(f"User already exists: email={args.email}")
            return 0

        await session.commit()
        print(
            f"User created successfully: id={user.id} email={user.email} "
            f"role={user.role}"
        )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(asyncio.run(main()))
    except ProgrammingError as e:
        print(
            f"Database error: {e}\n"
            "The 'users' table is missing. Run '.venv/bin/alembic upgrade head' first."
        )
        raise SystemExit(1) from e