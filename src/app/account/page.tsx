// app/account/page.tsx

import { auth } from "@/auth"; // NextAuth v5
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AccountPage() {
  // 1) Check if user is logged in
  const session = await auth();
  if (!session?.user) {
    // If not logged in, you could redirect to /auth/signin or show a message
    return (
      <main className='max-w-xl mx-auto p-4'>
        <h2 className='text-xl font-bold mb-4'>Please Log In</h2>
        <p>You must be signed in to access your account.</p>
      </main>
    );
  }

  // 2) If logged in, you might fetch additional user data or just display links
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      shopifyCustomerId: true,
      // or any other fields you want to display
    },
  });
  prisma.$disconnect();

  if (!user) {
    return notFound();
  }

  return (
    <main className='max-w-xl mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-6'>My Account</h1>

      {/* Basic user info */}
      <div className='mb-6'>
        <p className='text-sm text-gray-700'>
          <strong>Name: </strong>
          {user.name || "(no name set)"}
        </p>
        <p className='text-sm text-gray-700'>
          <strong>Email: </strong>
          {user.email}
        </p>
      </div>

      {/* Links to various account sections */}
      <ul className='space-y-3'>
        <li>
          <Link
            href='/account/orders'
            className='text-blue-600 hover:underline text-sm'
          >
            View Past Orders
          </Link>
        </li>
        <li>
          <Link
            href='/account/reviews'
            className='text-blue-600 hover:underline text-sm'
          >
            My Reviews
          </Link>
        </li>
        <li>
          <Link
            href='/account/update'
            className='text-blue-600 hover:underline text-sm'
          >
            Update Account Info
          </Link>
        </li>
        {/* Add more as needed: addresses, payment methods, wishlist, etc. */}
      </ul>
    </main>
  );
}
