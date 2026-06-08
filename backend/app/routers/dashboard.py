from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.models import Customer, Order, Product
from app.schemas.dashboard import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardStats)
def dashboard(db: Session = Depends(get_db)) -> DashboardStats:
    settings = get_settings()
    threshold = settings.low_stock_threshold

    total_products = db.scalar(select(func.count()).select_from(Product)) or 0
    total_customers = db.scalar(select(func.count()).select_from(Customer)) or 0
    total_orders = db.scalar(select(func.count()).select_from(Order)) or 0

    low_stock = db.scalars(
        select(Product)
        .where(Product.quantity_in_stock < threshold)
        .order_by(Product.quantity_in_stock.asc(), Product.id.asc())
    ).all()

    return DashboardStats(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        low_stock_threshold=threshold,
        low_stock_products=list(low_stock),
    )
