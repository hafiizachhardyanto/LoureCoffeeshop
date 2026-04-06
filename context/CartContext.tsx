"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { MenuItem, CartItem } from "@/types";

interface CartContextType {
  items: CartItem[];
  addToCart: (menuItem: MenuItem, quantity: number) => void;
  removeFromCart: (menuId: string) => void;
  updateQuantity: (menuId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
  networkError: boolean;
  setNetworkError: (value: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  const addToCart = (menuItem: MenuItem, quantity: number) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.menuId === menuItem.id);
      
      if (existing) {
        return prev.map((item) =>
          item.menuId === menuItem.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                subtotal: (item.quantity + quantity) * item.price,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          menuId: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity,
          subtotal: quantity * menuItem.price,
          menuItem,
        },
      ];
    });
  };

  const removeFromCart = (menuId: string) => {
    setItems((prev) => prev.filter((item) => item.menuId !== menuId));
  };

  const updateQuantity = (menuId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(menuId);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.menuId === menuId
          ? { ...item, quantity, subtotal: quantity * item.price }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setIsProcessing(false);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  const value: CartContextType = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalAmount,
    isProcessing,
    setIsProcessing,
    networkError,
    setNetworkError,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}