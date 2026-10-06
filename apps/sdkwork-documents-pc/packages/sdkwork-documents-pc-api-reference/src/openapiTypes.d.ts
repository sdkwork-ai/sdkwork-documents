export interface ApiParameter {
    name: string;
    type: string;
    desc: string;
    required?: boolean;
    children?: ApiParameter[];
}
export interface OpenApiJsonSchema {
    $ref?: string;
    type?: string | string[];
    title?: string;
    format?: string;
    description?: string;
    example?: unknown;
    examples?: unknown[] | Record<string, unknown>;
    default?: unknown;
    const?: unknown;
    enum?: unknown[];
    nullable?: boolean;
    additionalProperties?: boolean | OpenApiJsonSchema;
    allOf?: OpenApiJsonSchema[];
    oneOf?: OpenApiJsonSchema[];
    anyOf?: OpenApiJsonSchema[];
    properties?: Record<string, OpenApiJsonSchema>;
    required?: string[];
    items?: OpenApiJsonSchema;
}
export interface OpenApiParameter {
    $ref?: string;
    in?: string;
    name?: string;
    description?: string;
    required?: boolean;
    schema?: OpenApiJsonSchema;
}
export interface OpenApiMediaType {
    schema?: OpenApiJsonSchema;
    example?: unknown;
    examples?: Record<string, unknown>;
}
export interface OpenApiRequestBody {
    required?: boolean;
    content?: Record<string, OpenApiMediaType>;
}
export interface OpenApiResponse {
    description?: string;
    content?: Record<string, OpenApiMediaType>;
}
export interface OpenApiOperation {
    operationId?: string;
    summary?: string;
    description?: string;
    tags?: string[];
    parameters?: OpenApiParameter[];
    requestBody?: OpenApiRequestBody;
    responses?: Record<string, OpenApiResponse>;
}
export type OpenApiOperationMethod = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';
export declare const OPEN_API_OPERATION_METHODS: readonly OpenApiOperationMethod[];
export interface OpenApiPathItem {
    parameters?: OpenApiParameter[];
    servers?: unknown;
    [method: string]: unknown;
}
export interface OpenApiDocument {
    tags?: OpenApiTag[];
    paths: Record<string, OpenApiPathItem>;
    components?: {
        schemas?: Record<string, OpenApiJsonSchema>;
        parameters?: Record<string, OpenApiParameter>;
        [key: string]: unknown;
    };
    "x-api-prefix"?: string;
    [key: string]: unknown;
}
export interface OpenApiTag {
    name?: string;
    'x-display-order'?: number;
    [key: string]: unknown;
}
export interface ApiReferenceEndpoint {
    id: string;
    name: string;
    method: string;
    path: string;
    description: string;
    body: ApiParameter[];
    requestObject?: string;
    responseProperties?: ApiParameter[];
    responseObject?: string;
    responseType?: string;
    responseStatus?: string;
    responseContentType?: string;
    curl: string;
    response: string;
    openApiOperation?: OpenApiOperation;
    openApiPathItem?: OpenApiPathItem;
    openApiSpec?: OpenApiDocument;
}
export declare function asOpenApiJsonSchema(value: unknown): OpenApiJsonSchema | undefined;
export declare function isOpenApiParameter(value: unknown): value is OpenApiParameter;
export declare function isOpenApiOperation(value: unknown): value is OpenApiOperation;
export declare function isOpenApiDocument(value: unknown): value is OpenApiDocument;
//# sourceMappingURL=openapiTypes.d.ts.map