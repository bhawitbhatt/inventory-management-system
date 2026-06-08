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
    r2 = client.post("/customers", json=_payload(email="dup@example.com", full_name="Other"))
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
