import React from 'react';
import type { ApiReferenceEndpoint } from '@sdkwork/documents-pc-api-reference/openapiTypes';
import type { OpenApiDocument } from '@sdkwork/documents-pc-api-reference/openapiTypes';
import { type SdkEndpointData } from '../sdkEndpointDocumentation';
import type { GeneratedSdkToolConfig } from '../sdkReferenceRuntime';
interface SdkEndpointViewProps {
    endpoint: ApiReferenceEndpoint;
    requestBaseUrl: string;
    sdkData: SdkEndpointData;
    language: string;
    sdkConfig: GeneratedSdkToolConfig;
    spec: OpenApiDocument | null;
}
export declare function SdkEndpointView({ endpoint, requestBaseUrl, sdkData, language, sdkConfig, spec }: SdkEndpointViewProps): React.JSX.Element;
export {};
//# sourceMappingURL=SdkEndpointView.d.ts.map