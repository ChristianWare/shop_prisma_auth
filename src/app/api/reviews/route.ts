/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/reviews/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth"; // NextAuth v5 "auth()" from src/auth.ts
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

/**
 * GET /api/reviews?productId=<ShopifyProductID>
 * Lists only *approved* reviews for the specified product ID.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { message: "Missing productId query param" },
        { status: 400 }
      );
    }

    const reviews = await prisma.review.findMany({
      where: {
        productId,
        approved: true,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reviews }, { status: 200 });
  } catch (error) {
    console.error("GET /api/reviews error:", error);
    return NextResponse.json(
      { message: "Server error fetching reviews" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews
 * Body: { productId: string, rating: number, comment?: string }
 *
 * Requires user to be logged in AND to have purchased this product
 * by checking orders from the Shopify Admin API.
 */
export async function POST(request: NextRequest) {
  try {
    // 1) Check user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "You must be logged in to leave a review" },
        { status: 401 }
      );
    }

    // 2) Parse request body
    const body = await request.json();
    const { productId, rating, comment } = body;
    if (!productId || typeof rating !== "number") {
      return NextResponse.json(
        { message: "productId (string) and rating (number) are required" },
        { status: 400 }
      );
    }

    // 3) Load the local user => get shopifyCustomerId
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user) {
      return NextResponse.json(
        { message: "User not found in DB" },
        { status: 404 }
      );
    }
    if (!user.shopifyCustomerId) {
      return NextResponse.json(
        {
          message:
            "No Shopify customer ID found for this user, cannot verify purchase",
        },
        { status: 403 }
      );
    }

    // 4) Check Shopify Admin Orders to confirm user purchased product
    const purchased = await userPurchasedProductShopify(
      user.shopifyCustomerId,
      productId
    );
    if (!purchased) {
      return NextResponse.json(
        { message: "You can only review a product you've purchased." },
        { status: 403 }
      );
    }

    // 5) Create the review
    const newReview = await prisma.review.create({
      data: {
        userId: user.id,
        productId,
        rating,
        comment,
        approved: false, // admin must approve
      },
    });

    // 6) Optionally email the admin about new review
    await sendAdminNotificationEmail(newReview);

    return NextResponse.json(
      {
        message: "Review created successfully, pending admin approval",
        review: newReview,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/reviews error:", error);
    return NextResponse.json(
      { message: "Server error creating review" },
      { status: 500 }
    );
  }
}

/**
 * userPurchasedProductShopify(customerId, productId)
 * Queries Shopify Admin for the user's orders, checks line items for matching productId.
 *
 * If you have many orders, consider pagination or GraphQL approach.
 * This example fetches the first page of up to 50 orders (configurable).
 */
async function userPurchasedProductShopify(
  shopifyCustomerId: string,
  productId: string
): Promise<boolean> {
  try {
    // 1) Convert the "gid://shopify/Customer/123" format to numeric ID if needed
    // Some endpoints want the numeric ID, others accept GID.
    // If you need the numeric ID, parse it:
    // e.g. "gid://shopify/Customer/1234567890" => "1234567890"
    const numericId = shopifyCustomerId.split("/").pop();

    // 2) Fetch orders for this customer from Shopify Admin
    // e.g. /admin/api/2023-04/orders.json?customer_id=NUMERIC_ID
    // We'll limit to 50 for this example. If your user might have more, add pagination logic.
    const limit = 50;
    const url = `orders.json?customer_id=${numericId}&limit=${limit}`;
    const adminResponse = await shopifyAdminRequest(url);

    if (!adminResponse?.orders) {
      return false;
    }
    const orders = adminResponse.orders as any[];

    // 3) For each order, check line items for matching product ID
    //    This depends on how you identify "productId" vs. line item IDs
    for (const order of orders) {
      if (!order.line_items) continue;
      for (const line of order.line_items) {
        // line.product_id is typically the numeric product ID in Shopify
        // productId might be "gid://shopify/Product/123..."
        // so let's parse each side or store them consistently
        const lineItemGid = `gid://shopify/Product/${line.product_id}`;
        if (lineItemGid === productId) {
          return true;
        }
      }
    }

    return false;
  } catch (err) {
    console.error("Error verifying purchase via Shopify Admin:", err);
    return false;
  }
}

/**
 * shopifyAdminRequest(endpoint: string, method = "GET", data?)
 * A helper to call the Shopify Admin API.
 * E.g. shopifyAdminRequest("orders.json?limit=50");
 */
async function shopifyAdminRequest(
  endpoint: string,
  method = "GET",
  data?: any
) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN; // your-store.myshopify.com
  const adminToken = process.env.SHOPIFY_ADMIN_API_TOKEN;
  // Make sure you have set 'SHOPIFY_ADMIN_API_TOKEN' in your .env

  const apiVersion = "2023-04"; // or whichever version you're using
  const url = `https://${domain}/admin/api/${apiVersion}/${endpoint}`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": adminToken || "",
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Shopify Admin API error: ${res.status} ${res.statusText} - ${text}`
    );
  }

  return res.json();
}

/**
 * A helper to notify admin about a new review
 */
async function sendAdminNotificationEmail(review: any) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    const adminEmail = "admin@example.com"; // replace with real admin email

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: adminEmail,
      subject: "New Product Review Submitted",
      text: `A new review was submitted:
Product ID: ${review.productId}
Rating: ${review.rating}
Comment: ${review.comment || "(no comment)"}

Please approve or deny in your admin panel.`,
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Failed to send admin notification email:", err);
  }
}
