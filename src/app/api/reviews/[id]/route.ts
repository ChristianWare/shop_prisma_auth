// app/api/reviews/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth"; // Import from your src/auth.ts

const prisma = new PrismaClient();

/**
 * PATCH /api/reviews/[id]
 *
 * Admin only:
 *  - Approve or deny a review (set `approved` = true/false)
 *  - Optionally set `adminResponse`
 *
 * Body example: { approved: true, adminResponse: "Thanks for your feedback!" }
 */
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // 1) Verify user session via Auth.js v5
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Not logged in" }, { status: 401 });
    }

    // 2) Check admin role
    // For example, we treat "admin@example.com" as an admin
    // or you might store a `role` in your DB and check that
    const isAdmin = session.user.email === "admin@example.com";
    if (!isAdmin) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    // 3) Parse route params: the reviewId from [...nextauth]/route
    const reviewId = context.params.id; // or destructure directly

    // 4) Parse body
    const body = await request.json();
    const { approved, adminResponse } = body as {
      approved?: boolean;
      adminResponse?: string;
    };

    // 5) Update the review
    // If `approved` is undefined, we don't overwrite that field;
    // same for `adminResponse`
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        approved: approved ?? undefined,
        adminResponse: adminResponse ?? undefined,
      },
    });

    return NextResponse.json({ review: updatedReview }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/reviews/[id] error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
