import type { PublishedDocument } from './published-document';

export interface PublishedDocumentListResponse {
  code: 0;
  data: unknown & { items: PublishedDocument[]; };
  /** Server-owned request correlation id. */
  traceId: string;
}
