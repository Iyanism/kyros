"""update slot model with bay level depth and status

Revision ID: b7e3a1d9f456
Revises: 394e1cdd2a87
Create Date: 2026-09-06 01:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7e3a1d9f456'
down_revision: Union[str, Sequence[str], None] = '394e1cdd2a87'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add new columns (nullable temporarily for data migration)
    op.add_column('slots', sa.Column('bay', sa.Integer(), nullable=True))
    op.add_column('slots', sa.Column('level', sa.Integer(), nullable=True))
    op.add_column('slots', sa.Column('depth', sa.Integer(), server_default='1', nullable=True))
    op.add_column('slots', sa.Column('location_code', sa.String(length=50), nullable=True))
    op.add_column('slots', sa.Column('status', sa.Enum('available', 'reserved', 'occupied', 'maintenance', name='slotstatus'), server_default='available', nullable=True))

    # Migrate existing data: parse slot_number (S01 -> bay=1, level=1)
    op.execute("""
        UPDATE slots
        SET bay = CAST(REPLACE(slot_number, 'S', '') AS INTEGER),
            level = 1,
            depth = 1,
            location_code = 'UNKNOWN',
            status = CASE WHEN is_occupied THEN 'occupied' ELSE 'available' END
    """)

    # Make columns non-nullable
    op.alter_column('slots', 'bay', nullable=False)
    op.alter_column('slots', 'level', nullable=False)
    op.alter_column('slots', 'depth', nullable=False)
    op.alter_column('slots', 'location_code', nullable=False)
    op.alter_column('slots', 'status', nullable=False)

    # Create unique index on location_code
    op.create_index(op.f('ix_slots_location_code'), 'slots', ['location_code'], unique=True)

    # Drop old columns and constraints
    op.drop_constraint('unique_rack_slot', 'slots', type_='unique')
    op.drop_column('slots', 'slot_number')
    op.drop_column('slots', 'is_occupied')

    # Add new unique constraint
    op.create_unique_constraint('unique_rack_slot', 'slots', ['rack_id', 'bay', 'level', 'depth'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('unique_rack_slot', 'slots', type_='unique')
    op.drop_index(op.f('ix_slots_location_code'), table_name='slots')

    op.add_column('slots', sa.Column('slot_number', sa.String(length=50), nullable=True))
    op.add_column('slots', sa.Column('is_occupied', sa.Boolean(), server_default='false', nullable=True))

    op.execute("""
        UPDATE slots
        SET slot_number = 'S01',
            is_occupied = (status = 'occupied')
    """)

    op.alter_column('slots', 'slot_number', nullable=False)
    op.alter_column('slots', 'is_occupied', nullable=False)

    op.create_unique_constraint('unique_rack_slot', 'slots', ['rack_id', 'slot_number'])

    op.drop_column('slots', 'status')
    op.drop_column('slots', 'location_code')
    op.drop_column('slots', 'depth')
    op.drop_column('slots', 'level')
    op.drop_column('slots', 'bay')

    op.execute("DROP TYPE IF EXISTS slotstatus")
