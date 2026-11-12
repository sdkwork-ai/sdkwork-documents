import type { DocumentTag } from './document-tag';

export interface PublishedDocument {
  id: string;
  slug: string;
  locale: string;
  title: string;
  summary?: string;
  body: string;
  category?: string;
  publishedAt?: string;
  categoryName?: string;
  tags?: DocumentTag[];
}
