from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy.exc import IntegrityError
from sqlmodel import select

from app.models.category import Category
from app.models.tag import Tag
from app.models.transaction import Transaction

if TYPE_CHECKING:
    import uuid

    from sqlmodel.ext.asyncio.session import AsyncSession


async def find_or_create_category(
    user_id: uuid.UUID, name: str, session: AsyncSession, icon: str | None = None
) -> Category:
    async def _find() -> Category | None:
        result = await session.exec(select(Category).where(Category.user_id == user_id))
        for cat in result.all():
            if cat.name.lower() == name.lower():
                return cat
        return None

    existing = await _find()
    if existing is not None:
        return existing

    category = Category(user_id=user_id, name=name, icon=icon)
    try:
        async with session.begin_nested():
            session.add(category)
            await session.flush()
    except IntegrityError:
        # A concurrent transaction created the same category first; reuse it.
        existing = await _find()
        if existing is None:
            raise
        return existing
    await session.refresh(category)
    return category


async def find_or_create_tag(user_id: uuid.UUID, name: str, session: AsyncSession) -> Tag:
    stored_name = name[:100]

    async def _find() -> Tag | None:
        result = await session.exec(select(Tag).where(Tag.user_id == user_id))
        for tag in result.all():
            if tag.name.lower() == stored_name.lower():
                return tag
        return None

    existing = await _find()
    if existing is not None:
        return existing

    tag = Tag(user_id=user_id, name=stored_name)
    try:
        async with session.begin_nested():
            session.add(tag)
            await session.flush()
    except IntegrityError:
        # A concurrent transaction created the same tag first; reuse it.
        existing = await _find()
        if existing is None:
            raise
        return existing
    await session.refresh(tag)
    return tag


async def move_category_transactions(
    session: AsyncSession,
    source_id: uuid.UUID,
    target_id: uuid.UUID,
    wallet_id: uuid.UUID | None = None,
) -> int:
    """Reassign every transaction in source_id to target_id, optionally within one wallet.

    Sub-transactions are matched by their own category, not their parent's.
    Callers must verify the user owns both categories and the wallet. Does not commit.
    """
    query = select(Transaction).where(Transaction.category_id == source_id)
    if wallet_id is not None:
        query = query.where(Transaction.wallet_id == wallet_id)
    result = await session.exec(query)

    now = datetime.now(UTC)
    moved = 0
    for transaction in result.all():
        transaction.category_id = target_id
        transaction.updated_at = now
        session.add(transaction)
        moved += 1
    return moved
