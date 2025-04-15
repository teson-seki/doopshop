import type {Product} from '@shopify/hydrogen/storefront-api-types';
import type {ProductItemFragment} from '~/lib/fragments';

export type Filter = {
  key: string;
  value: string;
};

export function applyFilters(products: ProductItemFragment[], filters: Filter[]): ProductItemFragment[] {
  if (filters.length === 0) {
    return products;
  }

  return products.filter((product) => {
    return filters.every((filter) => {
      const metafield = product.metafields.find((m) => m.key === filter.key);
      return metafield?.value === filter.value;
    });
  });
}

export function getFilterValues(products: ProductItemFragment[], key: string): string[] {
  const values = new Set<string>();
  products.forEach((product) => {
    const metafield = product.metafields.find((m) => m.key === key);
    if (metafield?.value) {
      values.add(metafield.value);
    }
  });
  return Array.from(values);
}

export function getFilterCounts(products: ProductItemFragment[], key: string): Record<string, number> {
  const counts: Record<string, number> = {};
  products.forEach((product) => {
    const metafield = product.metafields.find((m) => m.key === key);
    if (metafield?.value) {
      counts[metafield.value] = (counts[metafield.value] || 0) + 1;
    }
  });
  return counts;
} 