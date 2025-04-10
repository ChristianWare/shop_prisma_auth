/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createStorefrontClient } from "@/lib/shopify";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    // Verify token exists and has not expired
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken || new Date() > verificationToken.expires) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Find the user with the email from the token
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // If user has a Shopify customer ID, update their password there too
    if (user.shopifyCustomerId) {
      try {
        const client = createStorefrontClient();
        const customerId = user.shopifyCustomerId;

        // First, get a customer access token
        const tokenQuery = `
          mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
            customerAccessTokenCreate(input: $input) {
              customerAccessToken {
                accessToken
              }
              customerUserErrors {
                field
                message
                code
              }
            }
          }
        `;

        const tokenVariables = {
          input: {
            email: user.email,
            password: password, // We need to use the old password
          },
        };

        // This may fail if the old password doesn't work, but we'll still continue
        const tokenResponse = await client.query(tokenQuery, tokenVariables);

        if (
          tokenResponse.data?.customerAccessTokenCreate?.customerAccessToken
            ?.accessToken
        ) {
          const accessToken =
            tokenResponse.data.customerAccessTokenCreate.customerAccessToken
              .accessToken;

          // Now update the customer's password
          const updateQuery = `
            mutation customerUpdate($customerAccessToken: String!, $customer: CustomerUpdateInput!) {
              customerUpdate(customerAccessToken: $customerAccessToken, customer: $customer) {
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

          const updateVariables = {
            customerAccessToken: accessToken,
            customer: {
              password: password,
            },
          };

          await client.query(updateQuery, updateVariables);
        }
      } catch (shopifyError) {
        console.error(
          "Error updating Shopify customer password:",
          shopifyError
        );
        // Continue anyway as the local password was updated
      }
    }

    // Delete all verification tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { identifier: user.email! },
    });

    return NextResponse.json(
      { message: "Password reset successful" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { message: "Error resetting password" },
      { status: 500 }
    );
  }
}
