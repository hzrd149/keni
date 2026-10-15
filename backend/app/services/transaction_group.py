from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import exists
from sqlalchemy.orm import aliased
from sqlmodel import col, select

from app.models.transaction import Transaction

if TYPE_CHECKING:
    import uuid

    from sqlalchemy import ColumnElement
    from sqlmodel.ext.asyncio.session import AsyncSession


async def has_children(session: AsyncSession, transaction_id: uuid.UUID) -> bool:
    result = await session.exec(
        select(Transaction.id).where(col(Transaction.group_id) == transaction_id).limit(1)
    )
    return result.first() is not None


def counted_filter(count_sub_transactions: bool) -> ColumnElement[bool]:
    """Filter to the transactions that count toward totals, so a group is never counted twice.

    A group parent's amount always equals the sum of its children, so either the parent
    counts (its children are skipped) or its children count (the parent is skipped).
    Ungrouped transactions always count.
    """
    if not count_sub_transactions:
        return col(Transaction.group_id).is_(None)
    child = aliased(Transaction)
    return ~exists().where(col(child.group_id) == col(Transaction.id))


async def adjust_group_parent_amount(
    session: AsyncSession, group_id: uuid.UUID | None, delta: float
) -> None:
    """Shift a group parent's amount by delta so it stays the sum of its children."""
    if group_id is None or delta == 0:
        return
    result = await session.exec(select(Transaction).where(Transaction.id == group_id))
    parent = result.first()
    if parent is None:
        return
    parent.amount += delta
    parent.updated_at = datetime.now(UTC)
    session.add(parent)
