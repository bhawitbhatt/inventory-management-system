def test_dashboard_counts_zero_initially(client):
    r = client.get("/dashboard")
    assert r.status_code == 200
    body = r.json()
    assert body["total_products"] == 0
    assert body["total_customers"] == 0
    assert body["total_orders"] == 0
    assert body["low_stock_products"] == []
    assert body["low_stock_threshold"] == 10


def test_dashboard_counts_and_low_stock(client):
    # 3 products: two below threshold, one above
    client.post(
        "/products",
        json={"name": "LowA", "sku": "LA", "price": "1", "quantity_in_stock": 2},
    )
    client.post(
        "/products",
        json={"name": "LowB", "sku": "LB", "price": "1", "quantity_in_stock": 5},
    )
    client.post(
        "/products",
        json={"name": "Plenty", "sku": "PL", "price": "1", "quantity_in_stock": 100},
    )
    client.post(
        "/customers",
        json={"full_name": "X", "email": "x@example.com", "phone": "+15550001"},
    )
    client.post(
        "/customers",
        json={"full_name": "Y", "email": "y@example.com", "phone": "+15550002"},
    )

    r = client.get("/dashboard")
    body = r.json()
    assert body["total_products"] == 3
    assert body["total_customers"] == 2
    assert body["total_orders"] == 0
    skus = {p["sku"] for p in body["low_stock_products"]}
    assert skus == {"LA", "LB"}
    # Sorted by ascending stock
    assert body["low_stock_products"][0]["sku"] == "LA"


def test_health_endpoint(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_root_endpoint(client):
    r = client.get("/")
    assert r.status_code == 200
    assert "docs" in r.json()


def test_health_returns_503_when_db_unreachable(client):
    (
        """""/health must return 503 when the DB is unreachable, not 200.

    Implementation: ``app.routers.health.health`` does ``db.execute(select(1))`` and
    translates SQLAlchemyError into ``BusinessError(..., status_code=503)``. This test
    overrides ``get_db`` with a session whose ``execute`` raises, pinning the 503 path.
    """
        ""
    )
    from sqlalchemy.exc import OperationalError

    from app.core.database import get_db
    from app.main import app

    class _BrokenSession:
        def execute(self, *_args, **_kwargs):
            raise OperationalError("simulated", None, Exception("unreachable"))

        def close(self):
            pass

    def _broken_db():
        yield _BrokenSession()

    app.dependency_overrides[get_db] = _broken_db
    try:
        r = client.get("/health")
        assert r.status_code == 503
        assert "detail" in r.json()
    finally:
        app.dependency_overrides.pop(get_db, None)
