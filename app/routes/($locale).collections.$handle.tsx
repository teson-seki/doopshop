import {redirect, type LoaderFunctionArgs, json} from '@shopify/remix-oxygen';
import {useLoaderData, Link, type MetaFunction, useSearchParams, useParams} from '@remix-run/react';
import {
  getPaginationVariables,
  Image,
  Money,
  Analytics,
  getSelectedProductOptions,
  flattenConnection,
} from '@shopify/hydrogen';
import type {MoneyV2, CurrencyCode} from '@shopify/hydrogen/storefront-api-types';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {applyFilters, getFilterValues, getFilterCounts, type Filter} from '~/lib/filters';
import type {ProductItemFragment} from '~/lib/fragments';
import {PRODUCT_ITEM_FRAGMENT} from '~/lib/fragments';
import {useVariantUrl} from '~/lib/variants';

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
          ...ProductItemFragment
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

type PaginatedProductNode = {
  node: ProductItemFragment;
  index: number;
};

export default function Collection() {
  const {collection} = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const products = collection.products.nodes;
  const filters: Filter[] = Array.from(searchParams.entries()).map(([key, value]) => ({
    key,
    value,
  }));

  const filteredProducts = applyFilters(products, filters);
  const conditionCounts = getFilterCounts(products, 'condition');
  const isUsedCounts = getFilterCounts(products, 'is_used');
  const hasAccessoriesCounts = getFilterCounts(products, 'has_accessories');
  const hasWarrantyCounts = getFilterCounts(products, 'has_warranty');

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
      <p className="collection-description">{collection.description}</p>
      <div className="filters">
        <h2>フィルター</h2>
        <div className="filter-group">
          <h3>商品種別</h3>
          <label>
            <input
              type="checkbox"
              name="is_used"
              value="true"
              checked={searchParams.has('is_used', 'true')}
              onChange={() => handleFilterChange('is_used', 'true')}
            />
            リユース品 ({isUsedCounts['true'] || 0})
          </label>
          <label>
            <input
              type="checkbox"
              name="is_used"
              value="false"
              checked={searchParams.has('is_used', 'false')}
              onChange={() => handleFilterChange('is_used', 'false')}
            />
            新品 ({isUsedCounts['false'] || 0})
          </label>
        </div>
        <div className="filter-group">
          <h3>状態</h3>
          <label>
            <input
              type="checkbox"
              name="condition"
              value="new"
              checked={searchParams.has('condition', 'new')}
              onChange={() => handleFilterChange('condition', 'new')}
            />
            新品同様 ({conditionCounts['new'] || 0})
          </label>
          <label>
            <input
              type="checkbox"
              name="condition"
              value="good"
              checked={searchParams.has('condition', 'good')}
              onChange={() => handleFilterChange('condition', 'good')}
            />
            良好 ({conditionCounts['good'] || 0})
          </label>
          <label>
            <input
              type="checkbox"
              name="condition"
              value="fair"
              checked={searchParams.has('condition', 'fair')}
              onChange={() => handleFilterChange('condition', 'fair')}
            />
            可 ({conditionCounts['fair'] || 0})
          </label>
        </div>
        <div className="filter-group">
          <h3>付属品</h3>
          <label>
            <input
              type="checkbox"
              name="has_accessories"
              value="true"
              checked={searchParams.has('has_accessories', 'true')}
              onChange={() => handleFilterChange('has_accessories', 'true')}
            />
            あり ({hasAccessoriesCounts['true'] || 0})
          </label>
          <label>
            <input
              type="checkbox"
              name="has_accessories"
              value="false"
              checked={searchParams.has('has_accessories', 'false')}
              onChange={() => handleFilterChange('has_accessories', 'false')}
            />
            なし ({hasAccessoriesCounts['false'] || 0})
          </label>
        </div>
        <div className="filter-group">
          <h3>保証書</h3>
          <label>
            <input
              type="checkbox"
              name="has_warranty"
              value="true"
              checked={searchParams.has('has_warranty', 'true')}
              onChange={() => handleFilterChange('has_warranty', 'true')}
            />
            あり ({hasWarrantyCounts['true'] || 0})
          </label>
          <label>
            <input
              type="checkbox"
              name="has_warranty"
              value="false"
              checked={searchParams.has('has_warranty', 'false')}
              onChange={() => handleFilterChange('has_warranty', 'false')}
            />
            なし ({hasWarrantyCounts['false'] || 0})
          </label>
        </div>
      </div>
      <PaginatedResourceSection
        connection={{
          ...collection.products,
          nodes: filteredProducts,
        }}
        resourcesClassName="products-grid"
      >
        {({node: product, index}: PaginatedProductNode) => (
          <ProductItem
            key={product.id}
            product={product}
            loading={index < 8 ? 'eager' : undefined}
          />
        )}
      </PaginatedResourceSection>
      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />
    </div>
  );
}

function ProductItem({
  product,
  loading,
}: {
  product: ProductItemFragment;
  loading?: 'eager' | 'lazy';
}) {
  const variantUrl = useVariantUrl(product.handle);
  const getMetafieldValue = (key: string) => {
    const metafield = product.metafields?.find((m) => m.key === key);
    return metafield?.value;
  };

  return (
    <Link
      className="product-item"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
    >
      {product.featuredImage && (
        <Image
          alt={product.featuredImage.altText || product.title}
          aspectRatio="1/1"
          data={product.featuredImage}
          loading={loading}
          sizes="(min-width: 45em) 400px, 100vw"
        />
      )}
      <h4>{product.title}</h4>
      <small>
        <Money
          as="span"
          data={{
            amount: product.priceRange.minVariantPrice.amount,
            currencyCode: product.priceRange.minVariantPrice.currencyCode as CurrencyCode,
          }}
        />
      </small>
      <div className="product-meta">
        <span className="product-condition">
          {getMetafieldValue('condition')}
        </span>
        {getMetafieldValue('has_warranty') === 'true' && (
          <span className="product-warranty">保証付き</span>
        )}
      </div>
    </Link>
  );
}
