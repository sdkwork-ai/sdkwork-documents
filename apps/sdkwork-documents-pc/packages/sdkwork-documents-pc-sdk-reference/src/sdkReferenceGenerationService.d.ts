import type { SdkReferenceArchiveResponse, SdkReferenceDocumentationResponse } from '@sdkwork/documents-pc-commons';
export type { SdkReferenceDocumentationResponse };
import type { OpenApiDocument } from '@sdkwork/documents-pc-api-reference/openapiTypes';
import type { GeneratedSdkToolConfig } from './sdkReferenceRuntime';
export interface GenerateSdkReferenceInput {
    spec: OpenApiDocument;
    language: string;
    config: GeneratedSdkToolConfig;
}
export declare function generateSdkReferenceDocumentation(input: GenerateSdkReferenceInput): Promise<SdkReferenceDocumentationResponse>;
export declare function generateSdkReferenceArchive(input: GenerateSdkReferenceInput): Promise<SdkReferenceArchiveResponse>;
//# sourceMappingURL=sdkReferenceGenerationService.d.ts.map