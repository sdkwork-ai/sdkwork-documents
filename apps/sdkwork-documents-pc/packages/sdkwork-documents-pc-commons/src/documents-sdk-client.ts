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

let documentsReferenceRuntime: DocumentsReferenceRuntime | null = null;

export function registerDocumentsReferenceRuntime(runtime: DocumentsReferenceRuntime): void {
  documentsReferenceRuntime = runtime;
}

export function getDocumentsReferenceRuntime(): DocumentsReferenceRuntime {
  if (!documentsReferenceRuntime) {
    throw new Error('Documents reference runtime is not registered.');
  }
  return documentsReferenceRuntime;
}

export function getDocumentsAppSdkClient(): DocumentsAppSdkClient {
  return getDocumentsReferenceRuntime().getDocumentsAppSdkClient();
}
