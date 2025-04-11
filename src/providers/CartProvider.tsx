"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface CartLine {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    product: {
      title: string;
      handle: string;
      images: { edges: { node: { url: string } }[] } | null;
    };
    price: { amount: string; currencyCode: string };
  };
}

interface CartData {
  id: string;
  checkoutUrl: string;
  lines: {
    edges: { node: CartLine }[];
  };
}

interface CartContextType {
  // Cart data (including lines, checkoutUrl, etc.)
  cart: CartData | null;

  // Derived count (sum of all line quantities)
  cartCount: number;

  // Are we in the process of fetching/updating the cart?
  loading: boolean;

  // Methods to manipulate the cart
  addToCart: (variantId: string, quantity?: number) => Promise<void>;
  removeLine: (lineId: string) => Promise<void>;
  updateLine: (lineId: string, quantity: number) => Promise<void>;

  // If you want a method to fetch or refresh the cart on demand
  fetchCart: (cartId: string) => Promise<void>;
}

// Create the context
const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartData | null>(null);
  const [cartId, setCartId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // On mount, restore cartId from localStorage and fetch the cart
  useEffect(() => {
    const storedCartId = localStorage.getItem("shopify_cart_id");
    if (storedCartId) {
      setCartId(storedCartId);
      fetchCart(storedCartId).catch((err) =>
        console.error("Error fetching cart on mount:", err)
      );
    }
  }, []);

  /**
   * Helper to retrieve the Shopify cart by ID and update our state
   */
  async function fetchCart(id: string) {
    try {
      setLoading(true);
      const res = await fetch(`/api/cart?cartId=${id}`);
      if (!res.ok) {
        console.error("Failed to fetch cart from API");
        return;
      }
      const data = await res.json();
      setCart(data.cart || null);
    } catch (error) {
      console.error("fetchCart error:", error);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Create a new cart or add to existing cart
   */
  async function addToCart(variantId: string, quantity = 1) {
    try {
      setLoading(true);
      if (!cartId) {
        // No cart yet => create new
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create",
            lines: [{ merchandiseId: variantId, quantity }],
          }),
        });
        if (!res.ok) {
          console.error("Failed to create cart");
          return;
        }
        const data = await res.json();
        const newCart = data.cart;
        if (newCart?.id) {
          localStorage.setItem("shopify_cart_id", newCart.id);
          setCartId(newCart.id);
          setCart(newCart);
        }
      } else {
        // We have a cart => add line
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "add",
            cartId,
            lines: [{ merchandiseId: variantId, quantity }],
          }),
        });
        if (!res.ok) {
          console.error("Failed to add line to cart");
          return;
        }
        const data = await res.json();
        setCart(data.cart || null);
      }
    } catch (error) {
      console.error("addToCart error:", error);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Remove a line by lineId
   */
  async function removeLine(lineId: string) {
    if (!cartId) return;
    try {
      setLoading(true);
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove",
          cartId,
          lineIds: [lineId],
        }),
      });
      if (!res.ok) {
        console.error("Failed to remove line");
        return;
      }
      const data = await res.json();
      setCart(data.cart || null);
    } catch (error) {
      console.error("removeLine error:", error);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Update line quantity
   */
  async function updateLine(lineId: string, quantity: number) {
    if (!cartId) return;
    try {
      setLoading(true);
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          cartId,
          lines: [{ id: lineId, quantity }],
        }),
      });
      if (!res.ok) {
        console.error("Failed to update line");
        return;
      }
      const data = await res.json();
      setCart(data.cart || null);
    } catch (error) {
      console.error("updateLine error:", error);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Derive cartCount by summing line item quantities
   */
  const cartCount = React.useMemo(() => {
    if (!cart || !cart.lines) return 0;
    return cart.lines.edges.reduce((sum, { node }) => sum + node.quantity, 0);
  }, [cart]);

  const value: CartContextType = {
    cart,
    cartCount,
    loading,
    addToCart,
    removeLine,
    updateLine,
    fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside a <CartProvider>");
  }
  return context;
}
