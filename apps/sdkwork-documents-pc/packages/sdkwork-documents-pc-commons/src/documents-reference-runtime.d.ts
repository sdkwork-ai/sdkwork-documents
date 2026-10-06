import { type ReactNode } from 'react';
import type { DocumentsAppSdkClient } from './documents-sdk-client.ts';
export declare const APP_API_PREFIX = "/app/v3/api";
export declare const BACKEND_API_PREFIX = "/backend/v3/api";
export declare const DOCUMENTS_OPEN_API_PREFIX = "/doc/v3/api";
export declare const OPEN_API_PREFIX = "/v1";
export declare const CLOUD_API_PREFIX = "/cloud/v3/api";
export type DocumentsGeneratedSdkType = 'app' | 'backend' | 'ai' | 'drive' | 'memory' | 'agent' | 'payment' | 'iaas' | 'paas';
export interface DocumentsGeneratedSdkMetadata {
    name: string;
    packageName: string;
    version: string;
    sdkType: DocumentsGeneratedSdkType;
    apiPrefix: string;
    runtimeEnvName: string;
    sourceDir: string;
    archiveLanguage: 'typescript';
    archiveName: string;
    description: string;
}
export interface DocumentsReferenceRuntime {
    readRuntimeEnv: (name: string) => string | undefined;
    resolveRuntimeBoolean: (name: string, defaultValue?: boolean) => boolean;
    sdkSystemConfig: Record<string, DocumentsGeneratedSdkMetadata>;
    getDocumentsAppSdkClient: () => DocumentsAppSdkClient;
    playgroundUserAgent?: string;
}
export declare function DocumentsReferenceRuntimeProvider({ value, children, }: {
    value: DocumentsReferenceRuntime;
    children: ReactNode;
}): import("react").JSX.Element;
export declare function useDocumentsReferenceRuntime(): DocumentsReferenceRuntime;
export declare function readDocumentsRuntimeEnv(name: string): string | undefined;
export declare function resolveDocumentsRuntimeBoolean(name: string, defaultValue?: boolean): boolean;
export declare function resolvePlaygroundUserAgent(runtime: DocumentsReferenceRuntime): string;
//# sourceMappingURL=documents-reference-runtime.d.ts.map