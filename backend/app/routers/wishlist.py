from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.wishlist import WishlistItem
from app.models.product import Product
from app.schemas.wishlist import WishlistItemCreate, WishlistResponse, WishlistItemResponse
from app.services.wishlist_service import (
    get_or_create_wishlist,
    add_wishlist_item,
    remove_wishlist_item,
    clear_wishlist,
)

router = APIRouter()


@router.get("", response_model=WishlistResponse)
async def get_wishlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get user's default wishlist."""
    wishlist = get_or_create_wishlist(db, current_user.id)
    wishlist_items = db.query(WishlistItem).filter(WishlistItem.wishlist_id == wishlist.id).all()

    items_response = []
    for item in wishlist_items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            continue

        # Get seller info (shape matches ProductResponse usage elsewhere)
        from app.models.user import User as UserModel

        seller = db.query(UserModel).filter(UserModel.id == product.seller_id).first()

        items_response.append(
            WishlistItemResponse(
                id=item.id,
                product={
                    "id": product.id,
                    "title": product.title,
                    "description": product.description,
                    "price": product.price,
                    "category": product.category,
                    "stock_quantity": product.stock_quantity,
                    "status": product.status,
                    "images": product.images or [],
                    "views_count": product.views_count,
                    "seller": {
                        "id": seller.id,
                        "business_name": seller.business_name or seller.full_name,
                    },
                    "average_rating": None,
                    "total_reviews": 0,
                    "created_at": product.created_at,
                },
            )
        )

    return WishlistResponse(id=wishlist.id, items=items_response, total_items=len(items_response))


@router.post("/items", response_model=WishlistItemResponse, status_code=status.HTTP_201_CREATED)
async def add_item(
    item_data: WishlistItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add item to wishlist (idempotent)."""
    wishlist_item = add_wishlist_item(db, current_user.id, item_data)

    product = db.query(Product).filter(Product.id == wishlist_item.product_id).first()
    from app.models.user import User as UserModel

    seller = db.query(UserModel).filter(UserModel.id == product.seller_id).first()

    return WishlistItemResponse(
        id=wishlist_item.id,
        product={
            "id": product.id,
            "title": product.title,
            "description": product.description,
            "price": product.price,
            "category": product.category,
            "stock_quantity": product.stock_quantity,
            "status": product.status,
            "images": product.images or [],
            "views_count": product.views_count,
            "seller": {"id": seller.id, "business_name": seller.business_name or seller.full_name},
            "average_rating": None,
            "total_reviews": 0,
            "created_at": product.created_at,
        },
    )


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove item from wishlist."""
    remove_wishlist_item(db, current_user.id, item_id)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear_wishlist_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Clear entire wishlist."""
    clear_wishlist(db, current_user.id)

