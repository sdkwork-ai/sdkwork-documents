import type { ApiParameter, OpenApiDocument, OpenApiJsonSchema, OpenApiMediaType, OpenApiRequestBody, OpenApiResponse } from './openapiTypes';
export interface ResolvedOpenApiSchema {
    schema: OpenApiJsonSchema;
    schemaName?: string;
    seenRefs: Set<string>;
}
export interface OpenApiSchemaRuntimeOptions {
    spec?: OpenApiDocument;
}
export declare function getJsonRequestSchema(requestBody?: OpenApiRequestBody): OpenApiJsonSchema | undefined;
export declare function getJsonResponseSchema(content?: OpenApiResponse['content']): OpenApiJsonSchema | undefined;
export declare function getDocumentedRequestMediaType(requestBody?: OpenApiRequestBody): OpenApiSelectedMediaType | undefined;
export declare function getDocumentedResponseMediaType(content?: OpenApiResponse['content']): OpenApiSelectedMediaType | undefined;
export declare function getDocumentedRequestSchema(requestBody?: OpenApiRequestBody): OpenApiJsonSchema | undefined;
export declare function getDocumentedResponseSchema(content?: OpenApiResponse['content']): OpenApiJsonSchema | undefined;
export interface OpenApiSelectedMediaType {
    contentType: string;
    mediaType: OpenApiMediaType;
}
export declare function getJsonLikeMediaType(content?: Record<string, OpenApiMediaType>): OpenApiSelectedMediaType | undefined;
export declare function getOpenApiMediaType(content: Record<string, OpenApiMediaType> | undefined, predicate?: (contentType: string) => boolean): OpenApiSelectedMediaType | undefined;
export declare function resolveOpenApiSchema(schema: OpenApiJsonSchema | undefined, spec: OpenApiDocument | undefined, seenRefs?: Set<string>): ResolvedOpenApiSchema | undefined;
export declare function getOpenApiSchemaName(schema: OpenApiJsonSchema | undefined): string | undefined;
export declare function schemaToApiParameters(schema: OpenApiJsonSchema | undefined, options?: OpenApiSchemaRuntimeOptions): ApiParameter[];
export declare function generateOpenApiSchemaExample(schema: OpenApiJsonSchema | undefined, options?: OpenApiSchemaRuntimeOptions, propertyName?: string): unknown;
export declare function getOpenApiMediaExample(mediaType: OpenApiMediaType | undefined): unknown;
export declare function schemaToTypeLabel(schema: OpenApiJsonSchema | undefined, options?: OpenApiSchemaRuntimeOptions): string;
export declare function schemaToTypescriptType(schema: OpenApiJsonSchema | undefined, options?: OpenApiSchemaRuntimeOptions): string;
export declare function isJsonObjectLikeSchema(schema: OpenApiJsonSchema | undefined, spec?: OpenApiDocument): boolean;
//# sourceMappingURL=openapiSchemaRuntime.d.ts.map