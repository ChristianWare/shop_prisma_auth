
import { auth } from "@/auth";
// import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminDashboardPage() {
  // Retrieve the user session on the server side using auth()
  const session = await auth();


  console.log(session)

  // If no session or user isn't ADMIN, redirect (or you can choose to show an error)
//   if (!session?.user || session.user.role !== "ADMIN") {
//     redirect("/");
//   }

  // If the user is an admin, render the dashboard with links to admin pages.
  return (
    <main className='max-w-3xl mx-auto p-4'>
      <h1 className='text-3xl font-bold mb-6'>Admin Dashboard</h1>
      <ul className='space-y-4'>
        <li>
          <Link
            href='/admin/users'
            className='text-blue-600 hover:underline text-lg'
          >
            View All Users
          </Link>
        </li>
        <li>
          <Link
            href='/admin/reviews'
            className='text-blue-600 hover:underline text-lg'
          >
            Manage Reviews
          </Link>
        </li>
        {/* Add more admin links as needed, e.g. for inventory or reports */}
      </ul>
    </main>
  );
}
