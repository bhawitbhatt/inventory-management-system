"""Shared CRUD helpers.

Centralises the commit-and-409-on-conflict pattern that was previously
duplicated across products, customers, and orders. The 409 response
intentionally does NOT echo the conflicting value (e.g. an email or SKU)
to close a small enumeration vector where the response would otherwise
confirm whether a specific value already exists in the database.
"""

from __future__ import annotations

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError


def commit_or_409(db: Session, *, field: str) -> None:
    """Commit the session; translate IntegrityError into a 409 ConflictError.

    Args:
        db: the active SQLAlchemy session.
        field: the field name that uniqueness applies to (``"email"`` /
            ``"sku"``). Included in the message so the frontend can attach
            the error to the right input WITHOUT learning the conflicting
            value itself.
    """
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflictError(
            f"A record with the same {field} already exists.",
        ) from exc
