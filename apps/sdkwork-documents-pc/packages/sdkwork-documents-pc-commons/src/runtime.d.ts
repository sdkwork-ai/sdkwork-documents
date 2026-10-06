export * from './documents-reference-runtime.tsx';
export * from './api-request-url.ts';
export * from './api-result.ts';
export * from './json-value.ts';
export * from './app-session-token.ts';
export * from './portal-auth.ts';
export { getDocumentsAppSdkClient, getDocumentsReferenceRuntime, registerDocumentsReferenceRuntime, type DocumentsAppSdkClient, type SdkReferenceArchiveResponse, type SdkReferenceDocumentationResponse, } from './documents-sdk-client.ts';
import type { DocumentsGeneratedSdkMetadata } from './documents-reference-runtime.tsx';
export declare function getSdkSystemConfig(): Record<string, DocumentsGeneratedSdkMetadata>;
//# sourceMappingURL=runtime.d.ts.map