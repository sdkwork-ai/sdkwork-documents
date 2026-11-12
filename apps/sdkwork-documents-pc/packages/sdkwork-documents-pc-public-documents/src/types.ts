export interface PublicDocument {
  id: string;
  slug: string;
  locale: string;
  title: string;
  summary: string;
  body: string;
  category: string;
  categoryName?: string;
  tags?: { id: string; slug: string; name: string }[];
  publishedAt: string;
}

export interface PublicDocumentClient {
  list(locale?: string): Promise<PublicDocument[]>;
  retrieve(documentRef: string, locale?: string): Promise<PublicDocument>;
}
