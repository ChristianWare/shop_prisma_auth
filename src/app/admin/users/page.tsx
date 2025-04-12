// app/admin/users/page.tsx
import { auth } from "@/auth"; // NextAuth v5 from your src/auth.ts
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";

export default async function AdminUsersPage() {
  // Retrieve the session (server-side)
  const session = await auth();

  // Check admin status by verifying the email


  // Fetch all users from the database
  const prisma = new PrismaClient();
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      shopifyCustomerId: true,
      role: true, // Add role to the selection
    },
    orderBy: {
      email: "asc",
    },
  });
  await prisma.$disconnect();

  const isAdmin = session?.user?.role === "ADMIN";
    // const isAdmin = session?.user?.email === "chris.ware.dev@gmail.com";
    if (!session?.user || !isAdmin) {
      redirect("/");
    }



  return (
    <main className='max-w-4xl mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-4'>All Users</h1>
      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table className='min-w-full border border-gray-200'>
          <thead>
            <tr className='bg-gray-100'>
              <th className='py-2 px-4 border'>ID</th>
              <th className='py-2 px-4 border'>Name</th>
              <th className='py-2 px-4 border'>Email</th>
              <th className='py-2 px-4 border'>Admin</th>
              <th className='py-2 px-4 border'>Shopify Customer ID</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className='text-center'>
                <td className='py-2 px-4 border'>{user.id}</td>
                <td className='py-2 px-4 border'>{user.name || "-"}</td>
                <td className='py-2 px-4 border'>{user.email || "-"}</td>
                <td className='py-2 px-4 border'>
                  {user.role === "ADMIN" ? (
                    <span className='px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold'>
                      Yes
                    </span>
                  ) : (
                    <span className='px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold'>
                      No
                    </span>
                  )}
                </td>
                <td className='py-2 px-4 border'>
                  {user.shopifyCustomerId || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className='mt-4'>
        <Link href='/admin' className='text-blue-600 hover:underline'>
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
