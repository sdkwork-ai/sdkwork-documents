import type { ElementType } from 'react';
import type { ApiReferenceEndpoint, OpenApiDocument } from './openapiTypes';
export declare const API_SCHEMA_TABS_URL = "/openapi/schema-tabs.json";
export declare const LEGACY_OPENAPI_URL = "/openapi.json";
export interface ApiSchemaTab {
    id: string;
    name: string;
    aliases?: string[];
    order: number;
    schemaUrls: string[];
    defaultSchemaUrl?: string;
    cacheTtlSeconds?: number;
    status?: ApiSchemaTabStatus;
    description?: string;
    serviceGroups?: ApiSchemaServiceGroup[];
}
export interface ApiSchemaServiceGroup {
    code: string;
    name: string;
    description: string;
    providerCodes: string[];
    operations: string[];
}
export interface ApiSchemaTabsDocument {
    cacheTtlSeconds?: number;
    tabs: ApiSchemaTab[];
}
export type ApiSchemaTabStatus = 'available' | 'planned';
export interface ApiCategory {
    id: string;
    name: string;
    endpoints: ApiReferenceEndpoint[];
    sortOrder?: number;
}
export interface ApiCategorySidebarNode {
    id: string;
    name: string;
    fullName: string;
    endpoints: ApiReferenceEndpoint[];
    children: ApiCategorySidebarNode[];
    totalEndpoints: number;
    sortOrder?: number;
}
export interface ApiSystemData {
    id: string;
    name: string;
    icon: ElementType;
    schemaTab: ApiSchemaTab;
    schemaUrl: string;
    requestBaseUrl: string;
    openApiSpec?: OpenApiDocument;
    categories: ApiCategory[];
    status: ApiSchemaTabStatus;
    description?: string;
    serviceGroups: ApiSchemaServiceGroup[];
}
export type ApiReferenceFetchJson = (url: string) => Promise<unknown>;
export declare function sortApiSchemaTabs(tabs: ApiSchemaTab[]): ApiSchemaTab[];
export declare function loadApiReferenceSchemaTabs(fetchJson?: ApiReferenceFetchJson): Promise<ApiSchemaTabsDocument>;
export declare function createApiReferenceSystemSummaries(manifest: ApiSchemaTabsDocument): ApiSystemData[];
export declare function loadApiReferenceSystem(tab: ApiSchemaTab, fetchJson?: ApiReferenceFetchJson): Promise<ApiSystemData>;
export declare function buildApiCategorySidebarTree(categories: ApiCategory[]): ApiCategorySidebarNode[];
export declare function loadApiReferenceSystems(fetchJson?: ApiReferenceFetchJson): Promise<ApiSystemData[]>;
export declare function buildApiReferenceSystemsFromTabs(manifest: ApiSchemaTabsDocument, fetchJson: ApiReferenceFetchJson): Promise<ApiSystemData[]>;
export declare function getApiSystemDisplayName(system: Pick<ApiSystemData, 'id' | 'name'>): string;
export declare function getDefaultApiReferenceEndpoint(system: ApiSystemData): ApiReferenceEndpoint | null;
export declare function formatApiOperationDisplayName(value: string): string;
//# sourceMappingURL=apiReferenceSchemaTabs.d.ts.map