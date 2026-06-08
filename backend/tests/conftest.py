"""
Pytest configuration.

The DATABASE_URL env var is set BEFORE the app is imported so that the
module-level engine in `app.core.database` uses an isolated, file-based
SQLite database under the test temp dir. Each test gets a fresh schema.
"""
from __future__ import annotations

import os
import sys
import tempfile
import uuid
from collections.abc import Generator
from pathlib import Path

# 1) Ensure backend root (containing the `app/` package) is importable.
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

# 2) Point the app at a temp sqlite DB BEFORE importing app modules.
_TMP_DIR = Path(tempfile.gettempdir()) / "inventory_tests"
_TMP_DIR.mkdir(exist_ok=True)
_DB_FILE = _TMP_DIR / f"pytest_{uuid.uuid4().hex}.db"
os.environ["DATABASE_URL"] = f"sqlite:///{_DB_FILE}"
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173")
os.environ.setdefault("LOW_STOCK_THRESHOLD", "10")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(autouse=True)
def _reset_schema() -> Generator[None, None, None]:
    """Drop and recreate all tables before every test for full isolation."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as c:
        yield c
