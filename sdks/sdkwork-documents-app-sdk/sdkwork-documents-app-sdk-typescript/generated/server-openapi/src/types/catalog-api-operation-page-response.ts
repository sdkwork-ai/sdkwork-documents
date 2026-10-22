import type { CatalogApiOperationPage } from './catalog-api-operation-page';

export interface CatalogApiOperationPageResponse {
  code: 0;
  data: unknown & CatalogApiOperationPage;
  /** Server-owned request correlation id. */
  traceId: string;
}
