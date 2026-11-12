import type { DocumentTag } from './document-tag';

export interface DocumentTaxonomy {
  category?: string;
  tags: DocumentTag[];
}
