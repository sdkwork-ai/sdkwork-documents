import type { DocumentIdentity } from './document-identity';

export interface DocumentIdentityResponse {
  code: 0;
  data: unknown & DocumentIdentity;
  /** Server-owned request correlation id. */
  traceId: string;
}
