import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { createStorefrontClient } from "@/lib/shopify";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in database first (without Shopify ID)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Create Shopify customer using Storefront API
    try {
      const client = createStorefrontClient();
      const query = `
        mutation customerCreate($input: CustomerCreateInput!) {
          customerCreate(input: $input) {
            customer {
              id
            }
            customerUserErrors {
              field
              message
              code
            }
          }
        }
      `;

      const variables = {
        input: {
          firstName: name.split(" ")[0],
          lastName: name.split(" ").slice(1).join(" ") || "",
          email: email,
          password: password,
          acceptsMarketing: false,
        },
      };

      const response = await client.query(query, variables);

      if (response.data.customerCreate.customerUserErrors.length > 0) {
        console.error(
          "Shopify customer creation errors:",
          response.data.customerCreate.customerUserErrors
        );
      } else if (response.data.customerCreate.customer?.id) {
        // Update user with Shopify customer ID
        await prisma.user.update({
          where: { id: user.id },
          data: { shopifyCustomerId: response.data.customerCreate.customer.id },
        });
      }
    } catch (shopifyError) {
      console.error("Error creating Shopify customer:", shopifyError);
      // We still return success as the local user was created
    }

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Error creating user" },
      { status: 500 }
    );
  }
}
