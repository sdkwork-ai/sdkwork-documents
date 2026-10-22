export interface CatalogApiSchema {
  surfaceId: string;
  apiAuthority: string;
  schemaVersion: string;
  schemaChecksum: string;
  spec: Record<string, unknown>;
}
