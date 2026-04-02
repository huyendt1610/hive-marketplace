import { create } from "zustand";

export interface WishlistItem {
  id: string;
  product: {
    id: string;
    title: string;
    price: number;
    images: string[];
    stock_quantity: number;
  };
}

interface WishlistState {
  items: WishlistItem[];
  totalItems: number;
  addItem: (item: WishlistItem) => void;
  removeItem: (itemId: string) => void;
  clearWishlist: () => void;
  setWishlist: (items: WishlistItem[]) => void;
  hasProduct: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  totalItems: 0,
  addItem: (item) => {
    set((state) => {
      if (state.items.some((i) => i.product.id === item.product.id)) {
        return state;
      }
      const updatedItems = [...state.items, item];
      return { items: updatedItems, totalItems: updatedItems.length };
    });
  },
  removeItem: (itemId) => {
    set((state) => {
      const updatedItems = state.items.filter((i) => i.id !== itemId);
      return { items: updatedItems, totalItems: updatedItems.length };
    });
  },
  clearWishlist: () => {
    set({ items: [], totalItems: 0 });
  },
  setWishlist: (items) => {
    set({ items, totalItems: items.length });
  },
  hasProduct: (productId) => {
    return get().items.some((i) => i.product.id === productId);
  },
}));

