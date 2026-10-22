import type { CatalogApiOperation } from './catalog-api-operation';

export interface CatalogApiOperationPage {
  items: CatalogApiOperation[];
  total: number;
  page: number;
  pageSize: number;
}
