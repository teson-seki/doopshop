import {flatRoutes} from '@remix-run/fs-routes';
import {layout, type RouteConfig} from '@remix-run/route-config';
import {hydrogenRoutes} from '@shopify/hydrogen';

export default hydrogenRoutes([
  // Your entire app reading from routes folder using Layout from layout.tsx
  layout('./layout.tsx', (await flatRoutes())),
  // Manual route definitions can be added to this array, in addition to or instead of using the `flatRoutes` file-based routing convention.
  // See https://remix.run/docs/en/main/guides/routing for more details
]) satisfies RouteConfig;
