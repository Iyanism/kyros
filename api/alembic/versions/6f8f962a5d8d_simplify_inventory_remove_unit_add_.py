"""simplify_inventory_remove_unit_add_pallet_fields

Revision ID: 6f8f962a5d8d
Revises: 4eacfe82df6b
Create Date: 2026-09-04 17:09:00.926685

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "6f8f962a5d8d"
down_revision: Union[str, Sequence[str], None] = "4eacfe82df6b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Update pallets table: remove unit, add client_id, product_name, batch_code, expiry_date
    op.add_column("pallets", sa.Column("client_id", sa.UUID(), nullable=False))
    op.add_column("pallets", sa.Column("product_name", sa.String(length=255), nullable=True))
    op.add_column("pallets", sa.Column("batch_code", sa.String(length=255), nullable=False))
    op.add_column("pallets", sa.Column("expiry_date", sa.DateTime(timezone=True), nullable=False))

    op.create_index(op.f("ix_pallets_client_id"), "pallets", ["client_id"], unique=False)
    op.create_index(op.f("ix_pallets_product_name"), "pallets", ["product_name"], unique=False)
    op.create_index(op.f("ix_pallets_batch_code"), "pallets", ["batch_code"], unique=False)

    op.create_foreign_key(
        "fk_pallets_client_id", "pallets", "clients", ["client_id"], ["id"], ondelete="CASCADE"
    )

    op.drop_column("pallets", "unit")

    # Update slot_allocations table: add is_active, released_at
    op.add_column("slot_allocations", sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False))
    op.add_column("slot_allocations", sa.Column("released_at", sa.DateTime(timezone=True), nullable=True))

    # Add index on users.client_id if missing
    op.create_index(op.f("ix_users_client_id"), "users", ["client_id"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_users_client_id"), table_name="users")

    op.drop_column("slot_allocations", "released_at")
    op.drop_column("slot_allocations", "is_active")

    op.add_column(
        "pallets",
        sa.Column("unit", sa.Enum("KG", "LB", "G", "OC", name="unitcategory"), nullable=True),
    )
    op.drop_constraint("fk_pallets_client_id", "pallets", type_="foreignkey")
    op.drop_index(op.f("ix_pallets_batch_code"), table_name="pallets")
    op.drop_index(op.f("ix_pallets_product_name"), table_name="pallets")
    op.drop_index(op.f("ix_pallets_client_id"), table_name="pallets")

    op.drop_column("pallets", "expiry_date")
    op.drop_column("pallets", "batch_code")
    op.drop_column("pallets", "product_name")
    op.drop_column("pallets", "client_id")
