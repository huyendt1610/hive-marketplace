from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.middleware.auth import require_seller
from app.models.user import User
from app.models.product import Product
from app.models.order import Order, OrderItem

router = APIRouter()


@router.get("/stats")
async def get_seller_stats(
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    """Get seller dashboard statistics"""
    # Total products
    total_products = db.query(Product).filter(Product.seller_id == current_user.id).count()
    
    # Active products
    active_products = db.query(Product).filter(
        Product.seller_id == current_user.id,
        Product.status == "active"
    ).count()
    
    # Total orders (orders containing seller's products)
    total_orders = db.query(Order).join(OrderItem).filter(
        OrderItem.seller_id == current_user.id
    ).distinct().count()
    
    # Pending orders
    pending_orders = db.query(Order).join(OrderItem).filter(
        OrderItem.seller_id == current_user.id,
        Order.status == "pending"
    ).distinct().count()
    
    # Total revenue (sum of order items where seller is the seller)
    total_revenue = db.query(func.sum(OrderItem.price_at_order * OrderItem.quantity)).filter(
        OrderItem.seller_id == current_user.id
    ).scalar() or 0.0
    
    # Low stock products (stock < 5)
    low_stock_products = db.query(Product).filter(
        Product.seller_id == current_user.id,
        Product.stock_quantity < 5,
        Product.stock_quantity > 0
    ).count()
    
    return {
        "total_products": total_products,
        "active_products": active_products,
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "total_revenue": float(total_revenue),
        "low_stock_products": low_stock_products
    }
