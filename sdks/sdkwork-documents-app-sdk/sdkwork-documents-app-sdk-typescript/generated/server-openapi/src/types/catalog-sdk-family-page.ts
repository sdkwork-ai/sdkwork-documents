import type { CatalogSdkFamily } from './catalog-sdk-family';

export interface CatalogSdkFamilyPage {
  items: CatalogSdkFamily[];
  total: number;
  page: number;
  pageSize: number;
}
