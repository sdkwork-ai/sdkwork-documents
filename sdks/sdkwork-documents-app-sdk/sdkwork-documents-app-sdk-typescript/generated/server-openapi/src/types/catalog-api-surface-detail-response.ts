import type { CatalogApiSurfaceDetail } from './catalog-api-surface-detail';

export interface CatalogApiSurfaceDetailResponse {
  code: 0;
  data: unknown & CatalogApiSurfaceDetail;
  /** Server-owned request correlation id. */
  traceId: string;
}
