from decimal import Decimal

from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import ConflictError, NotFoundError
from app.models import Customer, Order, OrderItem, Product
from app.schemas.order import OrderCreate, OrderStatus


def _order_loaders():
    """Loader options used by every read path (list, get, post-create refetch)."""
    return (
        selectinload(Order.customer),
        selectinload(Order.items).selectinload(OrderItem.product),
    )


def list_orders(db: Session) -> list[Order]:
    stmt = select(Order).options(*_order_loaders()).order_by(Order.id.desc())
    return list(db.scalars(stmt).unique().all())


def get_order(db: Session, order_id: int) -> Order:
    stmt = select(Order).options(*_order_loaders()).where(Order.id == order_id)
    order = db.scalars(stmt).unique().first()
    if order is None:
        raise NotFoundError(f"Order {order_id} not found.")
    return order


def create_order(db: Session, payload: OrderCreate) -> Order:
    """
    Atomically create an order with strict no-oversell guarantees.

    Concurrency strategy (works on both PostgreSQL and SQLite):
      1. SELECT ... FOR UPDATE row locks on involved products (Postgres
         applies real row locks; SQLite ignores FOR UPDATE but serializes
         writes inherently via the database lock).
      2. Validate inventory + compute the server-trusted total.
      3. Decrement stock with a *conditional* UPDATE:
         ``SET qty = qty - :n WHERE id = :id AND qty >= :n``. If another
         transaction concurrently decremented stock past zero, rowcount
         is 0 — we raise ConflictError instead of producing negative
         stock. This is the true compare-and-swap safety net and the
         contract proven by ``test_concurrent_orders_do_not_oversell``.
      4. Persist the order and its line items in the same transaction.

    Any failure rolls back the transaction, leaving stock untouched.
    """
    customer = db.get(Customer, payload.customer_id)
    if customer is None:
        raise NotFoundError(f"Customer {payload.customer_id} not found.")

    qty_by_product: dict[int, int] = {}
    for item in payload.items:
        if item.quantity <= 0:
            raise ConflictError(
                f"Invalid quantity {item.quantity} for product {item.product_id}: must be > 0."
            )
        qty_by_product[item.product_id] = (
            qty_by_product.get(item.product_id, 0) + item.quantity
        )

    # Sort by id so concurrent transactions lock products in the same order (no deadlock).
    product_ids = sorted(qty_by_product.keys())

    stmt = select(Product).where(Product.id.in_(product_ids)).with_for_update()
    products = {p.id: p for p in db.scalars(stmt).all()}

    missing = [pid for pid in product_ids if pid not in products]
    if missing:
        raise NotFoundError(f"Product(s) not found: {missing}.")

    # Early friendly stock check; the CAS below is the authoritative safety net.
    for pid in product_ids:
        product = products[pid]
        requested = qty_by_product[pid]
        if product.quantity_in_stock < requested:
            raise ConflictError(
                f"Insufficient stock for product '{product.sku}': "
                f"requested {requested}, available {product.quantity_in_stock}."
            )

    total = Decimal("0")
    item_rows: list[OrderItem] = []
    for pid in product_ids:
        product = products[pid]
        requested = qty_by_product[pid]
        line_total = Decimal(product.price) * requested
        total += line_total
        item_rows.append(
            OrderItem(
                product_id=product.id,
                quantity=requested,
                unit_price=Decimal(product.price),
            )
        )

    # Conditional decrement — the true compare-and-swap (Postgres + SQLite).
    for pid in product_ids:
        requested = qty_by_product[pid]
        result = db.execute(
            update(Product)
            .where(Product.id == pid, Product.quantity_in_stock >= requested)
            .values(quantity_in_stock=Product.quantity_in_stock - requested)
        )
        if result.rowcount != 1:
            db.rollback()
            raise ConflictError(
                f"Insufficient stock for product '{products[pid].sku}' "
                f"(concurrent update detected)."
            )

    order = Order(
        customer_id=customer.id,
        total_amount=total.quantize(Decimal("0.01")),
        status=OrderStatus.confirmed.value,
        items=item_rows,
    )
    db.add(order)
    db.commit()

    return get_order(db, order.id)


def delete_order(db: Session, order_id: int) -> None:
    """
    Cancel an order and restore stock for each line item, race-safely.

    Concurrency strategy — compare-and-swap on the order row itself:
      1. Read the order with its items eagerly loaded so we have an
         items snapshot in memory. The read does NOT need a row lock:
         on SQLite ``FOR UPDATE`` is a no-op, so we cannot rely on it
         to serialise cancellation. The atomicity comes from step 2.
      2. Atomic ``DELETE FROM orders WHERE id = :id`` with a rowcount
         check. Exactly one concurrent caller observes ``rowcount == 1``;
         every other observer rolls back and raises 404 BEFORE
         restoring stock. This is the same compare-and-swap pattern as
         the conditional stock decrement in :func:`create_order`, and
         it works identically on PostgreSQL and SQLite.
      3. Restore stock for each line item with sequential ``UPDATE``s
         in product-id-sorted order. The ordering matches
         :func:`create_order`'s lock-acquisition order, which prevents
         deadlocks under PostgreSQL row locks. Stock is mass-conserved
         even if concurrent ``create_order`` calls run on the same
         products: each operation is independently atomic.

    DOES NOT touch the conditional-UPDATE CAS path in ``create_order``
    that ``test_concurrent_orders_do_not_oversell`` proves.
    """
    order = db.scalars(
        select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
    ).first()
    if order is None:
        raise NotFoundError(f"Order {order_id} not found.")

    items_snapshot = sorted(
        ((item.product_id, item.quantity) for item in order.items),
        key=lambda x: x[0],
    )

    # ATOMIC CAS on the order row — only one concurrent caller wins.
    # Works on Postgres AND SQLite (no FOR UPDATE dependency).
    result = db.execute(delete(Order).where(Order.id == order_id))
    if result.rowcount == 0:
        db.rollback()
        raise NotFoundError(f"Order {order_id} not found.")

    # We won the race — restore stock exactly once.
    for product_id, qty in items_snapshot:
        db.execute(
            update(Product)
            .where(Product.id == product_id)
            .values(quantity_in_stock=Product.quantity_in_stock + qty)
        )

    db.commit()
