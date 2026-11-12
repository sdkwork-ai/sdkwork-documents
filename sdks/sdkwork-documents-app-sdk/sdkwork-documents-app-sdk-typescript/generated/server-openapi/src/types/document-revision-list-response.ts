import type { DocumentRevision } from './document-revision';

export interface DocumentRevisionListResponse {
  code: 0;
  data: unknown & { items: DocumentRevision[]; };
  /** Server-owned request correlation id. */
  traceId: string;
}
