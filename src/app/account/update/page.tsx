// app/account/update/page.tsx

import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic"; // Enable server actions

export default async function AccountUpdatePage() {
  // 1) Get the user session from Auth.js v5
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return (
      <main className='max-w-xl mx-auto p-4'>
        <h2 className='text-xl font-bold mb-4'>Please Log In</h2>
        <p>You must be signed in to update your account.</p>
      </main>
    );
  }

  // Capture the user ID in a constant so it's not nullable later
  const userId = session.user.id;

  // 2) Load existing user data from the database
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    await prisma.$disconnect();
    return notFound();
  }
  await prisma.$disconnect();

  // 3) Define a server action to update the user's account
  async function updateAccount(formData: FormData) {
    "use server";

    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    // Use the captured userId from above; we know it's not null.
    const newName = formData.get("name") as string;
    const newEmail = formData.get("email") as string;
    const newPassword = formData.get("password") as string;

    const dataToUpdate: { name?: string; email?: string; password?: string } =
      {};

    if (newName) dataToUpdate.name = newName;
    if (newEmail) dataToUpdate.email = newEmail;
    if (newPassword) {
      const hashed = await bcrypt.hash(newPassword, 10);
      dataToUpdate.password = hashed;
    }

    if (Object.keys(dataToUpdate).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
      });
    }

    await prisma.$disconnect();

    // Refresh the page path to show updated info
    revalidatePath("/account/update");
  }

  return (
    <main className='max-w-xl mx-auto p-4'>
      <h2 className='text-2xl font-bold mb-6'>Update Account</h2>

      <form action={updateAccount}>
        <div className='mb-4'>
          <label className='block text-sm font-semibold mb-1'>Name</label>
          <input
            type='text'
            name='name'
            defaultValue={user.name || ""}
            className='w-full border rounded px-3 py-2'
          />
        </div>

        <div className='mb-4'>
          <label className='block text-sm font-semibold mb-1'>Email</label>
          <input
            type='email'
            name='email'
            defaultValue={user.email || ""}
            className='w-full border rounded px-3 py-2'
          />
        </div>

        <div className='mb-4'>
          <label className='block text-sm font-semibold mb-1'>
            New Password (leave blank to keep current)
          </label>
          <input
            type='password'
            name='password'
            className='w-full border rounded px-3 py-2'
          />
        </div>

        <button
          type='submit'
          className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
        >
          Save Changes
        </button>
      </form>
    </main>
  );
}
