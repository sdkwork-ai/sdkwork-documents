import type { ApiRequestOptions, HttpClient } from '../http/client';
import type { CatalogApiOperationPage, CatalogApiSchema, CatalogApiSurfaceDetail, CatalogApiSurfacePage, CatalogCategoryList, CatalogLanguageList, CatalogSdkFamilyDetail, CatalogSdkFamilyPage, DeveloperCatalogOverview } from '../types';
export interface DeveloperCatalogApisListParams {
    q?: string;
    categoryCode?: string;
    moduleCode?: string;
    surfaceCode?: string;
    page?: number;
    pageSize?: number;
}
export interface DeveloperCatalogApiOperationsListParams {
    q?: string;
    page?: number;
    pageSize?: number;
}
export interface DeveloperCatalogSdksListParams {
    q?: string;
    categoryCode?: string;
    moduleCode?: string;
    languageCode?: string;
    sdkType?: string;
    page?: number;
    pageSize?: number;
}
export declare class DeveloperCatalogApi {
    private client;
    constructor(client: HttpClient);
    /** Developer catalog overview and facets */
    overviewRetrieve(requestOptions?: ApiRequestOptions): Promise<DeveloperCatalogOverview>;
    /** Developer catalog categories */
    categoriesList(requestOptions?: ApiRequestOptions): Promise<CatalogCategoryList>;
    /** SDK language catalog */
    languagesList(requestOptions?: ApiRequestOptions): Promise<CatalogLanguageList>;
    /** List API surfaces across the SDKWork workspace */
    apisList(params?: DeveloperCatalogApisListParams, requestOptions?: ApiRequestOptions): Promise<CatalogApiSurfacePage>;
    /** Retrieve one API surface */
    apiRetrieve(surfaceId: string, requestOptions?: ApiRequestOptions): Promise<CatalogApiSurfaceDetail>;
    /** Retrieve the stored OpenAPI document for one API surface */
    apiSchemaRetrieve(surfaceId: string, requestOptions?: ApiRequestOptions): Promise<CatalogApiSchema>;
    /** List normalized operations for one API surface */
    apiOperationsList(surfaceId: string, params?: DeveloperCatalogApiOperationsListParams, requestOptions?: ApiRequestOptions): Promise<CatalogApiOperationPage>;
    /** List generated SDK families across the SDKWork workspace */
    sdksList(params?: DeveloperCatalogSdksListParams, requestOptions?: ApiRequestOptions): Promise<CatalogSdkFamilyPage>;
    /** Retrieve one SDK family with its language releases */
    sdkRetrieve(sdkId: string, requestOptions?: ApiRequestOptions): Promise<CatalogSdkFamilyDetail>;
}
export declare function createDeveloperCatalogApi(client: HttpClient): DeveloperCatalogApi;
//# sourceMappingURL=developer-catalog.d.ts.map