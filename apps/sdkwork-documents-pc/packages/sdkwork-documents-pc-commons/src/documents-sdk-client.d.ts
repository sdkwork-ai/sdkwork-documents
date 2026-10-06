import type { SdkworkDocumentsAppClient } from '@sdkwork/documents-app-sdk';
import type { DocumentsReferenceRuntime } from './documents-reference-runtime.tsx';
export interface SdkReferenceDocumentationResponse {
    readme: string;
    methodDefinition?: string | null;
    usageExample?: string | null;
    language: string;
    generated: boolean;
}
export interface SdkReferenceArchiveResponse {
    fileName: string;
    contentType: string;
    contentBase64: string;
    language: string;
}
/**
 * The generated `@sdkwork/documents-app-sdk` client surface this workspace
 * composes against. Mirroring the generated type (instead of hand-declaring a
 * parallel shape) keeps the reference runtime aligned with the SDK family the
 * generator owns.
 */
export type DocumentsAppSdkClient = Pick<SdkworkDocumentsAppClient, 'documents'>;
export declare function registerDocumentsReferenceRuntime(runtime: DocumentsReferenceRuntime): void;
export declare function getDocumentsReferenceRuntime(): DocumentsReferenceRuntime;
export declare function getDocumentsAppSdkClient(): DocumentsAppSdkClient;
//# sourceMappingURL=documents-sdk-client.d.ts.map