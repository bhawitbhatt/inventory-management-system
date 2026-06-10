from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate

from ._helpers import commit_or_409


def list_customers(db: Session) -> list[Customer]:
    return list(db.scalars(select(Customer).order_by(Customer.id.desc())).all())


def get_customer(db: Session, customer_id: int) -> Customer:
    customer = db.get(Customer, customer_id)
    if customer is None:
        raise NotFoundError(f"Customer {customer_id} not found.")
    return customer


def get_customer_by_email(db: Session, email: str) -> Customer | None:
    norm = email.strip().lower()
    return db.scalar(select(Customer).where(func.lower(Customer.email) == norm))


def create_customer(db: Session, payload: CustomerCreate) -> Customer:
    email = payload.email.strip().lower()
    if get_customer_by_email(db, email) is not None:
        # Generic message — does NOT echo the email value (enumeration safety).
        raise ConflictError("A record with the same email already exists.")

    customer = Customer(
        full_name=payload.full_name,
        email=email,
        phone=payload.phone,
    )
    db.add(customer)
    commit_or_409(db, field="email")
    db.refresh(customer)
    return customer


def update_customer(db: Session, customer_id: int, payload: CustomerUpdate) -> Customer:
    """Partial update — only the fields the caller sends are touched."""
    stmt = select(Customer).where(Customer.id == customer_id).with_for_update()
    customer = db.scalars(stmt).first()
    if customer is None:
        raise NotFoundError(f"Customer {customer_id} not found.")

    data = payload.model_dump(exclude_unset=True)

    if "email" in data and data["email"] is not None:
        new_email = data["email"].strip().lower()
        if new_email != customer.email:
            existing = get_customer_by_email(db, new_email)
            if existing is not None and existing.id != customer.id:
                raise ConflictError("A record with the same email already exists.")
        data["email"] = new_email

    for field, value in data.items():
        if value is not None:
            setattr(customer, field, value)

    commit_or_409(db, field="email")
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
