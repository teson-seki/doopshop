import type {Product} from '@shopify/hydrogen/storefront-api-types';

export type Filter = {
  key: string;
  value: string;
};

export function applyFilters(products: Product[], filters: Filter[]) {
  return products.filter((product) => {
    return filters.every((filter) => {
      const metafield = product.metafields?.find((m) => m.key === filter.key);
      return metafield?.value === filter.value;
    });
  });
}

export function getFilterValues(products: Product[], key: string) {
  const values = new Set<string>();
  products.forEach((product) => {
    const metafield = product.metafields?.find((m) => m.key === key);
    if (metafield?.value) {
      values.add(metafield.value);
    }
  });
  return Array.from(values);
}

export function getFilterCounts(products: Product[], key: string) {
  const counts: Record<string, number> = {};
  products.forEach((product) => {
    const metafield = product.metafields?.find((m) => m.key === key);
    if (metafield?.value) {
      counts[metafield.value] = (counts[metafield.value] || 0) + 1;
    }
  });
  return counts;
} 