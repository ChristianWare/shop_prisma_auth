// src/app/admin/reviews/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Review {
  id: string;
  productId: string;
  rating: number;
  comment: string | null;
  user: { name: string | null; email: string };
  createdAt: string;
}

export default function AdminReviewsPage() {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if user is admin using role instead of email
  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    if (isAdmin) {
      fetchUnapprovedReviews();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  async function fetchUnapprovedReviews() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/reviews?approved=false");
      // We'll create an admin-specific route or just a normal route that returns all reviews with ?approved=false
      if (!res.ok) throw new Error("Failed to fetch unapproved reviews");
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function updateReview(
    reviewId: string,
    approved: boolean,
    response?: string
  ) {
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approved,
          adminResponse: response,
        }),
      });
      if (!res.ok) throw new Error("Failed to update review");
      await fetchUnapprovedReviews();
    } catch (error) {
      console.error(error);
    }
  }

  if (!session) {
    return <p>Please sign in as admin</p>;
  }
  if (!isAdmin) {
    return <p>Access denied</p>;
  }
  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className='p-4'>
      <h1 className='text-2xl font-bold mb-4'>Admin: Review Approval</h1>
      {reviews.length === 0 ? (
        <p>No unapproved reviews.</p>
      ) : (
        <div className='space-y-4'>
          {reviews.map((r) => (
            <ReviewRow key={r.id} review={r} onUpdate={updateReview} />
          ))}
        </div>
      )}
    </div>
  );
}

// A small component for each review row
function ReviewRow({
  review,
  onUpdate,
}: {
  review: Review;
  onUpdate: (id: string, approved: boolean, response?: string) => void;
}) {
  const [adminResponse, setAdminResponse] = useState("");

  return (
    <div className='border p-4 rounded'>
      <p>
        <strong>Product:</strong> {review.productId}
      </p>
      <p>
        <strong>User:</strong> {review.user.name || review.user.email}
      </p>
      <p>
        <strong>Rating:</strong> {review.rating}
      </p>
      <p>
        <strong>Comment:</strong> {review.comment}
      </p>
      <textarea
        placeholder='Admin response (optional)'
        className='border w-full mt-2 p-2'
        value={adminResponse}
        onChange={(e) => setAdminResponse(e.target.value)}
      />
      <div className='mt-2 flex gap-2'>
        <button
          className='bg-green-600 text-white px-4 py-1 rounded'
          onClick={() => onUpdate(review.id, true, adminResponse)}
        >
          Approve
        </button>
        <button
          className='bg-red-600 text-white px-4 py-1 rounded'
          onClick={() => onUpdate(review.id, false)}
        >
          Deny
        </button>
      </div>
    </div>
  );
}
