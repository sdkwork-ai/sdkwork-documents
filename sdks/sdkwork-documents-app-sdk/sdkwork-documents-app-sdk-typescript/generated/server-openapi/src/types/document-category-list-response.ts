import type { DocumentCategoryList } from './document-category-list';

export interface DocumentCategoryListResponse {
  code: 0;
  data: unknown & DocumentCategoryList;
  /** Server-owned request correlation id. */
  traceId: string;
}
