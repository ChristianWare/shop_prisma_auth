// src/components/ProductVariantSelector.tsx
"use client";

import { useState } from "react";
import { useCart } from "@/providers/CartProvider"; // or your custom addToCart logic

interface ProductVariantSelectorProps {
  product: {
    id: string;
    title: string;
    variants: Array<{
      id: string;
      title: string;
      price: {
        amount: string;
        currencyCode: string;
      };
      selectedOptions?: Array<{
        name: string;
        value: string;
      }>;
    }>;
  };
}

export default function ProductVariantSelector({
  product,
}: ProductVariantSelectorProps) {
  const { addToCart } = useCart(); // if using a Cart context

  // 1) Track which variant is selected
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants?.[0]?.id || ""
  );
  // 2) Optional quantity. Hardcode 1 for now or let the user choose
  const [quantity, setQuantity] = useState(1);

  if (!product?.variants || product.variants.length === 0) {
    return <p className='mb-4'>No variants available.</p>;
  }

  // 3) When user clicks Add to Cart
  async function handleAddToCart() {
    if (!selectedVariantId) {
      alert("Please select a variant.");
      return;
    }
    // 4) Call your cart logic
    await addToCart(selectedVariantId, quantity);
    alert("Added to cart!");
  }

  return (
    <div className='border p-4 rounded'>
      <h2 className='text-lg font-semibold mb-2'>Choose a variant:</h2>

      {/* Radio options for each variant */}
      <div className='space-y-2 mb-4'>
        {product.variants.map((variant) => {
          // e.g. "Size: M, Color: Red"
          const optsString = variant.selectedOptions
            ?.map((opt) => `${opt.name}: ${opt.value}`)
            .join(", ");
          // e.g. "Variant A - 19.99 USD (Size: M, Color: Blue)"
          const label = `${variant.title} - ${variant.price.amount} ${
            variant.price.currencyCode
          }${optsString ? ` (${optsString})` : ""}`;

          return (
            <label key={variant.id} className='flex items-center space-x-2'>
              <input
                type='radio'
                name='product-variant'
                value={variant.id}
                checked={selectedVariantId === variant.id}
                onChange={() => setSelectedVariantId(variant.id)}
              />
              <span>{label}</span>
            </label>
          );
        })}
      </div>

      {/* Optional quantity input */}
      <div className='mb-4'>
        <label className='mr-2 text-sm font-medium'>Quantity:</label>
        <input
          type='number'
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className='w-16 border rounded px-2 py-1'
        />
      </div>

      <button
        className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
        onClick={handleAddToCart}
      >
        Add to Cart
      </button>
    </div>
  );
}
