// src/app/products/[handle]/AddToCartButton.tsx
"use client";

import { useState } from "react";
import { useCart } from "@/providers/CartProvider";

interface Props {
  productVariantId: string;
  quantity?: number;
}

export default function AddToCartButton({
  productVariantId,
  quantity = 1,
}: Props) {
  const { addToCart } = useCart();
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  async function handleClick() {
    setStatus("loading");
    try {
      // call the context method, not direct fetch
      await addToCart(productVariantId, quantity);
      setStatus("success");

      // revert to idle after 2 seconds
      setTimeout(() => setStatus("idle"), 2000);
    } catch (error) {
      console.error("AddToCart error:", error);
      setStatus("error");
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={status === "loading"}
        className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
      >
        {status === "loading" ? "Adding..." : "Add to Cart"}
      </button>

      {status === "success" && (
        <p className='text-green-600 mt-2'>Added to cart!</p>
      )}
      {status === "error" && (
        <p className='text-red-600 mt-2'>Error adding to cart.</p>
      )}
    </div>
  );
}
