import type { DocumentTagList } from './document-tag-list';

export interface DocumentTagListResponse {
  code: 0;
  data: unknown & DocumentTagList;
  /** Server-owned request correlation id. */
  traceId: string;
}
