export interface DocumentCategoryCreateRequest {
  slug: string;
  name: string;
  nameEn?: string;
  description?: string;
  sortOrder?: string;
}
