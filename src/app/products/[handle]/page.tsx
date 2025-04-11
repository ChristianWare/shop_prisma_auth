/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
// app/products/[handle]/page.tsx
import { createStorefrontClient } from "@/lib/shopify";
import AddToCartButton from "@/components/AddToCartButton/AddToCartButton";

// Next.js automatically provides the route param as `params.handle`
// because this file is `[handle]/page.tsx`.
export default async function ProductDetailPage({
  params,
}: {
  params: { handle: string };
}) {
  // Fetch the product from Shopify using the handle
  const product = await getProductByHandle(params.handle);

  // If no product found, show a simple 404-style message
  if (!product) {
    return (
      <main className='max-w-xl mx-auto p-4'>
        <h1 className='text-2xl font-bold'>Product not found</h1>
        <p>
          We couldn’t find a product with the handle &ldquo;{params.handle}
          &rdquo;.
        </p>
      </main>
    );
  }

  const { id, title, descriptionHtml, images, variants } = product;

  return (
    <main className='max-w-6xl mx-auto p-4'>
      <h1 className='text-3xl font-bold mb-4'>{title}</h1>

      {/* Images */}
      {images.length > 0 ? (
        <div className='flex gap-4 overflow-x-auto mb-6'>
          {images.map((img: any, index: number) => (
            <img
              key={index}
              src={img.url}
              alt={img.altText || title}
              className='w-64 h-64 object-cover border rounded'
            />
          ))}
        </div>
      ) : (
        <p className='mb-4'>No product images available.</p>
      )}

      {/* Description (HTML from Shopify) */}
      {descriptionHtml ? (
        <div
          className='prose mb-6'
          dangerouslySetInnerHTML={{ __html: descriptionHtml }}
        />
      ) : (
        <p className='mb-6'>No description available.</p>
      )}

      {/* Variants */}
      {variants.length > 0 ? (
        <div className='mb-6'>
          <h2 className='text-xl font-semibold mb-2'>Available Variants:</h2>
          <ul className='space-y-2'>
            {variants.map((variant: any) => (
              <li key={variant.id}>
                <strong>{variant.title}</strong> –{" "}
                {`${variant.price.amount} ${variant.price.currencyCode}`}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className='mb-6'>No variants found.</p>
      )}

      <AddToCartButton productId={id} />
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

    // Convert images, variants from "edges" to arrays
    const images =
      productNode.images?.edges?.map((edge: any) => ({
        url: edge.node.url,
        altText: edge.node.altText,
      })) ?? [];

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
