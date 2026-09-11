"""add invoices and invoice_line_items tables

Revision ID: 39e8055c5c80
Revises: dece8d31a918
Create Date: 2026-09-09 22:03:18.192778

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '39e8055c5c80'
down_revision: Union[str, Sequence[str], None] = 'dece8d31a918'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('invoices',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('client_id', sa.UUID(), nullable=False),
        sa.Column('invoice_number', sa.String(length=32), nullable=False),
        sa.Column('status', sa.Enum('DRAFT', 'SENT', 'PAID', name='invoicestatus'), nullable=False),
        sa.Column('billing_period_start', sa.DateTime(timezone=True), nullable=False),
        sa.Column('billing_period_end', sa.DateTime(timezone=True), nullable=False),
        sa.Column('subtotal', sa.Float(), nullable=False),
        sa.Column('cgst_rate', sa.Float(), nullable=True),
        sa.Column('cgst_amount', sa.Float(), nullable=True),
        sa.Column('sgst_rate', sa.Float(), nullable=True),
        sa.Column('sgst_amount', sa.Float(), nullable=True),
        sa.Column('igst_rate', sa.Float(), nullable=True),
        sa.Column('igst_amount', sa.Float(), nullable=True),
        sa.Column('tax_amount', sa.Float(), nullable=False),
        sa.Column('total_amount', sa.Float(), nullable=False),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_invoices_client_id'), 'invoices', ['client_id'], unique=False)
    op.create_index(op.f('ix_invoices_id'), 'invoices', ['id'], unique=False)
    op.create_index(op.f('ix_invoices_invoice_number'), 'invoices', ['invoice_number'], unique=True)

    op.create_table('invoice_line_items',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('invoice_id', sa.UUID(), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(length=32), nullable=False),
        sa.Column('unit_rate_snapshot', sa.Float(), nullable=False),
        sa.Column('total_price', sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(['invoice_id'], ['invoices.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_invoice_line_items_id'), 'invoice_line_items', ['id'], unique=False)
    op.create_index(op.f('ix_invoice_line_items_invoice_id'), 'invoice_line_items', ['invoice_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_invoice_line_items_invoice_id'), table_name='invoice_line_items')
    op.drop_index(op.f('ix_invoice_line_items_id'), table_name='invoice_line_items')
    op.drop_table('invoice_line_items')
    op.drop_index(op.f('ix_invoices_invoice_number'), table_name='invoices')
    op.drop_index(op.f('ix_invoices_id'), table_name='invoices')
    op.drop_index(op.f('ix_invoices_client_id'), table_name='invoices')
    op.drop_table('invoices')
    sa.Enum(name='invoicestatus').drop(op.get_bind(), checkfirst=True)
