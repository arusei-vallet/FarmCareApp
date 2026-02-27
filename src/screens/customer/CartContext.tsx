import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_CONFIG = {
  CART_KEY: '@farmcare:cart',
};

/* =========================
   Product Interface
========================= */
export interface Product {
  id?: string;
  name: string;
  price: string;
  mostPurchased?: boolean;
  latest?: boolean;
}

/* =========================
   Cart Item (with quantity)
========================= */
export interface CartItem extends Product {
  quantity: number;
}

/* =========================
   Context Type
========================= */
interface CartContextType {
  cartItems: CartItem[];
  addItem: (product: Product) => void;
  updateQuantity: (productName: string, quantity: number) => void;
  removeItem: (productName: string) => void;
  decreaseQuantity: (productName: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  isLoading: boolean;
}

/* =========================
   Create Context
========================= */
export const CartContext = createContext<CartContextType | undefined>(undefined);

/* =========================
   Provider Props
========================= */
interface CartProviderProps {
  children: ReactNode;
}

/* =========================
   Cart Provider
========================= */
export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /* =========================
     Load cart from AsyncStorage on mount
  ========================= */
  useEffect(() => {
    loadCart();
  }, []);

  /* =========================
     Save cart to AsyncStorage whenever it changes
  ========================= */
  useEffect(() => {
    if (!isLoading) {
      saveCart(cartItems);
    }
  }, [cartItems, isLoading]);

  const loadCart = async () => {
    try {
      const storedCart = await AsyncStorage.getItem(CACHE_CONFIG.CART_KEY);
      if (storedCart) {
        const parsed = JSON.parse(storedCart);
        if (Array.isArray(parsed)) {
          setCartItems(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCart = async (items: CartItem[]) => {
    try {
      await AsyncStorage.setItem(CACHE_CONFIG.CART_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  /* =========================
     Add Item (with quantity logic)
  ========================= */
  const addItem = (product: Product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(
        item => item.name === product.name
      );

      if (existingItem) {
        return prevItems.map(item =>
          item.name === product.name
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  /* =========================
     Update Quantity
  ========================= */
  const updateQuantity = (productName: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productName);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.name === productName
          ? { ...item, quantity }
          : item
      )
    );
  };

  /* =========================
     Remove Item Completely
  ========================= */
  const removeItem = (productName: string) => {
    setCartItems(prevItems =>
      prevItems.filter(item => item.name !== productName)
    );
  };

  /* =========================
     Decrease Quantity
  ========================= */
  const decreaseQuantity = (productName: string) => {
    setCartItems(prevItems =>
      prevItems
        .map(item =>
          item.name === productName
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  };

  /* =========================
     Clear Cart
  ========================= */
  const clearCart = () => {
    setCartItems([]);
  };

  /* =========================
     Calculate Cart Total
  ========================= */
  const cartTotal = cartItems.reduce((sum, item) => {
    const price = parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0;
    return sum + price * item.quantity;
  }, 0);

  /* =========================
     Calculate Cart Item Count
  ========================= */
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addItem,
        updateQuantity,
        removeItem,
        decreaseQuantity,
        clearCart,
        cartTotal,
        cartCount,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

/* =========================
   Custom Hook for using Cart Context
========================= */
export const useCart = () => {
  const context = React.useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
