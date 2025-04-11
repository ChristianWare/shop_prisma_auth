import { NextRequest, NextResponse } from "next/server";
import {
  createCart,
  getCart,
  addToCart,
  removeLine,
  updateLine,
} from "@/lib/shopifyCart";

/**
 * Handle /api/cart
 *
 * Expects queries like:
 *   GET /api/cart?cartId=...
 *   POST /api/cart { cartId, lines, action: "create" | "add" }
 *   PATCH /api/cart { cartId, lineIds, action: "remove" | "update" }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cartId = searchParams.get("cartId");

    if (!cartId) {
      return NextResponse.json({ message: "Missing cartId" }, { status: 400 });
    }

    const cart = await getCart(cartId);
    if (!cart) {
      return NextResponse.json({ message: "Cart not found" }, { status: 404 });
    }
    return NextResponse.json({ cart }, { status: 200 });
  } catch (error) {
    console.error("GET /api/cart error:", error);
    return NextResponse.json(
      { message: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cartId, lines, action } = body;

    // If action is "create", we just create a brand new cart with optional lines
    if (action === "create") {
      const newCart = await createCart(lines);
      if (!newCart) {
        return NextResponse.json(
          { message: "Failed to create cart" },
          { status: 500 }
        );
      }
      return NextResponse.json({ cart: newCart }, { status: 201 });
    }

    // If we have a cartId and action is "add", we add lines
    if (action === "add") {
      if (!cartId || !lines) {
        return NextResponse.json(
          { message: "Missing cartId or lines" },
          { status: 400 }
        );
      }
      const updatedCart = await addToCart(cartId, lines);
      if (!updatedCart) {
        return NextResponse.json(
          { message: "Failed to add to cart" },
          { status: 500 }
        );
      }
      return NextResponse.json({ cart: updatedCart }, { status: 200 });
    }

    return NextResponse.json({ message: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/cart error:", error);
    return NextResponse.json(
      { message: "Failed to process cart" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { cartId, lineIds, lines, action } = body;

    if (!cartId) {
      return NextResponse.json({ message: "Missing cartId" }, { status: 400 });
    }

    if (action === "remove") {
      if (!lineIds || !Array.isArray(lineIds)) {
        return NextResponse.json(
          { message: "Missing lineIds array" },
          { status: 400 }
        );
      }
      const updatedCart = await removeLine(cartId, lineIds);
      if (!updatedCart) {
        return NextResponse.json(
          { message: "Failed to remove lines" },
          { status: 500 }
        );
      }
      return NextResponse.json({ cart: updatedCart }, { status: 200 });
    }

    if (action === "update") {
      // 'lines' should be an array of { id: string; quantity: number }
      if (!lines || !Array.isArray(lines)) {
        return NextResponse.json(
          { message: "Missing lines array" },
          { status: 400 }
        );
      }
      const updatedCart = await updateLine(cartId, lines);
      if (!updatedCart) {
        return NextResponse.json(
          { message: "Failed to update lines" },
          { status: 500 }
        );
      }
      return NextResponse.json({ cart: updatedCart }, { status: 200 });
    }

    return NextResponse.json(
      { message: "Unknown PATCH action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("PATCH /api/cart error:", error);
    return NextResponse.json(
      { message: "Failed to update cart" },
      { status: 500 }
    );
  }
}
