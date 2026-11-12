import type { DocumentTaxonomy } from './document-taxonomy';

export interface DocumentTaxonomyResponse {
  code: 0;
  data: unknown & DocumentTaxonomy;
  /** Server-owned request correlation id. */
  traceId: string;
}
