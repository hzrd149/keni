"""add count_sub_transactions to user

Revision ID: 5c1e7a9d3b42
Revises: d254681e3938
Create Date: 2026-10-15 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "5c1e7a9d3b42"
down_revision: Union[str, Sequence[str], None] = "d254681e3938"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "users",
        sa.Column("count_sub_transactions", sa.Boolean(), nullable=False, server_default="true"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("users", "count_sub_transactions")
