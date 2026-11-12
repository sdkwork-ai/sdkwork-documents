import type { DocumentOverviewItem } from './document-overview-item';

export interface DocumentOverviewListResponse {
  code: 0;
  data: unknown & { items: DocumentOverviewItem[]; };
  /** Server-owned request correlation id. */
  traceId: string;
}
