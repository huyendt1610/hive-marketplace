from pydantic import BaseModel
from typing import List
from app.schemas.product import ProductResponse


class WishlistItemCreate(BaseModel):
    product_id: str


class WishlistItemResponse(BaseModel):
    id: str
    product: ProductResponse

    class Config:
        from_attributes = True


class WishlistResponse(BaseModel):
    id: str
    items: List[WishlistItemResponse]
    total_items: int

    class Config:
        from_attributes = True

