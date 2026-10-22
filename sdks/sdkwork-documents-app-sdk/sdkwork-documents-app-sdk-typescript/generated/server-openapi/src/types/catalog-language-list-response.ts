import type { CatalogLanguageList } from './catalog-language-list';

export interface CatalogLanguageListResponse {
  code: 0;
  data: unknown & CatalogLanguageList;
  /** Server-owned request correlation id. */
  traceId: string;
}
