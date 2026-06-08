from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import products as crud
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductRead])
def list_products(db: Session = Depends(get_db)) -> list:
    return crud.list_products(db)


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    return crud.create_product(db, payload)


@router.get("/{product_id}", response_model=ProductRead)
def get_product(product_id: int, db: Session = Depends(get_db)):
    return crud.get_product(db, product_id)


@router.put("/{product_id}", response_model=ProductRead)
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    return crud.update_product(db, product_id, payload)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)) -> None:
    crud.delete_product(db, product_id)
