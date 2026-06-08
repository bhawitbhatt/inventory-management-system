def _payload(**overrides):
    base = {
        "name": "Widget",
        "sku": "WDG-001",
        "price": "19.99",
        "quantity_in_stock": 50,
    }
    base.update(overrides)
    return base


def test_create_and_get_product(client):
    r = client.post("/products", json=_payload())
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["id"] > 0
    assert body["name"] == "Widget"
    assert body["sku"] == "WDG-001"
    assert body["quantity_in_stock"] == 50

    r2 = client.get(f"/products/{body['id']}")
    assert r2.status_code == 200
    assert r2.json()["sku"] == "WDG-001"


def test_list_products(client):
    client.post("/products", json=_payload(sku="A"))
    client.post("/products", json=_payload(sku="B"))
    r = client.get("/products")
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_duplicate_sku_returns_409(client):
    r1 = client.post("/products", json=_payload(sku="SAME"))
    assert r1.status_code == 201
    r2 = client.post("/products", json=_payload(sku="SAME", name="Other"))
    assert r2.status_code == 409
    assert "SAME" in r2.json()["detail"]


def test_negative_stock_rejected_by_validation(client):
    r = client.post("/products", json=_payload(quantity_in_stock=-1))
    assert r.status_code == 422


def test_negative_price_rejected_by_validation(client):
    r = client.post("/products", json=_payload(price="-1.00"))
    assert r.status_code == 422


def test_update_product(client):
    p = client.post("/products", json=_payload()).json()
    r = client.put(f"/products/{p['id']}", json={"price": "29.99", "quantity_in_stock": 100})
    assert r.status_code == 200
    body = r.json()
    assert body["price"] == "29.99"
    assert body["quantity_in_stock"] == 100
    assert body["sku"] == "WDG-001"  # unchanged


def test_update_to_duplicate_sku_returns_409(client):
    a = client.post("/products", json=_payload(sku="A")).json()
    client.post("/products", json=_payload(sku="B"))
    r = client.put(f"/products/{a['id']}", json={"sku": "B"})
    assert r.status_code == 409


def test_delete_product(client):
    p = client.post("/products", json=_payload()).json()
    r = client.delete(f"/products/{p['id']}")
    assert r.status_code == 204
    r2 = client.get(f"/products/{p['id']}")
    assert r2.status_code == 404


def test_get_missing_product_returns_404(client):
    r = client.get("/products/9999")
    assert r.status_code == 404
