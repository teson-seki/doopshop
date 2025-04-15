export const config = {
  runtime: 'edge'
};

import {createRequestHandler} from '@remix-run/server-runtime';
import {createStorefrontClient} from '@shopify/hydrogen';
import {
  cartGetIdDefault,
  cartSetIdDefault,
  createCartHandler,
  createStorefrontClient as createStorefrontClientDefault,
  storefrontRedirect as storefrontRedirectDefault,
} from '@shopify/hydrogen/api';

const handleRequest = createRequestHandler({
  build: () => import('../dist/server/index.js'),
});

export default async function handler(request) {
  try {
    const hydrogenResponse = await handleRequest(request);
    return new Response(await hydrogenResponse.text(), {
      status: hydrogenResponse.status,
      headers: hydrogenResponse.headers
    });
  } catch (error) {
    console.error(error);
    return new Response('Internal Server Error', {
      status: 500
    });
  }
} 