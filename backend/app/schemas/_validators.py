"""Shared schema validators.

A single source for tiny utilities (currently: whitespace strip) that
were previously copy-pasted into every schema's `_strip` field validator.
"""

from __future__ import annotations

from typing import Annotated

from pydantic import BeforeValidator


def _strip(v):
    """Strip leading/trailing whitespace on string values; pass-through otherwise."""
    return v.strip() if isinstance(v, str) else v


StrippedStr = Annotated[str, BeforeValidator(_strip)]
StrippedOptionalStr = Annotated[str | None, BeforeValidator(_strip)]
