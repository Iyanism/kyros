"""add stock_movements and stock_levels tables

Revision ID: dece8d31a918
Revises: b7e3a1d9f456
Create Date: 2026-09-08 17:09:47.382025

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dece8d31a918'
down_revision: Union[str, Sequence[str], None] = 'b7e3a1d9f456'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('stock_levels',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('pallet_id', sa.UUID(), nullable=False),
        sa.Column('slot_id', sa.UUID(), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('weight_mt', sa.Float(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['pallet_id'], ['pallets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['slot_id'], ['slots.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('pallet_id', 'slot_id', name='uq_stock_level_pallet_slot')
    )
    op.create_index(op.f('ix_stock_levels_id'), 'stock_levels', ['id'], unique=False)
    op.create_index(op.f('ix_stock_levels_pallet_id'), 'stock_levels', ['pallet_id'], unique=False)
    op.create_index(op.f('ix_stock_levels_slot_id'), 'stock_levels', ['slot_id'], unique=False)

    op.create_table('stock_movements',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('pallet_id', sa.UUID(), nullable=False),
        sa.Column('slot_id', sa.UUID(), nullable=False),
        sa.Column('movement_type', sa.Enum('INBOUND', 'OUTBOUND', 'ADJUSTMENT', name='movementtype'), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('weight_mt', sa.Float(), nullable=False),
        sa.Column('reference_order_id', sa.UUID(), nullable=True),
        sa.Column('executed_by_user_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['executed_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['pallet_id'], ['pallets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['slot_id'], ['slots.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_stock_movements_id'), 'stock_movements', ['id'], unique=False)
    op.create_index(op.f('ix_stock_movements_movement_type'), 'stock_movements', ['movement_type'], unique=False)
    op.create_index(op.f('ix_stock_movements_pallet_id'), 'stock_movements', ['pallet_id'], unique=False)
    op.create_index(op.f('ix_stock_movements_reference_order_id'), 'stock_movements', ['reference_order_id'], unique=False)
    op.create_index(op.f('ix_stock_movements_slot_id'), 'stock_movements', ['slot_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_stock_movements_slot_id'), table_name='stock_movements')
    op.drop_index(op.f('ix_stock_movements_reference_order_id'), table_name='stock_movements')
    op.drop_index(op.f('ix_stock_movements_pallet_id'), table_name='stock_movements')
    op.drop_index(op.f('ix_stock_movements_movement_type'), table_name='stock_movements')
    op.drop_index(op.f('ix_stock_movements_id'), table_name='stock_movements')
    op.drop_table('stock_movements')
    op.drop_index(op.f('ix_stock_levels_slot_id'), table_name='stock_levels')
    op.drop_index(op.f('ix_stock_levels_pallet_id'), table_name='stock_levels')
    op.drop_index(op.f('ix_stock_levels_id'), table_name='stock_levels')
    op.drop_table('stock_levels')
    sa.Enum(name='movementtype').drop(op.get_bind(), checkfirst=True)
