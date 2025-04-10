// app/api/test-shopify/route.ts
import { NextResponse } from "next/server";
import {
  createStorefrontClient,
  createCustomerClient,
  shopifyAdminRequest,
} from "@/lib/shopify";

export async function GET() {
  const results = {
    storefront: { success: false, data: null, error: null as string | null },
    customer: { success: false, data: null, error: null as string | null },
    admin: { success: false, data: null, error: null as string | null },
  };

  // Test Storefront API
  try {
    console.log("Testing Storefront API connection...");
    const storefrontClient = createStorefrontClient();
    const query = `
      {
        shop {
          name
          primaryDomain {
            url
            host
          }
        }
      }
    `;

    const response = await storefrontClient.query(query);
    console.log("Storefront API Response:", JSON.stringify(response, null, 2));
    results.storefront = { success: true, data: response.data, error: null };
  } catch (error) {
    console.error("Storefront API Error:", error);
    results.storefront = {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // Test Customer Account API (if needed)
  try {
    console.log("Testing Customer Account API connection...");
    const customerClient = createCustomerClient();
    // Simple query to test connection - this one might not work without authentication
    const query = `
      {
        shop {
          name
        }
      }
    `;

    const response = await customerClient.query(query);
    console.log("Customer API Response:", JSON.stringify(response, null, 2));
    results.customer = { success: true, data: response.data, error: null };
  } catch (error) {
    console.error("Customer API Error:", error);
    results.customer = {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // Test Admin API
  try {
    console.log("Testing Admin API connection...");
    const adminResponse = await shopifyAdminRequest("shop.json");
    console.log("Admin API Response:", JSON.stringify(adminResponse, null, 2));
    results.admin = { success: true, data: adminResponse, error: null };
  } catch (error) {
    console.error("Admin API Error:", error);
    results.admin = {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  return NextResponse.json({
    success:
      results.storefront.success ||
      results.customer.success ||
      results.admin.success,
    message: "API Test Results",
    results,
  });
}
