// app/admin/users/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  shopifyCustomerId: string | null;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Check admin status using role
  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    // Redirect if not admin
    if (
      status === "unauthenticated" ||
      (status === "authenticated" && !isAdmin)
    ) {
      router.push("/");
      return;
    }

    if (status === "authenticated" && isAdmin) {
      fetchUsers();
    }
  }, [status, isAdmin, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminStatus = async (userId: string, currentRole: string) => {
    try {
      const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) throw new Error("Failed to update user role");

      // Update local state
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  };

  if (status === "loading" || loading) {
    return <div className='p-4'>Loading...</div>;
  }

  if (!isAdmin) {
    return null; // Will redirect in useEffect
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
              <th className='py-2 px-4 border'>Admin Status</th>
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
                  <div className='flex items-center justify-center'>
                    <span
                      className={`px-2 py-1 ${
                        user.role === "ADMIN"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      } rounded-full text-xs font-semibold mr-2`}
                    >
                      {user.role === "ADMIN" ? "Yes" : "No"}
                    </span>
                    <button
                      onClick={() => toggleAdminStatus(user.id, user.role)}
                      className={`px-3 py-1 text-xs font-medium text-white rounded ${
                        user.role === "ADMIN"
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-blue-500 hover:bg-blue-600"
                      }`}
                    >
                      {user.role === "ADMIN" ? "Remove Admin" : "Make Admin"}
                    </button>
                  </div>
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
