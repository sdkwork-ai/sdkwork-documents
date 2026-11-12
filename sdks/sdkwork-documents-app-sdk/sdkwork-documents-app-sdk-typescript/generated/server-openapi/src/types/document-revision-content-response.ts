import type { DocumentRevisionContent } from './document-revision-content';

export interface DocumentRevisionContentResponse {
  code: 0;
  data: unknown & DocumentRevisionContent;
  /** Server-owned request correlation id. */
  traceId: string;
}
