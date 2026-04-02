"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/Toast";
import { AuthRequiredGuard } from "@/app/utils/RoleGuard";
import { EmptyWishlist } from "@/components/EmptyState";
import { useWishlistStore } from "@/store/wishlistStore";
import { useCartStore } from "@/store/cartStore";

interface WishlistItemData {
  id: string;
  product: {
    id: string;
    title: string;
    price: number;
    images: string[];
    stock_quantity: number;
    seller: {
      id: string;
      business_name: string;
    };
  };
}

interface WishlistData {
  id: string;
  items: WishlistItemData[];
  total_items: number;
}

export default function WishlistPage() {
  return (
    <AuthRequiredGuard>
      <WishlistContent />
    </AuthRequiredGuard>
  );
}

function WishlistContent() {
  const [wishlist, setWishlist] = useState<WishlistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const toast = useToast();
  const { setWishlist: setStoreWishlist } = useWishlistStore();
  const { setCart: setStoreCart } = useCartStore();

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const data = await api.get<WishlistData>("/api/wishlist");
      setWishlist(data);
      setStoreWishlist(
        data.items.map((item) => ({
          id: item.id,
          product: {
            id: item.product.id,
            title: item.product.title,
            price: item.product.price,
            images: item.product.images || [],
            stock_quantity: item.product.stock_quantity,
          },
        }))
      );
    } catch (error) {
      console.error("Failed to load wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      setUpdating(itemId);
      await api.delete(`/api/wishlist/items/${itemId}`);
      await loadWishlist();
      toast.success("Removed from wishlist");
    } catch (error) {
      console.error("Failed to remove wishlist item:", error);
      toast.error(error instanceof Error ? error.message : "Failed to remove item");
    } finally {
      setUpdating(null);
    }
  };

  const addToCart = async (productId: string) => {
    try {
      setAddingToCart(productId);
      await api.post("/api/cart/items", {
        product_id: productId,
        quantity: 1,
      });

      const cartData = await api.get<{ items: any[] }>("/api/cart");
      const cartItems = cartData.items.map((item: any) => ({
        id: item.id,
        product: {
          id: item.product.id,
          title: item.product.title,
          price: item.product.price,
          images: item.product.images || [],
          stock_quantity: item.product.stock_quantity,
        },
        quantity: item.quantity,
        subtotal: item.subtotal,
      }));
      setStoreCart(cartItems);

      toast.success("Added to cart!");
    } catch (error) {
      console.error("Failed to add to cart:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add to cart");
    } finally {
      setAddingToCart(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="h-8 w-48 bg-[#F3F4F6] rounded mb-6 animate-shimmer" />
        <div className="space-y-4">
          <div className="h-24 bg-white border border-[#E5E7EB] rounded-xl animate-shimmer" />
          <div className="h-24 bg-white border border-[#E5E7EB] rounded-xl animate-shimmer" />
          <div className="h-24 bg-white border border-[#E5E7EB] rounded-xl animate-shimmer" />
        </div>
      </div>
    );
  }

  if (!wishlist || wishlist.items.length === 0) {
    return <EmptyWishlist />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-[#111827]">
          Wishlist ({wishlist.total_items} {wishlist.total_items === 1 ? "item" : "items"})
        </h1>
        <Link href="/home">
          <Button variant="secondary">Continue Shopping</Button>
        </Link>
      </div>

      <div className="space-y-4">
        {wishlist.items.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex gap-4"
          >
            <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-[#E5E7EB]">
              {item.product.images && item.product.images.length > 0 ? (
                <Image
                  src={item.product.images[0]}
                  alt={item.product.title}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="w-full h-full bg-[#F3F4F6] flex items-center justify-center">
                  <span className="text-xs text-[#9CA3AF]">No image</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <Link
                href={`/product/${item.product.id}`}
                className="font-medium text-[#111827] hover:underline line-clamp-2"
              >
                {item.product.title}
              </Link>
              <p className="text-sm text-[#6B7280] mt-1">
                By: {item.product.seller.business_name}
              </p>

              {item.product.stock_quantity === 0 ? (
                <p className="text-xs text-[#EF4444] mt-2">Out of stock</p>
              ) : item.product.stock_quantity <= 5 ? (
                <p className="text-xs text-[#F59E0B] mt-2">
                  Only {item.product.stock_quantity} left in stock
                </p>
              ) : null}
            </div>

            <div className="flex flex-col items-end justify-between">
              <div className="flex items-center gap-3">
                <p className="font-semibold text-[#111827]">{formatPrice(item.product.price)}</p>
                <Button
                  variant="secondary"
                  className="h-9 px-3"
                  onClick={() => addToCart(item.product.id)}
                  disabled={item.product.stock_quantity === 0 || updating === item.id || addingToCart === item.product.id}
                  isLoading={addingToCart === item.product.id}
                >
                  {addingToCart !== item.product.id && <ShoppingCart className="w-4 h-4 mr-2" />}
                  Add to cart
                </Button>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                disabled={updating === item.id}
                className="text-[#EF4444] hover:text-[#DC2626] text-sm flex items-center gap-1 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

