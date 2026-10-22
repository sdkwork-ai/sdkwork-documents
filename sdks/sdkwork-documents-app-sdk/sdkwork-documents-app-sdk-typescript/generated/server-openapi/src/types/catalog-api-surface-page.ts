import type { CatalogApiSurface } from './catalog-api-surface';

export interface CatalogApiSurfacePage {
  items: CatalogApiSurface[];
  total: number;
  page: number;
  pageSize: number;
}
