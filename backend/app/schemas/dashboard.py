from pydantic import BaseModel

from .product import ProductRead


class DashboardStats(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_threshold: int
    low_stock_products: list[ProductRead]
