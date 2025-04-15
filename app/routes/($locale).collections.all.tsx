import {json, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, useSearchParams} from '@remix-run/react';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {CATALOG_QUERY} from '~/graphql/queries';
import type {ProductItemFragment} from '~/lib/fragments';
import {applyFilters, getFilterCounts} from '~/lib/filters';

export const meta = () => {
  return [{title: 'リユース商品一覧 | D00P SHOP'}];
};

export async function loader({context, request}: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams;
  const cursor = searchParams.get('cursor');
  const direction = searchParams.get('direction');

  const {products} = await context.storefront.query(CATALOG_QUERY, {
    variables: {
      first: direction === 'previous' ? null : 12,
      last: direction === 'previous' ? 12 : null,
      startCursor: direction === 'previous' ? cursor : null,
      endCursor: direction === 'previous' ? null : cursor,
    },
  });

  return json({products});
}

export default function Collection() {
  const {products} = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = Array.from(searchParams.entries()).map(([key, value]) => ({
    key,
    value,
  }));

  const filteredProducts = applyFilters(products.nodes, filters);
  const conditionCounts = getFilterCounts(products.nodes, 'condition');
  const isUsedCounts = getFilterCounts(products.nodes, 'is_used');
  const hasAccessoriesCounts = getFilterCounts(products.nodes, 'has_accessories');
  const hasWarrantyCounts = getFilterCounts(products.nodes, 'has_warranty');

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
    <div className="products">
      <h1>リユース商品一覧</h1>
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
          ...products,
          nodes: filteredProducts,
        }}
        resourcesClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {({node: product}: {node: ProductItemFragment}) => (
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
            <div className="product-meta">
              {product.metafields?.map((metafield) => (
                <span key={`${metafield.key}-${metafield.value}`} className={`product-${metafield.key}`}>
                  {metafield.value}
                </span>
              ))}
            </div>
          </div>
        )}
      </PaginatedResourceSection>
    </div>
  );
}