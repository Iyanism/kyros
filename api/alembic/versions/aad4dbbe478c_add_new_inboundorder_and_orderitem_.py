"""Add new InboundOrder and OrderItem model in the order domain

Revision ID: aad4dbbe478c
Revises: 0423f7f0259e
Create Date: 2026-09-02 17:38:24.851052

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "aad4dbbe478c"
down_revision: Union[str, Sequence[str], None] = "0423f7f0259e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Define enum values as constants for better maintainability
CHAMBER_CATEGORIES = ["FROZEN", "CHILLED", "AMBIENT"]
ORDER_STATUSES = [
    "SUBMITTED",
    "APPROVED",
    "REJECTED",
    "IN_TRANSIT",
    "ARRIVED",
    "PROCESSING",
    "STORED",
]
UNIT_CATEGORIES = ["KG", "LB", "G", "OC"]
PALLET_STATUSES = ["ALLOCATED", "STORED"]


def upgrade() -> None:
    """Upgrade schema."""
    # Create ENUM types first with checkfirst to avoid duplication errors
    chamber_enum = ENUM(*CHAMBER_CATEGORIES, name="chambercategory")
    chamber_enum.create(op.get_bind(), checkfirst=True)

    order_status_enum = ENUM(*ORDER_STATUSES, name="orderrequeststatus")
    order_status_enum.create(op.get_bind(), checkfirst=True)

    unit_enum = ENUM(*UNIT_CATEGORIES, name="unitcategory")
    unit_enum.create(op.get_bind(), checkfirst=True)

    pallet_status_enum = ENUM(*PALLET_STATUSES, name="palletstatus")
    pallet_status_enum.create(op.get_bind(), checkfirst=True)

    # Now create tables using these existing enums with create_type=False
    op.create_table(
        "inbound_orders",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("client_id", sa.UUID(), nullable=False),
        sa.Column("vehicle_number", sa.String(length=255), nullable=False),
        sa.Column("total_quantity", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            ENUM(*ORDER_STATUSES, name="orderrequeststatus", create_type=False),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_inbound_orders_id"), "inbound_orders", ["id"], unique=False
    )

    op.create_table(
        "order_items",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("order_id", sa.UUID(), nullable=False),
        sa.Column("product_name", sa.String(length=255), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column(
            "unit",
            ENUM(*UNIT_CATEGORIES, name="unitcategory", create_type=False),
            nullable=False,
        ),
        sa.Column(
            "temperature_category",
            ENUM(*CHAMBER_CATEGORIES, name="chambercategory", create_type=False),
            nullable=False,
        ),
        sa.Column("batch_number", sa.String(length=255), nullable=True),
        sa.Column("expiry_date", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["order_id"], ["inbound_orders.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_order_items_id"), "order_items", ["id"], unique=False)

    op.create_table(
        "pallets",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("order_id", sa.UUID(), nullable=False),
        sa.Column("pallet_code", sa.String(length=32), nullable=False),
        sa.Column(
            "temperature_category",
            ENUM(*CHAMBER_CATEGORIES, name="chambercategory", create_type=False),
            nullable=False,
        ),
        sa.Column("weight", sa.Float(), nullable=False),
        sa.Column("is_partial", sa.Boolean(), nullable=False),
        sa.Column(
            "status",
            ENUM(*PALLET_STATUSES, name="palletstatus", create_type=False),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["order_id"], ["inbound_orders.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_pallets_id"), "pallets", ["id"], unique=False)
    op.create_index(op.f("ix_pallets_order_id"), "pallets", ["order_id"], unique=False)
    op.create_index(
        op.f("ix_pallets_pallet_code"), "pallets", ["pallet_code"], unique=True
    )

    op.create_table(
        "slot_allocations",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("order_id", sa.UUID(), nullable=False),
        sa.Column("pallet_id", sa.UUID(), nullable=False),
        sa.Column("slot_id", sa.UUID(), nullable=False),
        sa.Column("allocated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["order_id"], ["inbound_orders.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["pallet_id"], ["pallets.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["slot_id"], ["slots.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slot_id", name="unique_allocated_slot"),
    )
    op.create_index(
        op.f("ix_slot_allocations_id"), "slot_allocations", ["id"], unique=False
    )
    op.create_index(
        op.f("ix_slot_allocations_order_id"),
        "slot_allocations",
        ["order_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_slot_allocations_pallet_id"),
        "slot_allocations",
        ["pallet_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_slot_allocations_slot_id"),
        "slot_allocations",
        ["slot_id"],
        unique=False,
    )

    # Alter client columns
    op.alter_column(
        "clients",
        "phone_number",
        existing_type=sa.VARCHAR(length=20),
        type_=sa.String(length=10),
        existing_nullable=False,
    )
    op.alter_column(
        "clients",
        "gstin",
        existing_type=sa.VARCHAR(length=50),
        type_=sa.String(length=15),
        existing_nullable=True,
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Alter clients table back first
    op.alter_column(
        "clients",
        "gstin",
        existing_type=sa.String(length=15),
        type_=sa.VARCHAR(length=50),
        existing_nullable=True,
    )
    op.alter_column(
        "clients",
        "phone_number",
        existing_type=sa.String(length=10),
        type_=sa.VARCHAR(length=20),
        existing_nullable=False,
    )

    # Drop tables in reverse order (respecting foreign key constraints)
    op.drop_index(op.f("ix_slot_allocations_slot_id"), table_name="slot_allocations")
    op.drop_index(op.f("ix_slot_allocations_pallet_id"), table_name="slot_allocations")
    op.drop_index(op.f("ix_slot_allocations_order_id"), table_name="slot_allocations")
    op.drop_index(op.f("ix_slot_allocations_id"), table_name="slot_allocations")
    op.drop_table("slot_allocations")

    op.drop_index(op.f("ix_pallets_pallet_code"), table_name="pallets")
    op.drop_index(op.f("ix_pallets_order_id"), table_name="pallets")
    op.drop_index(op.f("ix_pallets_id"), table_name="pallets")
    op.drop_table("pallets")

    op.drop_index(op.f("ix_order_items_id"), table_name="order_items")
    op.drop_table("order_items")

    op.drop_index(op.f("ix_inbound_orders_id"), table_name="inbound_orders")
    op.drop_table("inbound_orders")

    # Drop ENUM types in reverse order (if they exist)
    ENUM(name="palletstatus").drop(op.get_bind(), checkfirst=True)
    ENUM(name="unitcategory").drop(op.get_bind(), checkfirst=True)
    ENUM(name="orderrequeststatus").drop(op.get_bind(), checkfirst=True)
    ENUM(name="chambercategory").drop(op.get_bind(), checkfirst=True)
