import type { CatalogApiSchema } from './catalog-api-schema';
export interface CatalogApiSchemaResponse {
    code: 0;
    data: unknown & CatalogApiSchema;
    /** Server-owned request correlation id. */
    traceId: string;
}
//# sourceMappingURL=catalog-api-schema-response.d.ts.map