import type { CatalogApiSurfacePage } from './catalog-api-surface-page';

export interface CatalogApiSurfacePageResponse {
  code: 0;
  data: unknown & CatalogApiSurfacePage;
  /** Server-owned request correlation id. */
  traceId: string;
}
