import type { ApiParameter, ApiReferenceEndpoint } from '@sdkwork/documents-pc-api-reference/openapiTypes';
export interface SdkEndpointData {
    name: string;
    packageName: string;
    baseUrl: string;
}
export interface SdkEndpointDocumentation {
    languageLabel: string;
    methodName: string;
    groupName: string;
    requestType: string;
    responseType: string;
    signature: string;
    codeDefinition: string;
    exampleUsage: string;
    parameters: ApiParameter[];
    returns: ApiParameter[];
}
export declare function buildSdkEndpointDocumentation(endpoint: ApiReferenceEndpoint, sdkData: SdkEndpointData, languageId?: string): SdkEndpointDocumentation;
//# sourceMappingURL=sdkEndpointDocumentation.d.ts.map