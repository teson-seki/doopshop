import {redirect, type LoaderFunctionArgs, json} from '@shopify/remix-oxygen';
import {useLoaderData, Link, type MetaFunction, useSearchParams, useParams} from '@remix-run/react';
import {
  getPaginationVariables,
  getSelectedProductOptions,
  flattenConnection,
} from '@shopify/hydrogen';
import {ProductItem} from '~/components/ProductItem';
import {applyFilters, getFilterValues, getFilterCounts} from '~/lib/filters';
import type {ProductItemFragment} from '~/lib/fragments';
import {PRODUCT_ITEM_FRAGMENT} from '~/lib/fragments';

export const meta: MetaFunction<typeof loader> = ({data}) => {
  return [{title: `Hydrogen | ${data?.collection.title ?? ''} Collection`}];
};

const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
` as const;

export async function loader({request, params, context}: LoaderFunctionArgs) {
  const {handle} = params;
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  if (!handle) {
    return redirect('/collections');
  }

  const {collection} = await storefront.query(COLLECTION_QUERY, {
    variables: {...paginationVariables, handle},
  });

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }

  return json({
    collection,
    products: collection.products.nodes as ProductItemFragment[],
  });
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({
  context,
  params,
  request,
}: LoaderFunctionArgs) {
  const {handle} = params;
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  if (!handle) {
    throw redirect('/collections');
  }

  const [{collection}] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {handle, ...paginationVariables},
      // Add other queries here, so that they are loaded in parallel
    }),
  ]);

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }

  return {
    collection,
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

type LoaderData = {
  collection: {
    title: string;
    description: string | null;
    products: {
      nodes: ProductItemFragment[];
    };
  };
  products: ProductItemFragment[];
};

export default function Collection() {
  const {collection, products} = useLoaderData<LoaderData>();
  const [searchParams, setSearchParams] = useSearchParams();
  const {language} = useParams();

  const filters = Array.from(searchParams.entries()).map(([key, value]) => ({
    key,
    value,
  }));

  const filteredProducts = applyFilters(products, filters);

  const handleFilterChange = (key: string, value: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (newSearchParams.has(key, value)) {
      newSearchParams.delete(key, value);
    } else {
      newSearchParams.append(key, value);
    }
    setSearchParams(newSearchParams);
  };

  return (
    <div className="collection">
      <h1>{collection.title}</h1>
      {collection.description && (
        <div className="collection-description">
          <p>{collection.description}</p>
        </div>
      )}
      <div className="filters">
        <div className="filter-group">
          <h3>商品タイプ</h3>
          {getFilterValues(products, 'product_type').map((value) => (
            <label key={value} className="filter-option">
              <input
                type="checkbox"
                checked={searchParams.has('product_type', value)}
                onChange={() => handleFilterChange('product_type', value)}
              />
              {value} ({getFilterCounts(products, 'product_type')[value] || 0})
            </label>
          ))}
        </div>
        <div className="filter-group">
          <h3>状態</h3>
          {getFilterValues(products, 'condition').map((value) => (
            <label key={value} className="filter-option">
              <input
                type="checkbox"
                checked={searchParams.has('condition', value)}
                onChange={() => handleFilterChange('condition', value)}
              />
              {value} ({getFilterCounts(products, 'condition')[value] || 0})
            </label>
          ))}
        </div>
        <div className="filter-group">
          <h3>付属品</h3>
          {getFilterValues(products, 'accessories').map((value) => (
            <label key={value} className="filter-option">
              <input
                type="checkbox"
                checked={searchParams.has('accessories', value)}
                onChange={() => handleFilterChange('accessories', value)}
              />
              {value} ({getFilterCounts(products, 'accessories')[value] || 0})
            </label>
          ))}
        </div>
        <div className="filter-group">
          <h3>保証</h3>
          {getFilterValues(products, 'warranty').map((value) => (
            <label key={value} className="filter-option">
              <input
                type="checkbox"
                checked={searchParams.has('warranty', value)}
                onChange={() => handleFilterChange('warranty', value)}
              />
              {value} ({getFilterCounts(products, 'warranty')[value] || 0})
            </label>
          ))}
        </div>
      </div>
      <div className="products-grid">
        {filteredProducts.map((product) => (
          <ProductItem key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
