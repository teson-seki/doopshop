import {json, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, Link, type MetaFunction} from '@remix-run/react';
import {Pagination, getPaginationVariables} from '@shopify/hydrogen';
import {PRODUCT_ITEM_FRAGMENT, type ProductItemFragment} from '~/lib/fragments';
import {ProductItem} from '~/components/ProductItem';
import {COLLECTION_QUERY} from '~/graphql/queries';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';

export const meta: MetaFunction<typeof loader> = () => {
  return [{title: `Hydrogen | Products`}];
};

type LoaderData = {
  products: {
    nodes: ProductItemFragment[];
    pageInfo: {
      hasPreviousPage: boolean;
      hasNextPage: boolean;
      startCursor: string | null;
      endCursor: string | null;
    };
  };
};

export async function loader(args: LoaderFunctionArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, request}: LoaderFunctionArgs): Promise<LoaderData> {
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  const {collection} = await storefront.query(COLLECTION_QUERY, {
    variables: {...paginationVariables, handle: "all"},
  });

  if (!collection) {
    throw new Response('Collection not found', {
      status: 404,
    });
  }

  return {
    products: {
      nodes: collection.products.nodes as ProductItemFragment[],
      pageInfo: {
        hasPreviousPage: collection.products.pageInfo.hasPreviousPage,
        hasNextPage: collection.products.pageInfo.hasNextPage,
        startCursor: collection.products.pageInfo.startCursor || null,
        endCursor: collection.products.pageInfo.endCursor || null,
      },
    },
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: LoaderFunctionArgs) {
  return {};
}

export default function Collection() {
  const {products} = useLoaderData<LoaderData>();

  return (
    <div className="collection">
      <h1>Products</h1>
      <PaginatedResourceSection
        connection={products}
        resourcesClassName="products-grid"
      >
        {({node: product, index}) => (
          <ProductItem
            key={product.id}
            product={product}
          />
        )}
      </PaginatedResourceSection>
    </div>
  );
}