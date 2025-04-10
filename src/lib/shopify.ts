/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/shopify.ts

// For Storefront API access
export function createStorefrontClient() {
  const storefrontAccessToken = process.env.SHOPIFY_STOREFRONT_API_TOKEN!;
  const domain = process.env.SHOPIFY_STORE_DOMAIN!;
  const apiVersion = "2024-01"; // Using a specific version that should be supported

  return {
    query: async (query: string, variables = {}) => {
      try {
        console.log(
          "Requesting from:",
          `https://${domain}/api/${apiVersion}/graphql.json`
        );
        console.log(
          "Using token:",
          storefrontAccessToken.substring(0, 5) + "..."
        );

        const response = await fetch(
          `https://${domain}/api/${apiVersion}/graphql.json`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Shopify-Storefront-Private-Token": storefrontAccessToken,
            },
            body: JSON.stringify({ query, variables }),
          }
        );

        if (!response.ok) {
          const text = await response.text();
          throw new Error(
            `Shopify Storefront API error (${response.status}): ${text}`
          );
        }

        return await response.json();
      } catch (error) {
        console.error("Shopify Storefront API error:", error);
        throw error;
      }
    },
  };
}

// For Customer Account API access
export function createCustomerClient() {
  const customerAccessToken = process.env.SHOPIFY_CUSTOMER_ACCOUNT_API_TOKEN!;
  const domain = process.env.SHOPIFY_STORE_DOMAIN!;
  const apiVersion = "2024-01"; // Using a specific version that should be supported

  return {
    query: async (query: string, variables = {}) => {
      try {
        const response = await fetch(
          `https://${domain}/api/${apiVersion}/graphql.json`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Customer-Account-Api-Token": customerAccessToken,
            },
            body: JSON.stringify({ query, variables }),
          }
        );

        if (!response.ok) {
          const text = await response.text();
          throw new Error(
            `Shopify Customer API error (${response.status}): ${text}`
          );
        }

        return await response.json();
      } catch (error) {
        console.error("Shopify Customer API error:", error);
        throw error;
      }
    },
  };
}

// For Admin API access (basic REST implementation)
export async function shopifyAdminRequest(
  endpoint: string,
  method = "GET",
  data?: any
) {
  const adminToken = process.env.SHOPIFY_ADMIN_API_TOKEN!;
  const domain = process.env.SHOPIFY_STORE_DOMAIN!;
  const apiVersion = "2024-01"; // Using a specific version that should be supported

  const url = `https://${domain}/admin/api/${apiVersion}/${endpoint}`;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": adminToken,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Shopify Admin API error (${response.status}): ${text}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Shopify Admin API error:", error);
    throw error;
  }
}
