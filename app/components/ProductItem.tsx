import {Link} from '@remix-run/react';
import type {ProductItemFragment} from '~/lib/fragments';

type ProductItemProps = {
  product: ProductItemFragment;
};

export function ProductItem({product}: ProductItemProps) {
  const {priceRange, title, handle, featuredImage} = product;
  const {amount, currencyCode} = priceRange.minVariantPrice;

  return (
    <Link className="product-item" to={`/products/${handle}`}>
      {featuredImage && (
        <img
          alt={featuredImage.altText || title}
          src={featuredImage.url}
          width={featuredImage.width}
          height={featuredImage.height}
        />
      )}
      <h3>{title}</h3>
      <p>{amount} {currencyCode}</p>
    </Link>
  );
} 