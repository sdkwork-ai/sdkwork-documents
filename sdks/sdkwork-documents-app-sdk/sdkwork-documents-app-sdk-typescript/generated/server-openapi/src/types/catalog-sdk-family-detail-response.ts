import type { CatalogSdkFamilyDetail } from './catalog-sdk-family-detail';

export interface CatalogSdkFamilyDetailResponse {
  code: 0;
  data: unknown & CatalogSdkFamilyDetail;
  /** Server-owned request correlation id. */
  traceId: string;
}
