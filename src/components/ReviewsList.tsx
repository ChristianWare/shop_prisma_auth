// src/components/ReviewsList.tsx
import React from "react";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  adminResponse?: string | null;
  user: {
    name: string | null;
    email: string;
  };
  createdAt?: string;
}

export default function ReviewsList({ reviews }: { reviews: Review[] }) {
  if (!reviews || reviews.length === 0) {
    return <p className='mt-4'>No reviews yet.</p>;
  }

  return (
    <div className='mt-4 space-y-4'>
      <h3 className='text-lg font-semibold'>Reviews</h3>
      {reviews.map((r) => (
        <div key={r.id} className='border-b pb-2'>
          <div className='flex items-center mb-1'>
            {renderStarRating(r.rating)}
            <span className='ml-2 text-sm text-gray-600'>
              by {r.user.name || r.user.email},
              {r.createdAt
                ? ` ${new Date(r.createdAt).toLocaleDateString()}`
                : ""}
            </span>
          </div>
          <p className='text-gray-800'>{r.comment}</p>
          {r.adminResponse && (
            <p className='mt-1 text-sm text-blue-700'>
              <strong>Admin response:</strong> {r.adminResponse}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function renderStarRating(rating: number) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const fill = i <= rating ? "text-yellow-400" : "text-gray-300";
    stars.push(
      <svg
        key={i}
        xmlns='http://www.w3.org/2000/svg'
        fill='currentColor'
        viewBox='0 0 24 24'
        className={`w-5 h-5 ${fill}`}
      >
        <path d='M12 .587l3.668 7.431L24 9.75l-6 5.851L19.335 24 12 19.771 4.665 24l1.335-8.399L0 9.75l8.332-1.732L12 .587z' />
      </svg>
    );
  }
  return <div className='flex'>{stars}</div>;
}
