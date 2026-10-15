from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlmodel import col, select

from app.models.transaction import Transaction, TransactionTag

if TYPE_CHECKING:
    import uuid

    from sqlmodel.ext.asyncio.session import AsyncSession

    from app.schemas.transaction import BulkUpdateRequest


async def _apply_bulk_update_to_transaction(
    txn: Transaction, body: BulkUpdateRequest, session: AsyncSession, now: datetime
) -> bool:
    modified = False

    if body.category_id is not None:
        txn.category_id = body.category_id
        modified = True

    if body.add_tag_ids:
        existing_tags_result = await session.exec(
            select(TransactionTag).where(col(TransactionTag.transaction_id) == txn.id)
        )
        existing_tag_ids = {tt.tag_id for tt in existing_tags_result.all()}
        for tag_id in body.add_tag_ids:
            if tag_id not in existing_tag_ids:
                session.add(TransactionTag(transaction_id=txn.id, tag_id=tag_id))
                modified = True

    if body.remove_tag_ids:
        for tag_id in body.remove_tag_ids:
            tt_result = await session.exec(
                select(TransactionTag).where(
                    col(TransactionTag.transaction_id) == txn.id,
                    col(TransactionTag.tag_id) == tag_id,
                )
            )
            tt = tt_result.first()
            if tt is not None:
                await session.delete(tt)
                modified = True

    if modified:
        txn.updated_at = now

    return modified


async def apply_bulk_update(
    session: AsyncSession, wallet_id: uuid.UUID, body: BulkUpdateRequest
) -> int:
    """Apply a bulk category/tag update to transactions in a wallet; returns how many matched.

    Setting a category on a group parent also sets it on the parent's children. Callers
    must validate the wallet, category and tags belong to the user. Does not commit.
    """
    updated_count = 0
    now = datetime.now(UTC)

    for transaction_id in body.transaction_ids:
        result = await session.exec(
            select(Transaction).where(
                Transaction.id == transaction_id, Transaction.wallet_id == wallet_id
            )
        )
        transaction = result.first()
        if transaction is None:
            continue

        targets: list[Transaction] = [transaction]
        if transaction.group_id is None and body.category_id is not None:
            children_result = await session.exec(
                select(Transaction).where(col(Transaction.group_id) == transaction.id)
            )
            targets.extend(children_result.all())

        for txn in targets:
            modified = await _apply_bulk_update_to_transaction(txn, body, session, now)
            if modified:
                session.add(txn)

        updated_count += 1

    return updated_count
