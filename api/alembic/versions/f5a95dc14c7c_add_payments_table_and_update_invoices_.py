"""add payments table and update invoices with amount_paid viewed_at paid_at

Revision ID: f5a95dc14c7c
Revises: 39e8055c5c80
Create Date: 2026-09-10 17:59:17.382025

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f5a95dc14c7c'
down_revision: Union[str, Sequence[str], None] = '39e8055c5c80'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('invoices', sa.Column('amount_paid', sa.Float(), nullable=False, server_default='0'))
    op.add_column('invoices', sa.Column('viewed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('invoices', sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True))

    op.create_table('payments',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('invoice_id', sa.UUID(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.Column('method', sa.Enum('UPI', 'CARD', 'NETBANKING', 'WALLET', name='paymentmethod'), nullable=False),
        sa.Column('status', sa.Enum('CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED', name='paymentstatus'), nullable=False),
        sa.Column('razorpay_order_id', sa.String(length=64), nullable=False),
        sa.Column('razorpay_payment_id', sa.String(length=64), nullable=True),
        sa.Column('razorpay_signature', sa.String(length=128), nullable=True),
        sa.Column('receipt_number', sa.String(length=32), nullable=True),
        sa.Column('failure_reason', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['invoice_id'], ['invoices.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('receipt_number')
    )
    op.create_index(op.f('ix_payments_id'), 'payments', ['id'], unique=False)
    op.create_index(op.f('ix_payments_invoice_id'), 'payments', ['invoice_id'], unique=False)
    op.create_index(op.f('ix_payments_razorpay_order_id'), 'payments', ['razorpay_order_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_payments_razorpay_order_id'), table_name='payments')
    op.drop_index(op.f('ix_payments_invoice_id'), table_name='payments')
    op.drop_index(op.f('ix_payments_id'), table_name='payments')
    op.drop_table('payments')
    sa.Enum(name='paymentmethod').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='paymentstatus').drop(op.get_bind(), checkfirst=True)

    op.drop_column('invoices', 'paid_at')
    op.drop_column('invoices', 'viewed_at')
    op.drop_column('invoices', 'amount_paid')
