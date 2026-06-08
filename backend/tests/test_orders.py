from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal


def _mk_product(client, sku="P-1", price="10.00", qty=20):
    return client.post(
        "/products",
        json={"name": f"Item {sku}", "sku": sku, "price": price, "quantity_in_stock": qty},
    ).json()


def _mk_customer(client, email="buyer@example.com"):
    return client.post(
        "/customers",
        json={"full_name": "Buyer Person", "email": email, "phone": "+15550000"},
    ).json()


def test_create_order_happy_path(client):
    p1 = _mk_product(client, sku="A", price="10.00", qty=5)
    p2 = _mk_product(client, sku="B", price="2.50", qty=10)
    c = _mk_customer(client)

    r = client.post(
        "/orders",
        json={
            "customer_id": c["id"],
            "items": [
                {"product_id": p1["id"], "quantity": 2},
                {"product_id": p2["id"], "quantity": 4},
            ],
        },
    )
    assert r.status_code == 201, r.text
    body = r.json()
    # 2 * 10 + 4 * 2.5 = 30
    assert Decimal(body["total_amount"]) == Decimal("30.00")
    assert body["customer_id"] == c["id"]
    assert len(body["items"]) == 2
    # Items carry unit_price snapshot
    for it in body["items"]:
        assert Decimal(it["unit_price"]) > 0
        assert "line_total" in it

    # Stock decremented
    assert client.get(f"/products/{p1['id']}").json()["quantity_in_stock"] == 3
    assert client.get(f"/products/{p2['id']}").json()["quantity_in_stock"] == 6


def test_order_with_insufficient_stock_rejected(client):
    p = _mk_product(client, qty=3)
    c = _mk_customer(client)
    r = client.post(
        "/orders",
        json={"customer_id": c["id"], "items": [{"product_id": p["id"], "quantity": 10}]},
    )
    assert r.status_code == 409
    # No partial decrement — stock still 3
    assert client.get(f"/products/{p['id']}").json()["quantity_in_stock"] == 3


def test_order_missing_customer_404(client):
    p = _mk_product(client)
    r = client.post(
        "/orders",
        json={"customer_id": 9999, "items": [{"product_id": p["id"], "quantity": 1}]},
    )
    assert r.status_code == 404


def test_order_missing_product_404(client):
    c = _mk_customer(client)
    r = client.post(
        "/orders",
        json={"customer_id": c["id"], "items": [{"product_id": 9999, "quantity": 1}]},
    )
    assert r.status_code == 404


def test_order_empty_items_rejected(client):
    c = _mk_customer(client)
    r = client.post("/orders", json={"customer_id": c["id"], "items": []})
    assert r.status_code == 422


def test_order_zero_quantity_rejected(client):
    p = _mk_product(client)
    c = _mk_customer(client)
    r = client.post(
        "/orders",
        json={"customer_id": c["id"], "items": [{"product_id": p["id"], "quantity": 0}]},
    )
    assert r.status_code == 422


def test_get_list_orders(client):
    p = _mk_product(client, qty=10)
    c = _mk_customer(client)
    client.post(
        "/orders",
        json={"customer_id": c["id"], "items": [{"product_id": p["id"], "quantity": 1}]},
    )
    client.post(
        "/orders",
        json={"customer_id": c["id"], "items": [{"product_id": p["id"], "quantity": 2}]},
    )
    r = client.get("/orders")
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_delete_order_restores_stock(client):
    p = _mk_product(client, qty=10)
    c = _mk_customer(client)
    order = client.post(
        "/orders",
        json={"customer_id": c["id"], "items": [{"product_id": p["id"], "quantity": 3}]},
    ).json()

    assert client.get(f"/products/{p['id']}").json()["quantity_in_stock"] == 7

    r = client.delete(f"/orders/{order['id']}")
    assert r.status_code == 204
    assert client.get(f"/products/{p['id']}").json()["quantity_in_stock"] == 10
    assert client.get(f"/orders/{order['id']}").status_code == 404


def test_concurrent_orders_do_not_oversell(client):
    """
    Two simultaneous orders for the only available unit must result in
    EXACTLY one success and one conflict — never two successes, never
    negative stock. This is the killer concurrency test that proves the
    conditional-UPDATE compare-and-swap pattern works.
    """
    p = _mk_product(client, sku="SOLE", qty=1)
    c = _mk_customer(client)

    payload = {
        "customer_id": c["id"],
        "items": [{"product_id": p["id"], "quantity": 1}],
    }

    def place_order():
        return client.post("/orders", json=payload).status_code

    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = [executor.submit(place_order) for _ in range(8)]
        results = [f.result() for f in futures]

    successes = sum(1 for s in results if s == 201)
    failures = sum(1 for s in results if s == 409)
    assert successes == 1, f"expected exactly one success, got {results}"
    assert failures == 7, f"expected seven 409s, got {results}"

    # Final stock is 0 — never negative
    final = client.get(f"/products/{p['id']}").json()
    assert final["quantity_in_stock"] == 0


def test_order_uses_server_computed_total(client):
    """
    The client must not be able to influence total_amount. Even if it
    tries to send one, the server ignores it and recomputes from the
    product price snapshot. (Schema doesn't accept total_amount; we just
    verify it's authoritative.)
    """
    p = _mk_product(client, price="123.45", qty=10)
    c = _mk_customer(client)
    r = client.post(
        "/orders",
        json={
            "customer_id": c["id"],
            "items": [{"product_id": p["id"], "quantity": 2}],
        },
    )
    assert r.status_code == 201
    assert Decimal(r.json()["total_amount"]) == Decimal("246.90")


def test_order_ignores_client_supplied_total(client):
    """
    Security regression: even when a malicious client tries to supply
    `total_amount` in the request body (e.g. 1 cent for a $150 order),
    the server must IGNORE it and compute the authoritative total from
    the product price snapshot. The schema doesn't declare the field,
    so Pydantic silently drops it — but we assert the end-to-end behaviour
    here so this property is locked down by a test.
    """
    p = _mk_product(client, price="50.00", qty=10)
    c = _mk_customer(client)
    r = client.post(
        "/orders",
        json={
            "customer_id": c["id"],
            "items": [{"product_id": p["id"], "quantity": 3}],
            "total_amount": "0.01",  # malicious client trying to underpay
        },
    )
    assert r.status_code == 201
    assert Decimal(r.json()["total_amount"]) == Decimal("150.00")
