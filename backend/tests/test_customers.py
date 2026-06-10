def _payload(**overrides):
    base = {
        "full_name": "Alice Walker",
        "email": "alice@example.com",
        "phone": "+1-555-0100",
    }
    base.update(overrides)
    return base


def test_create_and_get_customer(client):
    r = client.post("/customers", json=_payload())
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["id"] > 0
    assert body["email"] == "alice@example.com"

    r2 = client.get(f"/customers/{body['id']}")
    assert r2.status_code == 200
    assert r2.json()["full_name"] == "Alice Walker"


def test_list_customers(client):
    client.post("/customers", json=_payload(email="a@b.c"))
    client.post("/customers", json=_payload(email="d@e.f"))
    r = client.get("/customers")
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_duplicate_email_returns_409(client):
    r1 = client.post("/customers", json=_payload(email="dup@example.com"))
    assert r1.status_code == 201
    r2 = client.post(
        "/customers", json=_payload(email="dup@example.com", full_name="Other")
    )
    assert r2.status_code == 409


def test_invalid_email_rejected(client):
    r = client.post("/customers", json=_payload(email="not-an-email"))
    assert r.status_code == 422


def test_delete_customer(client):
    c = client.post("/customers", json=_payload()).json()
    r = client.delete(f"/customers/{c['id']}")
    assert r.status_code == 204
    r2 = client.get(f"/customers/{c['id']}")
    assert r2.status_code == 404


def test_get_missing_customer_returns_404(client):
    r = client.get("/customers/9999")
    assert r.status_code == 404


def test_duplicate_email_is_case_insensitive(client):
    (
        """""Case-insensitive email uniqueness: JANE@x.com must collide with jane@x.com.

    Implementation lives at crud/customers.py via ``func.lower(...)``. This test
    pins that contract so a regression to case-sensitive comparison is caught.
    """
        ""
    )
    r1 = client.post(
        "/customers",
        json=_payload(email="JANE@example.com"),
    )
    assert r1.status_code == 201
    r2 = client.post(
        "/customers",
        json=_payload(email="jane@example.com", full_name="Jane Lower"),
    )
    assert r2.status_code == 409


def test_update_customer_happy_path(client):
    created = client.post("/customers", json=_payload()).json()
    r = client.put(
        f"/customers/{created['id']}",
        json={"full_name": "Alice Updated", "phone": "+1-555-9999"},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["full_name"] == "Alice Updated"
    assert body["phone"] == "+1-555-9999"
    # Email unchanged by partial update
    assert body["email"] == "alice@example.com"


def test_update_customer_partial(client):
    created = client.post("/customers", json=_payload()).json()
    # Only updating one field — every other field must be preserved.
    r = client.put(f"/customers/{created['id']}", json={"full_name": "Alice Only"})
    assert r.status_code == 200
    body = r.json()
    assert body["full_name"] == "Alice Only"
    assert body["email"] == "alice@example.com"
    assert body["phone"] == "+1-555-0100"


def test_update_customer_email_collision_returns_409(client):
    a = client.post("/customers", json=_payload(email="a@example.com")).json()
    client.post("/customers", json=_payload(email="b@example.com", full_name="Bob"))
    r = client.put(f"/customers/{a['id']}", json={"email": "b@example.com"})
    assert r.status_code == 409


def test_update_missing_customer_returns_404(client):
    r = client.put("/customers/99999", json={"full_name": "Ghost"})
    assert r.status_code == 404


def test_delete_missing_customer_returns_404(client):
    r = client.delete("/customers/99999")
    assert r.status_code == 404
