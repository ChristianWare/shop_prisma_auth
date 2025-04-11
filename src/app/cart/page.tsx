/* eslint-disable @next/next/no-img-element */
"use client";

import { useCart } from "@/providers/CartProvider";

export default function CartPage() {
  // Read from our global context
  const { cart, removeLine, updateLine, loading } = useCart();

  // If the context is loading or hasn't fetched yet
  if (loading && !cart) {
    return <div className='p-4'>Loading cart...</div>;
  }

  // If no cart or empty cart
  if (!cart || !cart.lines || cart.lines.edges.length === 0) {
    return (
      <div className='p-4'>
        <h1 className='text-2xl font-bold mb-4'>Your Cart</h1>
        <p>Your cart is empty. Go shop!</p>
      </div>
    );
  }

  const lineItems = cart.lines.edges;

  return (
    <div className='p-4 max-w-4xl mx-auto'>
      <h1 className='text-2xl font-bold mb-6'>Your Cart</h1>

      {lineItems.map(({ node }) => {
        const line = node;
        const { product, title, price } = line.merchandise;
        const quantity = line.quantity;
        const productTitle = product.title;
        const imageUrl = product.images?.edges?.[0]?.node?.url;

        return (
          <div
            key={line.id}
            className='flex items-center justify-between border-b py-4'
          >
            <div className='flex items-center gap-4'>
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={productTitle}
                  className='w-16 h-16 object-cover'
                />
              )}
              <div>
                <p className='font-semibold'>{productTitle}</p>
                <p className='text-sm text-gray-600'>{title}</p>
                <p className='text-sm'>
                  {price.amount} {price.currencyCode}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              {/* Decrement Button */}
              <button
                className='border px-2'
                onClick={() => updateLine(line.id, quantity - 1)}
                disabled={quantity <= 1 || loading}
              >
                -
              </button>
              <span>{quantity}</span>
              {/* Increment Button */}
              <button
                className='border px-2'
                onClick={() => updateLine(line.id, quantity + 1)}
                disabled={loading}
              >
                +
              </button>
              {/* Remove Button */}
              <button
                onClick={() => removeLine(line.id)}
                className='text-red-500 ml-4'
                disabled={loading}
              >
                Remove
              </button>
            </div>
          </div>
        );
      })}

      <div className='mt-6'>
        <button
          onClick={() => {
            if (cart?.checkoutUrl) {
              window.location.href = cart.checkoutUrl;
            }
          }}
          className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
