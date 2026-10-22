export interface CatalogCategory {
  code: string;
  name: string;
  description: string;
  icon: string;
  sortOrder: number;
  parentCode?: string;
  apiCount: number;
  sdkCount: number;
}
