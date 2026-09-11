"""fix the relationship name issues of old OrderItem model name in inbound order and inventory model

Revision ID: a8e742edfa43
Revises: a7ee3bf2a3c4
Create Date: 2026-09-04 22:20:39.698321

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a8e742edfa43'
down_revision: Union[str, Sequence[str], None] = 'a7ee3bf2a3c4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
