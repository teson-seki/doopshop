import {json, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {CATALOG_QUERY} from '~/graphql/queries';
import type {ProductItemFragment} from '~/lib/fragments';

export const meta = () => {
  return [{title: 'All Products | Hydrogen Demo Store'}];
};

export async function loader({context, request}: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams;
  const cursor = searchParams.get('cursor');
  const direction = searchParams.get('direction');

  const {products} = await context.storefront.query(CATALOG_QUERY, {
    variables: {
      first: direction === 'previous' ? null : 4,
      last: direction === 'previous' ? 4 : null,
      startCursor: direction === 'previous' ? cursor : null,
      endCursor: direction === 'previous' ? null : cursor,
    },
  });

  return json({products});
}

export default function Collection() {
  const {products} = useLoaderData<typeof loader>();

  return (
    <div className="products">
      <h1>All Products</h1>
      <PaginatedResourceSection<ProductItemFragment>
        connection={products}
        resourcesClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {({node: product}) => (
          <div key={product.id} className="product-item">
            <h2>{product.title}</h2>
            {product.featuredImage && (
              <img
                src={product.featuredImage.url}
                alt={product.featuredImage.altText || product.title}
                width={200}
                height={200}
              />
            )}
            <p>
              {product.priceRange.minVariantPrice.amount}{' '}
              {product.priceRange.minVariantPrice.currencyCode}
            </p>
          </div>
        )}
      </PaginatedResourceSection>
    </div>
  );
}