export interface DocumentCategoryUpdateRequest {
  name?: string;
  nameEn?: string;
  description?: string;
  sortOrder?: string;
  status?: 'active' | 'hidden';
}
