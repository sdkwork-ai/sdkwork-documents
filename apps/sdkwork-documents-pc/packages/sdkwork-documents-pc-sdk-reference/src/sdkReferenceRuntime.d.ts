import type { ElementType } from 'react';
import type { ApiCategory, ApiCategorySidebarNode, ApiSchemaTabsDocument, ApiReferenceFetchJson, ApiSystemData as ApiReferenceSystemData } from '@sdkwork/documents-pc-api-reference/apiReferenceSchemaTabs';
import type { DocumentsGeneratedSdkMetadata, DocumentsGeneratedSdkType } from '@sdkwork/documents-pc-commons/runtime';
export type SdkReferenceSystem = 'llm-open-api' | 'image-open-api' | 'video-open-api' | 'audio-open-api' | 'drive-open-api' | 'knowledgebase-open-api' | 'memory-open-api' | 'agent-open-api' | 'payment-open-api' | 'iaas-open-api' | 'paas-open-api' | 'app-api' | 'backend-api';
export type GeneratedSdkType = DocumentsGeneratedSdkType;
export type GeneratedSdkMetadata = DocumentsGeneratedSdkMetadata;
export interface SdkReferenceSystemData extends Omit<ApiReferenceSystemData, 'id' | 'icon'> {
    id: SdkReferenceSystem;
    icon: ElementType;
}
export interface GeneratedSdkToolConfig {
    name: string;
    version: string;
    language: string;
    sdkType: GeneratedSdkType;
    outputPath: string;
    apiSpecPath: string;
    baseUrl: string;
    apiPrefix: string;
    endpointPath?: string;
    endpointMethod?: string;
    operationId?: string;
    packageName: string;
    author: string;
    license: string;
    description: string;
}
export declare function loadSdkReferenceSystems(): Promise<SdkReferenceSystemData[]>;
export declare function loadSdkReferenceSystemSummaries(fetchJson?: ApiReferenceFetchJson): Promise<SdkReferenceSystemData[]>;
export declare function loadSdkReferenceSystem(system: SdkReferenceSystemData, fetchJson?: ApiReferenceFetchJson): Promise<SdkReferenceSystemData>;
export declare function buildSdkReferenceSystems(manifest: ApiSchemaTabsDocument, fetchJson: (url: string) => Promise<unknown>): Promise<SdkReferenceSystemData[]>;
export declare function getGeneratedSdkMetadataForSystem(system: SdkReferenceSystem): GeneratedSdkMetadata;
export declare function createGeneratedSdkToolConfig(system: SdkReferenceSystem, languageId: string, schemaUrl?: string): GeneratedSdkToolConfig;
export declare function normalizeSdkReferenceLanguage(languageId: string): string;
export declare function isGeneratedSdkArchiveLanguage(languageId: string): boolean;
export declare function buildSdkReferenceSidebarTree(categories: ApiCategory[]): ApiCategorySidebarNode[];
//# sourceMappingURL=sdkReferenceRuntime.d.ts.map