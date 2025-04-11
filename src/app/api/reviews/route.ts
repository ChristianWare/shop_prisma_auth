/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/reviews/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth"; // Import your v5 Auth from src/auth.ts
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

// Instantiate Prisma once (top-level, not on each request).
const prisma = new PrismaClient();

// Define the structure of the review POST body
interface ReviewBody {
  productId: string; // Shopify product ID or handle
  rating: number; // 1-5 star rating
  comment?: string; // optional review text
}

////////////////////////////////////////////////////////////////////////////////
// GET: /api/reviews?productId=<someProductId>
//
// Lists only approved reviews for the given productId.
////////////////////////////////////////////////////////////////////////////////
export async function GET(request: NextRequest) {
  try {
    // Read productId from query string
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { message: "Missing productId query param" },
        { status: 400 }
      );
    }

    // Fetch only approved reviews
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

////////////////////////////////////////////////////////////////////////////////
// POST: /api/reviews
//
// Creates a new review (unapproved by default) for a product.
// Body: { productId: string; rating: number; comment?: string }
// Requires user to be logged in (session).
////////////////////////////////////////////////////////////////////////////////
export async function POST(request: NextRequest) {
  try {
    // 1) Fetch current user session from your Auth.js v5
    const session = await auth();
    // If not logged in or no user ID in session, return 401
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "You must be logged in to leave a review" },
        { status: 401 }
      );
    }

    // 2) Parse and validate request body
    const body = (await request.json()) as ReviewBody;
    const { productId, rating, comment } = body;

    if (!productId || typeof productId !== "string") {
      return NextResponse.json(
        { message: "Invalid or missing productId" },
        { status: 400 }
      );
    }
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: "rating must be a number between 1 and 5" },
        { status: 400 }
      );
    }

    // [OPTIONAL]: If "review only if purchased," verify user purchased product here
    // e.g. check local orders or call Shopify Admin API to confirm

    // 3) Create the new review, unapproved by default
    const newReview = await prisma.review.create({
      data: {
        // session.user.id is guaranteed to be a string here
        userId: session.user.id,
        productId,
        rating,
        comment,
        approved: false,
      },
    });

    // 4) Optionally email the admin about new review
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

////////////////////////////////////////////////////////////////////////////////
// sendAdminNotificationEmail(review)
// Helper function to send an email to the admin whenever a new review is submitted
////////////////////////////////////////////////////////////////////////////////
async function sendAdminNotificationEmail(review: any) {
  try {
    // Configure nodemailer transporter from your .env
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT),
      secure: false, // or true if your server uses SSL
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    // The admin email to notify
    const adminEmail = "admin@example.com"; // replace with real address

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
    // Not throwing to avoid blocking the review creation if email fails
  }
}
