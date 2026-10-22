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
/** One endpoint category of a developer-market API system. */
export interface DocumentsDeveloperMarketCategory {
    code: string;
    name: string;
    endpointCount?: number;
    sortOrder?: number;
}
/** SDK package coordinates published for one developer-market API system. */
export interface DocumentsDeveloperMarketSdkPackage {
    name?: string;
    packageName?: string;
    sdkType?: string;
    apiPrefix?: string;
    runtimeEnvName?: string;
    sourceDir?: string;
    archiveName?: string;
    archiveLanguage?: string;
    version?: string;
    description?: string;
}
/**
 * One published developer-market API system as the App Store stores it.
 *
 * The documents reference surfaces never call the gateway's static
 * `/openapi/schema-tabs.json` document in an embed; the host supplies the
 * roster and documents through {@link DocumentsDeveloperMarketRuntime}.
 */
export interface DocumentsDeveloperMarketSystem {
    systemCode: string;
    systemName: string;
    description?: string | null;
    icon?: string | null;
    availability?: 'available' | 'planned' | string;
    sortWeight?: number;
    schemaKey?: string | null;
    aliases?: string[];
    serviceGroups?: unknown[];
    categories?: DocumentsDeveloperMarketCategory[];
    sdkPackages?: DocumentsDeveloperMarketSdkPackage[];
}
/** Host-supplied developer-market catalog reader (API market / SDK market). */
export interface DocumentsDeveloperMarketRuntime {
    /** @returns the published API system roster, ordered by the host's catalog. */
    listSystems(): Promise<DocumentsDeveloperMarketSystem[]>;
    /** @returns the OpenAPI document stored for one API system. */
    loadSchema(systemCode: string): Promise<unknown>;
    /**
     * Resolve an API surface prefix against the host's gateway origin so the
     * playground addresses the gateway instead of the embedding page origin.
     * @returns the absolute request base, or the input prefix when unresolved.
     */
    resolveRequestBaseUrl?(systemCode: string, apiPrefix: string): string;
}
export interface DocumentsReferenceRuntime {
    readRuntimeEnv: (name: string) => string | undefined;
    resolveRuntimeBoolean: (name: string, defaultValue?: boolean) => boolean;
    sdkSystemConfig: Record<string, DocumentsGeneratedSdkMetadata>;
    getDocumentsAppSdkClient: () => DocumentsAppSdkClient;
    playgroundUserAgent?: string;
    /**
     * Database-backed developer-market catalog. When present, the API reference
     * and SDK reference surfaces load their roster and OpenAPI documents from the
     * host instead of addressing static gateway JSON through the page origin.
     */
    developerMarket?: DocumentsDeveloperMarketRuntime;
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