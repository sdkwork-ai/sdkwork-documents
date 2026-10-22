export interface CatalogApiOperation {
  operationKey: string;
  method: string;
  path: string;
  summary: string;
  description: string;
  tags: string[];
  deprecated: boolean;
  sortOrder: number;
}
