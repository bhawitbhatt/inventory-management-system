from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import orders as crud
from app.schemas.order import OrderCreate, OrderRead

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=list[OrderRead])
def list_orders(db: Session = Depends(get_db)) -> list:
    return crud.list_orders(db)


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    return crud.create_order(db, payload)


@router.get("/{order_id}", response_model=OrderRead)
def get_order(order_id: int, db: Session = Depends(get_db)):
    return crud.get_order(db, order_id)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)) -> None:
    crud.delete_order(db, order_id)
