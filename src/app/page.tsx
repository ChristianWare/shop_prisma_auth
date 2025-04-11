/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import { createStorefrontClient } from "@/lib/shopify";
import Link from "next/link";

export default async function HomePage() {
  const [mensCollection, allCollections] = await Promise.all([
    getCollectionByHandle("men"), // or whatever your handle is
    getAllCollections(),
  ]);


  return (
    <main className='max-w-6xl mx-auto py-8 px-4'>
      <h1 className='text-3xl font-bold mb-6'>Welcome to Our Store</h1>

      {/* Example: Display "Men's" Collection */}
      <section className='mb-12'>
        <h2 className='text-2xl font-semibold mb-4'>
          {mensCollection?.title || "Men's Collection"}
        </h2>
        {mensCollection?.products?.length ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6'>
            {mensCollection.products.map((product: any) => (
              <div key={product.id} className='border p-4 rounded shadow-sm'>
                {product.images?.[0] && (
                  <img
                    src={product.images[0].url}
                    alt={product.images[0].altText || product.title}
                    className='mb-4 w-full h-48 object-cover'
                  />
                )}

                <h3 className='text-lg font-semibold'>{product.title}</h3>
                <Link
                  href={`/products/${product.handle}`}
                  className='inline-block mt-2 text-blue-600 hover:underline'
                >
                  View Product
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p>No products found in the Men’s collection.</p>
        )}
      </section>

      {/* Example: Display All Collections as categories */}
      <section>
        <h2 className='text-2xl font-semibold mb-4'>All Categories</h2>
        {allCollections?.length ? (
          <ul className='list-disc list-inside'>
            {allCollections.map((collection: any) => (
              <li key={collection.id}>
                <Link
                  href={`/collections/${collection.handle}`}
                  className='text-blue-600 hover:underline'
                >
                  {collection.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>No collections found.</p>
        )}
      </section>
    </main>
  );
}

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
            }
          }
        }
      }
    }
  `;

  const variables = { handle };

  try {
    const response = await client.query(query, variables);
    const collectionData = response?.data?.collection;
    if (!collectionData) return null;

    const products = collectionData.products?.edges.map((edge: any) => ({
      id: edge.node.id,
      title: edge.node.title,
      handle: edge.node.handle,
      images: edge.node.images.edges.map((imgEdge: any) => ({
        url: imgEdge.node.url,
        altText: imgEdge.node.altText,
      })),
    }));

    return {
      id: collectionData.id,
      title: collectionData.title,
      products: products ?? [],
    };
  } catch (error) {
    console.error("Error fetching collection:", error);
    return null;
  }
}

// ----------------------------------------------------------------
// 2) Helper to fetch all collections
// ----------------------------------------------------------------
async function getAllCollections() {
  const client = createStorefrontClient();
  const query = `
    query allCollections {
      collections(first: 20) {
        edges {
          node {
            id
            title
            handle
          }
        }
      }
    }
  `;

  try {
    const response = await client.query(query);
    const collectionEdges = response?.data?.collections?.edges ?? [];
    return collectionEdges.map((edge: any) => ({
      id: edge.node.id,
      title: edge.node.title,
      handle: edge.node.handle,
    }));
  } catch (error) {
    console.error("Error fetching all collections:", error);
    return [];
  }
}