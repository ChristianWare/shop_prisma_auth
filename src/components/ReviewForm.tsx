// src/components/ReviewForm.tsx
"use client";

import { useState } from "react";

interface Props {
  productId: string; // the Shopify product ID or handle
}

export default function ReviewForm({ productId }: Props) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  async function submitReview() {
    setStatus("loading");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, comment }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setStatus("success");
      setComment("");
      setRating(0);
    } catch (error) {
      console.error("ReviewForm submit error:", error);
      setStatus("error");
    }
  }

  function renderStar(index: number) {
    // if hoverRating is set, use that, otherwise use the actual rating
    const fill =
      hoverRating >= index || (!hoverRating && rating >= index)
        ? "text-yellow-400"
        : "text-gray-300";
    return (
      <svg
        key={index}
        onMouseEnter={() => setHoverRating(index)}
        onMouseLeave={() => setHoverRating(0)}
        onClick={() => setRating(index)}
        xmlns='http://www.w3.org/2000/svg'
        fill='currentColor'
        viewBox='0 0 24 24'
        className={`w-6 h-6 cursor-pointer ${fill}`}
      >
        <path d='M12 .587l3.668 7.431L24 9.75l-6 5.851L19.335 24 12 19.771 4.665 24l1.335-8.399L0 9.75l8.332-1.732L12 .587z' />
      </svg>
    );
  }

  return (
    <div className='border p-4 rounded'>
      <h3 className='text-lg font-semibold mb-2'>Leave a Review</h3>
      {/* Star rating */}
      <div className='flex items-center mb-2'>
        {[1, 2, 3, 4, 5].map(renderStar)}
      </div>

      <textarea
        className='border w-full p-2 mb-2'
        rows={3}
        placeholder='Write your review...'
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <button
        onClick={submitReview}
        disabled={status === "loading" || rating === 0}
        className='bg-blue-600 text-white px-4 py-2 rounded disabled:bg-blue-300'
      >
        {status === "loading" ? "Submitting..." : "Submit Review"}
      </button>

      {status === "success" && (
        <p className='text-green-600 mt-2'>
          Review submitted! Awaiting approval.
        </p>
      )}
      {status === "error" && (
        <p className='text-red-600 mt-2'>Error submitting review.</p>
      )}
    </div>
  );
}
