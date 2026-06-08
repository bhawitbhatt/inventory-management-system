from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models import Customer
from app.schemas.customer import CustomerCreate


def list_customers(db: Session) -> list[Customer]:
    return list(db.scalars(select(Customer).order_by(Customer.id.desc())).all())


def get_customer(db: Session, customer_id: int) -> Customer:
    customer = db.get(Customer, customer_id)
    if customer is None:
        raise NotFoundError(f"Customer {customer_id} not found.")
    return customer


def get_customer_by_email(db: Session, email: str) -> Customer | None:
    return db.scalar(select(Customer).where(Customer.email == email))


def create_customer(db: Session, payload: CustomerCreate) -> Customer:
    if get_customer_by_email(db, payload.email) is not None:
        raise ConflictError(f"Customer with email '{payload.email}' already exists.")

    customer = Customer(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
    )
    db.add(customer)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflictError(f"Customer with email '{payload.email}' already exists.") from exc
    db.refresh(customer)
    return customer


def delete_customer(db: Session, customer_id: int) -> None:
    customer = get_customer(db, customer_id)
    try:
        db.delete(customer)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflictError(
            f"Cannot delete customer {customer_id}: they are referenced by one or more orders."
        ) from exc
