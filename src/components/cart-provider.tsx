"use client";

import { Listing } from "@/data/listings";
import { createContext, ReactNode, useContext, useMemo, useState } from "react";

export interface CartItem {
  productId: string;
  listingId: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (listing: Listing) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (listing: Listing) => {
    const productId = listing.storefrontProductId || listing.slug || listing.id;
    setItems((previous) => {
      const existing = previous.find((item) => item.productId === productId);
      if (existing) {
        return previous.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [
        ...previous,
        {
          productId,
          listingId: listing.id,
          name: listing.name,
          price: listing.priceUsd,
          quantity: 1
        }
      ];
    });
  };

  const removeItem = (productId: string) => {
    setItems((previous) => previous.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setItems((previous) =>
      previous.flatMap((item) => {
        if (item.productId !== productId) return [item];
        if (quantity <= 0) return [];
        return [{ ...item, quantity }];
      })
    );
  };

  const clearCart = () => setItems([]);

  const value = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      clearCart
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
