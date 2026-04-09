import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  product_id: string;
  variant_id?: string;
  quantity: number;
  name: string;
  variant_title?: string;
  sku?: string;
  price: number;
  image?: string;
  pv_points?: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  totalPvPoints: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem('ecom_cart');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('ecom_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(
        i => i.product_id === item.product_id && i.variant_id === item.variant_id
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prev, { ...item, quantity }];
    });
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    setCart(prev => prev.filter(i => !(i.product_id === productId && i.variant_id === variantId)));
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }
    setCart(prev => prev.map(i =>
      i.product_id === productId && i.variant_id === variantId
        ? { ...i, quantity }
        : i
    ));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('ecom_cart');
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPvPoints = cart.reduce((sum, item) => sum + (item.pv_points || 0) * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount, totalPvPoints }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
