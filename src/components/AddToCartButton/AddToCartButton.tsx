"use client"; // <— This is crucial

import React from "react";

interface AddToCartButtonProps {
  productId: string;
  // any other props you need from the product
}

export default function AddToCartButton({ productId }: AddToCartButtonProps) {
  // You could manage state or call an API route here
  // to actually add the item to Shopify's cart, etc.

  const handleAddToCart = () => {
    alert(`Product ${productId} was added to the cart!`);
    // More realistic:
    // - Call an API route: fetch("/api/cart", { method: "POST", body: JSON.stringify({ productId }) })
    // - Or integrate with Shopify's cart endpoint
  };

  return (
    <button
      type='button'
      className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
      onClick={handleAddToCart}
    >
      Add to Cart
    </button>
  );
}
