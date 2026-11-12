import type { DocumentTag } from './document-tag';

export interface DocumentOverviewItem {
  id: string;
  title: string;
  status: string;
  locale: string;
  slug: string;
  updatedAt: string;
  category?: string;
  tags?: DocumentTag[];
}
