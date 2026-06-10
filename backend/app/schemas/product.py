from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from ._validators import StrippedOptionalStr, StrippedStr


class ProductBase(BaseModel):
    name: StrippedStr = Field(min_length=1, max_length=200)
    sku: StrippedStr = Field(min_length=1, max_length=64)
    price: Decimal = Field(ge=Decimal("0"), max_digits=12, decimal_places=2)
    quantity_in_stock: int = Field(ge=0)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: StrippedOptionalStr = Field(default=None, min_length=1, max_length=200)
    sku: StrippedOptionalStr = Field(default=None, min_length=1, max_length=64)
    price: Decimal | None = Field(
        default=None, ge=Decimal("0"), max_digits=12, decimal_places=2
    )
    quantity_in_stock: int | None = Field(default=None, ge=0)


class ProductRead(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
