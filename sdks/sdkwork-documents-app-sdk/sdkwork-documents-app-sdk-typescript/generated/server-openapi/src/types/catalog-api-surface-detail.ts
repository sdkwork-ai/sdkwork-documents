import type { CatalogApiSurface } from './catalog-api-surface';

export interface CatalogApiSurfaceDetail {
  surface: CatalogApiSurface;
  servers: Record<string, unknown>[];
  schemaVersion?: string;
  schemaChecksum?: string;
  sourcePath?: string;
}
