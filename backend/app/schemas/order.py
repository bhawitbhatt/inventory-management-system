from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, computed_field

from .customer import CustomerRead
from .product import ProductRead


class OrderItemCreate(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0, le=100_000)


class OrderCreate(BaseModel):
    customer_id: int = Field(gt=0)
    items: list[OrderItemCreate] = Field(min_length=1)


class OrderItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    product: ProductRead | None = None

    @computed_field  # type: ignore[prop-decorator]
    @property
    def line_total(self) -> Decimal:
        return (self.unit_price * self.quantity).quantize(Decimal("0.01"))


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    total_amount: Decimal
    status: str
    created_at: datetime
    customer: CustomerRead | None = None
    items: list[OrderItemRead] = []
