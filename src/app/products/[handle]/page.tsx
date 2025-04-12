/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
// app/products/[handle]/page.tsx

import { createStorefrontClient } from "@/lib/shopify";
import { auth } from "@/auth";
import ReviewsList from "@/components/ReviewsList";
import ReviewForm from "@/components/ReviewForm";
import ProductVariantSelector from "@/components/ProductVariantSelector";
import { notFound } from "next/navigation";

// If you're using the same "shopifyAdminRequest" method from your route code,
// you can define it here or import from a shared lib:
async function shopifyAdminRequest(
  endpoint: string,
  method = "GET",
  data?: any
) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const adminToken = process.env.SHOPIFY_ADMIN_API_TOKEN;
  const apiVersion = "2023-04";
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

async function userPurchasedProductShopify(
  shopifyCustomerId: string,
  productId: string
) {
  try {
    // Convert "gid://shopify/Customer/123456" to numeric
    const numericId = shopifyCustomerId.split("/").pop();
    // fetch first 50 orders for that customer
    const limit = 50;
    const url = `orders.json?customer_id=${numericId}&limit=${limit}`;
    const adminResponse = await shopifyAdminRequest(url);
    if (!adminResponse?.orders) return false;

    const orders = adminResponse.orders as any[];
    for (const order of orders) {
      if (!order.line_items) continue;
      for (const line of order.line_items) {
        // line.product_id is typically numeric
        // if your productId is "gid://shopify/Product/12345"
        // match by constructing that GID from line.product_id
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

export default async function ProductDetailPage({
  params,
}: {
  params: { handle: string };
}) {
  // 1) Fetch product from Shopify
  const product = await getProductByHandle(params.handle);
  if (!product) {
    return notFound();
  }

  // 2) Get user session (logged in or not)
  const session = await auth();

  // 3) Fetch existing reviews (approved) for display
  const reviewsData = await fetch(
    `${process.env.NEXTAUTH_URL}/api/reviews?productId=${product.id}`,
    { cache: "no-store" }
  ).then((res) => res.json());
  const reviews = reviewsData.reviews || [];

  // 4) Compute average rating
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
        reviews.length
      : 0;

  // 5) Decide if we show the <ReviewForm> or not
  //    Conditions: user logged in, user purchased product, user has not already reviewed
  let canShowReviewForm = false;
  let reasonMessage = ""; // can be displayed if you want

  if (session?.user) {
    // A) Check if user already has a review for this product
    const prisma = (await import("@prisma/client")).PrismaClient;
    const db = new prisma();
    const existingReview = await db.review.findFirst({
      where: {
        userId: session.user.id,
        productId: product.id,
      },
    });
    if (existingReview) {
      reasonMessage = "You have already submitted a review for this product.";
    } else {
      // B) Check if user purchased (Shopify Admin approach)
      const userRecord = await db.user.findUnique({
        where: { id: session.user.id },
      });
      if (!userRecord?.shopifyCustomerId) {
        reasonMessage = "No Shopify customer ID found, cannot verify purchase.";
      } else {
        const purchased = await userPurchasedProductShopify(
          userRecord.shopifyCustomerId,
          product.id
        );
        if (!purchased) {
          reasonMessage = "Purchase product to leave a review.";
        } else {
          // All conditions met
          canShowReviewForm = true;
        }
      }
    }
    db.$disconnect();
  } else {
    reasonMessage = "Please log in to leave a review.";
  }

  // 6) Render
  return (
    <main className='max-w-6xl mx-auto p-4'>
      <h1 className='text-3xl font-bold mb-4'>{product.title}</h1>

      {/* Images */}
      {product.images.length > 0 ? (
        <div className='flex gap-4 overflow-x-auto mb-6'>
          {product.images.map((img: any, index: number) => (
            <img
              key={index}
              src={img.url}
              alt={img.altText || product.title}
              className='w-64 h-64 object-cover border rounded'
            />
          ))}
        </div>
      ) : (
        <p className='mb-4'>No product images available.</p>
      )}

      {/* Description */}
      {product.descriptionHtml ? (
        <div
          className='prose mb-6'
          dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
        />
      ) : (
        <p className='mb-6'>No description available.</p>
      )}

      {/* Variant + Add to Cart */}
      <ProductVariantSelector product={product} />

      {/* Reviews */}
      <p className='mt-4'>Average Rating: {averageRating.toFixed(1)} / 5</p>
      <ReviewsList reviews={reviews} />

      {/* Show the form only if canShowReviewForm is true */}
      {canShowReviewForm ? (
        <ReviewForm productId={product.id} />
      ) : (
        // Otherwise, display a message (why the user can't review)
        <h3 className='mt-4 text-sm text-red-600'>{reasonMessage}</h3>
      )}
    </main>
  );
}

/**
 * Server-side function that fetches product data from Shopify
 */
async function getProductByHandle(handle: string) {
  const { query } = createStorefrontClient();
  const variables = { handle };
  const productQuery = `
    query productByHandle($handle: String!) {
      product(handle: $handle) {
        id
        title
        descriptionHtml
        images(first: 5) {
          edges {
            node {
              url
              altText
            }
          }
        }
        variants(first: 10) {
          edges {
            node {
              id
              title
              price {
                amount
                currencyCode
              }
              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
    }
  `;

  try {
    const res = await query(productQuery, variables);
    const productNode = res?.data?.product;
    if (!productNode) return null;

    const images =
      productNode.images?.edges?.map((edge: any) => ({
        url: edge.node.url,
        altText: edge.node.altText,
      })) ?? [];

    const variants =
      productNode.variants?.edges?.map((edge: any) => ({
        id: edge.node.id,
        title: edge.node.title,
        price: edge.node.price,
        selectedOptions: edge.node.selectedOptions,
      })) ?? [];

    return {
      id: productNode.id,
      title: productNode.title,
      descriptionHtml: productNode.descriptionHtml || "",
      images,
      variants,
    };
  } catch (error) {
    console.error("Error in getProductByHandle:", error);
    return null;
  }
}
