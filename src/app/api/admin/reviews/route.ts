// app/api/admin/reviews/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth"; // Import from your src/auth.ts

const prisma = new PrismaClient();

/**
 * GET /api/admin/reviews
 *
 * Admin only:
 * - Fetch all reviews with optional approval filter
 * - Query parameter: ?approved=true/false (optional)
 */
export async function GET(request: NextRequest) {
  try {
    // 1) Verify user session via Auth.js v5
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Not logged in" }, { status: 401 });
    }

    // 2) Check admin role using role instead of email
    const isAdmin = session.user.role === "ADMIN";
    if (!isAdmin) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    // 3) Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const approvedParam = searchParams.get("approved");

    // Build the query filter
    const filter =
      approvedParam !== null ? { approved: approvedParam === "true" } : {};

    // 4) Fetch reviews with filter
    const reviews = await prisma.review.findMany({
      where: filter,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ reviews }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/reviews error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
