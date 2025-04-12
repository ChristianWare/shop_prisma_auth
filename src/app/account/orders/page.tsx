/* eslint-disable @typescript-eslint/no-explicit-any */
// app/account/orders/page.tsx

import { auth } from "@/auth"; // NextAuth v5: your src/auth.ts
import { notFound } from "next/navigation";

/**
 * We'll fetch up to 50 orders from Shopify Admin for the logged-in user,
 * identified by `shopifyCustomerId`. If they have none or are not logged in,
 * we show a message.
 */
export default async function AccountOrdersPage() {
  // 1) Check if the user is logged in
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <main className='max-w-xl mx-auto p-4'>
        <h2 className='text-xl font-bold mb-4'>Please Log In</h2>
        <p>You must be signed in to view your order history.</p>
      </main>
    );
  }

  // 2) Fetch user from your DB to get shopifyCustomerId
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  prisma.$disconnect();

  if (!user) {
    return notFound();
  }
  if (!user.shopifyCustomerId) {
    return (
      <main className='max-w-xl mx-auto p-4'>
        <h2 className='text-xl font-bold mb-4'>No Shopify ID found</h2>
        <p>We cannot retrieve your orders at this time.</p>
      </main>
    );
  }

  // 3) Fetch the user's orders from Shopify Admin
  const orders = await fetchCustomerOrders(user.shopifyCustomerId);

  // 4) Render page
  if (!orders || orders.length === 0) {
    return (
      <main className='max-w-xl mx-auto p-4'>
        <h2 className='text-2xl font-bold mb-4'>My Orders</h2>
        <p>You have no orders yet.</p>
      </main>
    );
  }

  return (
    <main className='max-w-3xl mx-auto p-4'>
      <h2 className='text-2xl font-bold mb-6'>My Orders</h2>
      <div className='space-y-4'>
        {orders.map((order: any) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </main>
  );
}

/**
 * fetchCustomerOrders(shopifyCustomerId)
 *
 * Uses Shopify Admin REST to get up to 50 orders for this customer.
 * If more than 50, you'd add pagination or switch to GraphQL.
 */
async function fetchCustomerOrders(shopifyCustomerId: string) {
  // Convert "gid://shopify/Customer/123456" to numeric
  const numericId = shopifyCustomerId.split("/").pop();
  const limit = 50;
  const endpoint = `orders.json?customer_id=${numericId}&limit=${limit}`;
  const data = await shopifyAdminRequest(endpoint);
  if (!data?.orders) {
    return [];
  }
  return data.orders;
}

/**
 * A helper function to make requests to Shopify Admin API
 */
async function shopifyAdminRequest(
  endpoint: string,
  method = "GET",
  body?: any
) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const adminToken = process.env.SHOPIFY_ADMIN_API_TOKEN;
  const apiVersion = "2023-04"; // or whichever version you use

  const url = `https://${domain}/admin/api/${apiVersion}/${endpoint}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": adminToken || "",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Shopify Admin error ${res.status} ${res.statusText} - ${text}`
    );
  }

  return res.json();
}

/**
 * A small component to display an individual order's details:
 * order number, date, line items, total price, etc.
 */
function OrderCard({ order }: { order: any }) {
  return (
    <div className='border p-4 rounded'>
      <h3 className='text-lg font-semibold mb-2'>Order #{order.name}</h3>
      <p className='text-sm text-gray-600 mb-2'>
        Placed on {new Date(order.created_at).toLocaleDateString()}
      </p>

      {order.line_items && order.line_items.length > 0 ? (
        <ul className='list-disc list-inside mb-2'>
          {order.line_items.map((line: any) => (
            <li key={line.id}>
              {line.title} x {line.quantity}
            </li>
          ))}
        </ul>
      ) : (
        <p>No items found in this order.</p>
      )}

      <p className='text-sm'>
        <strong>Total: </strong>
        {order.total_price} {order.currency || "USD"}
      </p>
    </div>
  );
}
