import type { ParamRow } from './apiPlaygroundRows';
type AuthType = 'current_user' | 'api_key';
type RequestTab = 'params' | 'headers' | 'auth' | 'body';
export declare const FORBIDDEN_HEADER_NAMES: Set<string>;
export interface PlaygroundEndpoint {
    method: string;
    path: string;
    openApiOperation?: {
        requestBody?: {
            required?: boolean;
            content?: Record<string, unknown>;
        };
    };
}
export interface BuildPlaygroundRequestInput {
    baseUrl: string;
    endpoint: PlaygroundEndpoint;
    pathParams: ParamRow[];
    queryParams: ParamRow[];
    headerParams: ParamRow[];
    bodyValue: string;
    authType: AuthType;
    accessToken?: string;
    apiKey?: string;
    authToken?: string;
}
export interface PlaygroundResponse {
    status: number;
    statusText: string;
    time: number;
    size: number;
    headers: [string, string][];
    data: unknown;
}
export interface PlaygroundRequestValidationFailure {
    ok: false;
    activeTab: RequestTab;
    errors: Record<string, boolean>;
    response: PlaygroundResponse;
}
export interface PlaygroundRequestBuildSuccess {
    ok: true;
    url: string;
    requestInit: RequestInit & {
        headers: Record<string, string>;
    };
}
export type PlaygroundRequestBuildResult = PlaygroundRequestValidationFailure | PlaygroundRequestBuildSuccess;
export declare function buildPlaygroundUrl(input: Pick<BuildPlaygroundRequestInput, 'baseUrl' | 'endpoint' | 'pathParams' | 'queryParams'>): string;
export declare function buildPlaygroundRequest(input: BuildPlaygroundRequestInput): PlaygroundRequestBuildResult;
export {};
//# sourceMappingURL=playgroundRequest.d.ts.map