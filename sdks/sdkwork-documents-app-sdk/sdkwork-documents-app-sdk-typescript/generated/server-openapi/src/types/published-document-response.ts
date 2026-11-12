import type { PublishedDocument } from './published-document';

export interface PublishedDocumentResponse {
  code: 0;
  data: unknown & { item: PublishedDocument; };
  /** Server-owned request correlation id. */
  traceId: string;
}
