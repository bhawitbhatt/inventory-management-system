from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models import Product
from app.schemas.product import ProductCreate, ProductUpdate


def list_products(db: Session) -> list[Product]:
    return list(db.scalars(select(Product).order_by(Product.id.desc())).all())


def get_product(db: Session, product_id: int) -> Product:
    product = db.get(Product, product_id)
    if product is None:
        raise NotFoundError(f"Product {product_id} not found.")
    return product


def get_product_by_sku(db: Session, sku: str) -> Product | None:
    return db.scalar(select(Product).where(Product.sku == sku))


def create_product(db: Session, payload: ProductCreate) -> Product:
    if get_product_by_sku(db, payload.sku) is not None:
        raise ConflictError(f"Product with SKU '{payload.sku}' already exists.")

    product = Product(
        name=payload.name,
        sku=payload.sku,
        price=payload.price,
        quantity_in_stock=payload.quantity_in_stock,
    )
    db.add(product)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflictError(f"Product with SKU '{payload.sku}' already exists.") from exc
    db.refresh(product)
    return product


def update_product(db: Session, product_id: int, payload: ProductUpdate) -> Product:
    stmt = select(Product).where(Product.id == product_id).with_for_update()
    product = db.scalars(stmt).first()
    if product is None:
        raise NotFoundError(f"Product {product_id} not found.")

    data = payload.model_dump(exclude_unset=True)

    if "sku" in data and data["sku"] != product.sku:
        existing = get_product_by_sku(db, data["sku"])
        if existing is not None and existing.id != product.id:
            raise ConflictError(f"Product with SKU '{data['sku']}' already exists.")

    for field, value in data.items():
        setattr(product, field, value)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflictError("Product update violates a uniqueness constraint.") from exc
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int) -> None:
    product = get_product(db, product_id)
    try:
        db.delete(product)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflictError(
            f"Cannot delete product {product_id}: it is referenced by one or more orders."
        ) from exc
