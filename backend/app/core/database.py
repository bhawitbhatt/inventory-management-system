from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import get_settings


class Base(DeclarativeBase):
    pass


def _build_engine() -> Engine:
    settings = get_settings()
    url = settings.database_url

    # Render injects `postgres://` style URLs; SQLAlchemy 2 wants `postgresql+psycopg://`.
    if url.startswith("postgres://"):
        url = "postgresql+psycopg://" + url[len("postgres://"):]
    elif url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]

    connect_args: dict = {}
    if url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}

    return create_engine(
        url,
        pool_pre_ping=True,
        future=True,
        connect_args=connect_args,
    )


engine: Engine = _build_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    # Import models so they register with Base.metadata before create_all.
    from app.models import product, customer, order  # noqa: F401

    Base.metadata.create_all(bind=engine)
