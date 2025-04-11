/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
// app/products/[handle]/page.tsx

import { createStorefrontClient } from "@/lib/shopify";
import { auth } from "@/auth"; // <--- Import your v5 Auth function here
import ReviewForm from "@/components/ReviewForm";
import ReviewsList from "@/components/ReviewsList";
import ProductVariantSelector from "@/components/ProductVariantSelector";
import { notFound } from "next/navigation";

export default async function ProductDetailPage({
  params,
}: {
  params: { handle: string };
}) {
  // 1) Fetch the product from Shopify
  const product = await getProductByHandle(params.handle);
  if (!product) {
    return notFound();
  }

  // 2) Fetch the user session from Auth.js v5
  //    This is a server-side check to see if user is logged in
  const session = await auth();

  // 3) Optionally fetch reviews
  const reviewsData = await fetch(
    `${process.env.NEXTAUTH_URL}/api/reviews?productId=${product.id}`,
    { cache: "no-store" }
  ).then((res) => res.json());

  const reviews = reviewsData.reviews || [];

  // Compute average rating
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
        reviews.length
      : 0;

  // 4) Return your HTML
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

      {/* Description (HTML from Shopify) */}
      {product.descriptionHtml ? (
        <div
          className='prose mb-6'
          dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
        />
      ) : (
        <p className='mb-6'>No description available.</p>
      )}

      {/* Variant selection + Add to Cart (client component) */}
      <ProductVariantSelector product={product} />

      {/* Reviews */}
      <p className='mt-4'>Average Rating: {averageRating.toFixed(1)} / 5</p>
      <ReviewsList reviews={reviews} />

      {/* Conditionally show review form if user is logged in */}
      {session?.user ? (
        <ReviewForm productId={product.id} />
      ) : (
        <h3 className='mt-4 text-sm text-red-600'>
          Please log in to leave a review.
        </h3>
      )}
    </main>
  );
}

/**
 * Fetch a single product by handle from Shopify Storefront API
 */
async function getProductByHandle(handle: string) {
  const client = createStorefrontClient();
  const query = `
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
  const variables = { handle };

  try {
    const response = await client.query(query, variables);
    const productNode = response?.data?.product;
    if (!productNode) return null;

    // Convert images from edges
    const images =
      productNode.images?.edges?.map((edge: any) => ({
        url: edge.node.url,
        altText: edge.node.altText,
      })) ?? [];

    // Convert variants from edges
    const variants =
      productNode.variants?.edges?.map((edge: any) => ({
        id: edge.node.id,
        title: edge.node.title,
        price: edge.node.price, // { amount, currencyCode }
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
    console.error("Error fetching product by handle:", error);
    return null;
  }
}
