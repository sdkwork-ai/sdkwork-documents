import type { OpenApiDocument } from './openapiTypes';
export interface ParamRow {
    id: string;
    key: string;
    value: string;
    description: string;
    enabled: boolean;
    isSchema: boolean;
    required?: boolean;
}
export type ApiPlaygroundParamLocation = 'query' | 'path' | 'header';
export interface ApiPlaygroundOperationParameter {
    in?: string;
    name?: string;
    description?: string;
    required?: boolean;
}
export interface ApiPlaygroundJsonSchema {
    $ref?: string;
    type?: string;
    example?: unknown;
    properties?: Record<string, ApiPlaygroundJsonSchema>;
    required?: string[];
    items?: ApiPlaygroundJsonSchema;
}
export interface ApiPlaygroundRequestBody {
    required?: boolean;
    content?: {
        'application/json'?: {
            schema?: ApiPlaygroundJsonSchema;
        };
    } & Record<string, unknown>;
}
export interface ApiPlaygroundInitialStateInput {
    path?: string;
    openApiSpec?: OpenApiDocument;
    openApiOperation?: {
        parameters?: ApiPlaygroundOperationParameter[];
        requestBody?: ApiPlaygroundRequestBody;
    };
}
export interface ApiPlaygroundInitialState {
    queryParams: ParamRow[];
    pathParams: ParamRow[];
    headerParams: ParamRow[];
    bodyValue: string;
    activeTab: 'params' | 'body';
}
export declare function makeApiPlaygroundSchemaRows(parameters: ApiPlaygroundOperationParameter[], location: ApiPlaygroundParamLocation): ParamRow[];
export declare function extractApiPlaygroundPathTemplateVariables(path: string | undefined): string[];
export declare function makeApiPlaygroundEmptyRow(location: Exclude<ApiPlaygroundParamLocation, 'path'>, sequence: number, enabled?: boolean): ParamRow;
export declare function parseApiPlaygroundBulkRows(text: string, location: Exclude<ApiPlaygroundParamLocation, 'path'>): ParamRow[];
export declare function createApiPlaygroundInitialState(input: ApiPlaygroundInitialStateInput): ApiPlaygroundInitialState;
export declare function createApiPlaygroundInitialStateKey(input: ApiPlaygroundInitialStateInput & {
    method?: string;
    path?: string;
}): string;
//# sourceMappingURL=apiPlaygroundRows.d.ts.map