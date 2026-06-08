from decimal import Decimal

from sqlalchemy import select, update
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import ConflictError, NotFoundError
from app.models import Customer, Order, OrderItem, Product
from app.schemas.order import OrderCreate


def list_orders(db: Session) -> list[Order]:
    stmt = (
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .order_by(Order.id.desc())
    )
    return list(db.scalars(stmt).unique().all())


def get_order(db: Session, order_id: int) -> Order:
    stmt = (
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .where(Order.id == order_id)
    )
    order = db.scalars(stmt).unique().first()
    if order is None:
        raise NotFoundError(f"Order {order_id} not found.")
    return order


def create_order(db: Session, payload: OrderCreate) -> Order:
    """
    Atomically create an order with strict no-oversell guarantees.

    Concurrency strategy (works on both PostgreSQL and SQLite):
      1. Acquire `SELECT ... FOR UPDATE` row locks on the involved products
         (Postgres applies real row locks; SQLite ignores FOR UPDATE but
         serializes writes inherently).
      2. Validate inventory + compute the server-trusted total.
      3. Decrement stock with a *conditional* UPDATE
         (`SET qty = qty - :n WHERE id = :id AND qty >= :n`). If another
         transaction concurrently decremented stock past zero, the WHERE
         clause fails and rowcount == 0 — we raise ConflictError instead
         of producing negative stock. This is a true compare-and-swap and
         is the actual safety net under concurrency.
      4. Persist the order and its line items in the same transaction.

    Any failure rolls back the transaction, leaving stock untouched.
    """
    # 1) Customer must exist
    customer = db.get(Customer, payload.customer_id)
    if customer is None:
        raise NotFoundError(f"Customer {payload.customer_id} not found.")

    # 2) Aggregate quantities by product so duplicate line entries collapse
    qty_by_product: dict[int, int] = {}
    for item in payload.items:
        if item.quantity <= 0:
            raise ConflictError(
                f"Invalid quantity {item.quantity} for product {item.product_id}: must be > 0."
            )
        qty_by_product[item.product_id] = qty_by_product.get(item.product_id, 0) + item.quantity

    # Sort by id so concurrent orders lock products in the same order (no deadlock)
    product_ids = sorted(qty_by_product.keys())

    # 3) Lock + read products
    stmt = select(Product).where(Product.id.in_(product_ids)).with_for_update()
    products = {p.id: p for p in db.scalars(stmt).all()}

    missing = [pid for pid in product_ids if pid not in products]
    if missing:
        raise NotFoundError(f"Product(s) not found: {missing}.")

    # 4) Validate stock upfront for an early, friendly error
    for pid in product_ids:
        product = products[pid]
        requested = qty_by_product[pid]
        if product.quantity_in_stock < requested:
            raise ConflictError(
                f"Insufficient stock for product '{product.sku}': "
                f"requested {requested}, available {product.quantity_in_stock}."
            )

    # 5) Compute total + line items using prices captured at order time
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

    # 6) Conditional decrement — true compare-and-swap, works on Postgres + SQLite
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

    # 7) Persist the order
    order = Order(
        customer_id=customer.id,
        total_amount=total.quantize(Decimal("0.01")),
        status="confirmed",
        items=item_rows,
    )
    db.add(order)
    db.commit()

    return get_order(db, order.id)


def delete_order(db: Session, order_id: int) -> None:
    """
    Delete (cancel) an order and restore the stock for each line item.
    Uses atomic UPDATEs so the restore is safe under concurrency.
    """
    order = get_order(db, order_id)
    items_snapshot = [(item.product_id, item.quantity) for item in order.items]

    product_ids = sorted({pid for pid, _ in items_snapshot})
    if product_ids:
        db.scalars(
            select(Product).where(Product.id.in_(product_ids)).with_for_update()
        ).all()

    for product_id, qty in items_snapshot:
        db.execute(
            update(Product)
            .where(Product.id == product_id)
            .values(quantity_in_stock=Product.quantity_in_stock + qty)
        )

    db.delete(order)
    db.commit()
