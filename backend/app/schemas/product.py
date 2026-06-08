from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProductBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    sku: str = Field(min_length=1, max_length=64)
    price: Decimal = Field(ge=Decimal("0"), max_digits=12, decimal_places=2)
    quantity_in_stock: int = Field(ge=0)

    @field_validator("name", "sku", mode="before")
    @classmethod
    def _strip(cls, v):
        return v.strip() if isinstance(v, str) else v


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    sku: str | None = Field(default=None, min_length=1, max_length=64)
    price: Decimal | None = Field(default=None, ge=Decimal("0"), max_digits=12, decimal_places=2)
    quantity_in_stock: int | None = Field(default=None, ge=0)

    @field_validator("name", "sku", mode="before")
    @classmethod
    def _strip(cls, v):
        return v.strip() if isinstance(v, str) else v


class ProductRead(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
