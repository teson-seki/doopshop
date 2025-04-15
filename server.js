import {createRequestHandler} from '@remix-run/server-runtime';
import {createStorefrontClient, storefrontRedirect} from '@shopify/hydrogen';
import {
  cartGetIdDefault,
  cartSetIdDefault,
  createCartHandler,
  createStorefrontClient as createStorefrontClientDefault,
  storefrontRedirect as storefrontRedirectDefault,
} from '@shopify/hydrogen/api';

const handleRequest = createRequestHandler({
  build: () => import('./build/index.js'),
});

export default async function handler(request, response) {
  try {
    const hydrogenResponse = await handleRequest(request);
    
    for (const [key, value] of hydrogenResponse.headers.entries()) {
      response.setHeader(key, value);
    }
    
    response.status(hydrogenResponse.status);
    response.send(await hydrogenResponse.text());
  } catch (error) {
    console.error(error);
    response.status(500).send('Internal Server Error');
  }
} 