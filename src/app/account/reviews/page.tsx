// app/account/reviews/page.tsx

import { auth } from "@/auth"; // NextAuth v5 from src/auth.ts
// import { notFound } from "next/navigation";

export default async function AccountReviewsPage() {
  // 1) Check if user is logged in
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <main className='max-w-xl mx-auto p-4'>
        <h2 className='text-xl font-bold mb-4'>Please Log In</h2>
        <p>You must be signed in to view your reviews.</p>
      </main>
    );
  }

  // 2) Load the user’s reviews from the DB
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const reviews = await prisma.review.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  prisma.$disconnect();

  if (!reviews || reviews.length === 0) {
    return (
      <main className='max-w-xl mx-auto p-4'>
        <h2 className='text-2xl font-bold mb-4'>My Reviews</h2>
        <p>You haven’t submitted any reviews yet.</p>
      </main>
    );
  }

  // 3) Render the user’s reviews
  return (
    <main className='max-w-3xl mx-auto p-4'>
      <h2 className='text-2xl font-bold mb-6'>My Reviews</h2>
      <ul className='space-y-4'>
        {reviews.map((review) => (
          <li key={review.id} className='border p-4 rounded'>
            <p className='text-sm text-gray-600'>
              <strong>Product ID:</strong> {review.productId}
            </p>
            <p className='text-sm text-gray-600'>
              <strong>Rating:</strong> {review.rating} / 5
            </p>
            <p className='text-sm text-gray-700 mt-1'>
              <strong>Comment:</strong> {review.comment || "(no comment)"}
            </p>
            <p className='text-sm text-gray-700 mt-1'>
              <strong>Approved:</strong> {review.approved ? "Yes" : "No"}
            </p>
            {review.adminResponse && (
              <p className='text-sm text-blue-700 mt-1'>
                <strong>Admin response:</strong> {review.adminResponse}
              </p>
            )}
            <p className='text-xs text-gray-500 mt-2'>
              Created: {new Date(review.createdAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
