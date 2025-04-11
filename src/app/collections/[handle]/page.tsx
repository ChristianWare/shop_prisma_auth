/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
// app/collections/[handle]/page.tsx
import { createStorefrontClient } from "@/lib/shopify";
import Link from "next/link";

// Because this is in the `app/collections/[handle]/page.tsx`,
// Next.js will parse the route param as `params.handle`.
export default async function CollectionPage({
  params,
}: {
  params: { handle: string };
}) {
  // 1. Fetch collection data
  const collectionData = await getCollectionByHandle(params.handle);

  if (!collectionData) {
    // If no collection is found, you could throw a 404 or show a message
    return <h1 className='text-center mt-16'>Collection not found.</h1>;
  }

  const { title, products } = collectionData;

  return (
    <main className='max-w-6xl mx-auto py-8 px-4'>
      <h1 className='text-3xl font-bold mb-6'>{title}</h1>

      {products.length === 0 ? (
        <p>No products found in this collection.</p>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6'>
          {products.map((product: any) => (
            <div key={product.id} className='border p-4 rounded shadow-sm'>
              {product.images?.[0] && (
                <img
                  src={product.images[0].url}
                  alt={product.images[0].altText || product.title}
                  className='mb-4 w-full h-48 object-cover'
                />
              )}

              <h2 className='text-lg font-semibold'>{product.title}</h2>
              {/* Show variants with price info, etc. */}
              {product.variants?.map((variant: any) => (
                <p key={variant.id} className='text-sm text-gray-600'>
                  {variant.title} -{" "}
                  {`${variant.price.amount} ${variant.price.currencyCode}`}
                </p>
              ))}

              <Link
                href={`/products/${product.handle}`}
                className='block mt-4 text-blue-600 hover:underline'
              >
                View Product
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

// -----------------------------------------
// Helper to fetch a collection by handle
// -----------------------------------------
async function getCollectionByHandle(handle: string) {
  const client = createStorefrontClient();
  const query = `
    query collectionByHandle($handle: String!) {
      collection(handle: $handle) {
        id
        title
        products(first: 12) {
          edges {
            node {
              id
              title
              handle
              images(first: 1) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
              variants(first: 5) {
                edges {
                  node {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                  }
                }
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
    const collection = response?.data?.collection;

    if (!collection) {
      return null;
    }

    // Transform the product edges
    const products = collection.products.edges.map(({ node }: any) => {
      const variants = node.variants.edges.map(({ node: variant }: any) => ({
        id: variant.id,
        title: variant.title,
        price: variant.price,
      }));

      const images = node.images?.edges?.map((imgEdge: any) => ({
        url: imgEdge.node.url,
        altText: imgEdge.node.altText,
      }));

      return {
        id: node.id,
        title: node.title,
        handle: node.handle,
        variants,
        images: images ?? [],
      };
    });

    return {
      id: collection.id,
      title: collection.title,
      products,
    };
  } catch (error) {
    console.error("Error fetching collection by handle:", error);
    return null;
  }
}
