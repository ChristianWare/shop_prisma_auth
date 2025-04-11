import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { createStorefrontClient } from "@/lib/shopify";

const prisma = new PrismaClient();

// ---------------------------------------
// POST /api/auth/register
// ---------------------------------------
export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // 1) Check if user already exists locally
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      );
    }

    // 2) Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3) Create local user record
    //    (WITHOUT shopifyCustomerId for now)
    const localUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // 4) Create Shopify customer using the Storefront API
    let shopifyId = "";
    try {
      const client = createStorefrontClient();
      const mutation = `
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
          firstName: name.split(" ")[0] || name,
          lastName: name.split(" ").slice(1).join(" "),
          email: email,
          password: password,
          acceptsMarketing: false,
        },
      };

      const shopifyResponse = await client.query(mutation, variables);
      const errors = shopifyResponse?.data?.customerCreate?.customerUserErrors;

      if (errors?.length) {
        // If Shopify returned an error, log it + handle rollback
        console.error("Shopify customer creation errors:", errors);

        // ROLLBACK local user if you prefer not to keep partial accounts
        await prisma.user.delete({
          where: { id: localUser.id },
        });

        return NextResponse.json(
          {
            message:
              "Failed to create Shopify customer. Please try again later.",
          },
          { status: 500 }
        );
      }

      shopifyId = shopifyResponse?.data?.customerCreate?.customer?.id || "";
      if (shopifyId) {
        // 5) Update local user with the Shopify customer ID
        await prisma.user.update({
          where: { id: localUser.id },
          data: { shopifyCustomerId: shopifyId },
        });
      } else {
        // No explicit errors returned, but still no ID => rollback or handle as needed
        console.error("No Shopify customer ID returned, rolling back user.");

        await prisma.user.delete({
          where: { id: localUser.id },
        });

        return NextResponse.json(
          { message: "Shopify customer creation failed" },
          { status: 500 }
        );
      }
    } catch (shopifyError) {
      // If there's an exception calling Shopify
      console.error("Error creating Shopify customer:", shopifyError);

      // ROLLBACK local user if desired
      await prisma.user.delete({
        where: { id: localUser.id },
      });

      return NextResponse.json(
        { message: "Error creating Shopify customer" },
        { status: 500 }
      );
    }

    // 6) If we made it here, both local & Shopify creation succeeded
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
