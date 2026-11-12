import type { DocumentCategory } from './document-category';

export interface DocumentCategoryResponse {
  code: 0;
  data: unknown & DocumentCategory;
  /** Server-owned request correlation id. */
  traceId: string;
}
