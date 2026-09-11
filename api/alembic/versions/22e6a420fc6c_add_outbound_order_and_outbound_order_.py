"""add outbound order and outbound order item model

Revision ID: 22e6a420fc6c
Revises: 6f8f962a5d8d
Create Date: 2026-09-04 19:30:28.029498

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "22e6a420fc6c"
down_revision: Union[str, Sequence[str], None] = "6f8f962a5d8d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "outbound_orders",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("client_id", sa.UUID(), nullable=False),
        sa.Column("total_quantity", sa.Float(), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "DRAFT",
                "SUBMITTED",
                "APPROVED",
                "REJECTED",
                "DISPATCHED",
                name="outboundorderstatus",
            ),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_outbound_orders_client_id"),
        "outbound_orders",
        ["client_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_outbound_orders_id"), "outbound_orders", ["id"], unique=False
    )
    op.create_table(
        "outbound_order_items",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("outbound_order_id", sa.UUID(), nullable=False),
        sa.Column("product_name", sa.String(length=255), nullable=False),
        sa.Column("quantity", sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(
            ["outbound_order_id"], ["outbound_orders.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_outbound_order_items_id"),
        "outbound_order_items",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_outbound_order_items_outbound_order_id"),
        "outbound_order_items",
        ["outbound_order_id"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        op.f("ix_outbound_order_items_outbound_order_id"),
        table_name="outbound_order_items",
    )
    op.drop_index(
        op.f("ix_outbound_order_items_id"), table_name="outbound_order_items"
    )
    op.drop_table("outbound_order_items")
    op.drop_index(op.f("ix_outbound_orders_id"), table_name="outbound_orders")
    op.drop_index(
        op.f("ix_outbound_orders_client_id"), table_name="outbound_orders"
    )
    op.drop_table("outbound_orders")
    sa.Enum(name="outboundorderstatus").drop(op.get_bind(), checkfirst=True)
