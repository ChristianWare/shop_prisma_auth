import { createStorefrontClient } from "./shopify";

/**
 * CREATE a new cart in Shopify.
 * Accepts an array of line items (variantId + quantity).
 * Returns the new cart object.
 */
export async function createCart(
  lines?: { merchandiseId: string; quantity: number }[]
) {
  const client = createStorefrontClient();
  const mutation = `
    mutation CreateCart($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
          lines(first: 25) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    product {
                      title
                      handle
                      images(first:1) {
                        edges {
                          node {
                            url
                          }
                        }
                      }
                    }
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
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      lines: lines?.map((line) => ({
        merchandiseId: line.merchandiseId,
        quantity: line.quantity,
      })),
    },
  };

  const response = await client.query(mutation, variables);
  return response?.data?.cartCreate?.cart || null;
}

/**
 * FETCH an existing cart by its ID
 */
export async function getCart(cartId: string) {
  const client = createStorefrontClient();
  const query = `
    query GetCart($cartId: ID!) {
      cart(id: $cartId) {
        id
        checkoutUrl
        lines(first: 25) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  product {
                    title
                    handle
                    images(first:1) {
                      edges {
                        node {
                          url
                        }
                      }
                    }
                  }
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
  `;

  const variables = { cartId };
  const response = await client.query(query, variables);
  return response?.data?.cart || null;
}

/**
 * ADD or UPDATE lines in an existing cart
 * e.g. add a new variant or update quantity of existing.
 */
export async function addToCart(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[]
) {
  const client = createStorefrontClient();
  const mutation = `
    mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          id
          checkoutUrl
          lines(first: 25) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    product {
                      title
                      handle
                      images(first:1) {
                        edges {
                          node {
                            url
                          }
                        }
                      }
                    }
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
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    cartId,
    lines: lines.map((line) => ({
      merchandiseId: line.merchandiseId,
      quantity: line.quantity,
    })),
  };

  const response = await client.query(mutation, variables);
  return response?.data?.cartLinesAdd?.cart || null;
}

/**
 * REMOVE lines from the cart by line ID (not variant ID).
 */
export async function removeLine(cartId: string, lineIds: string[]) {
  const client = createStorefrontClient();
  const mutation = `
    mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart {
          id
          checkoutUrl
          lines(first: 25) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    product {
                      title
                      handle
                      images(first:1) {
                        edges {
                          node {
                            url
                          }
                        }
                      }
                    }
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
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = { cartId, lineIds };
  const response = await client.query(mutation, variables);
  return response?.data?.cartLinesRemove?.cart || null;
}

/**
 * UPDATE lines (e.g., change quantity).
 */
export async function updateLine(
  cartId: string,
  lines: { id: string; quantity: number }[]
) {
  const client = createStorefrontClient();
  const mutation = `
    mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart {
          id
          checkoutUrl
          lines(first: 25) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    product {
                      title
                      handle
                      images(first:1) {
                        edges {
                          node {
                            url
                          }
                        }
                      }
                    }
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
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    cartId,
    lines,
  };

  const response = await client.query(mutation, variables);
  return response?.data?.cartLinesUpdate?.cart || null;
}
