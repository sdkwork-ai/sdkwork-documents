import { HttpClient } from './http/client';
import type { SdkworkAppConfig } from './types/common';
import type { AuthTokenManager } from '@sdkwork/sdk-common';
import { DocumentsApi } from './api/documents';
import { DeveloperCatalogApi } from './api/developer-catalog';
import { RevisionsApi } from './api/revisions';
import { DocumentIdentityApi } from './api/document-identity';
import { DocumentOverviewApi } from './api/document-overview';
import { DocumentCategoriesApi } from './api/document-categories';
import { DocumentTagsApi } from './api/document-tags';
import { DocumentTaxonomyApi } from './api/document-taxonomy';
export declare class SdkworkDocumentsAppClient {
    private httpClient;
    readonly documents: DocumentsApi;
    readonly developerCatalog: DeveloperCatalogApi;
    readonly revisions: RevisionsApi;
    readonly documentIdentity: DocumentIdentityApi;
    readonly documentOverview: DocumentOverviewApi;
    readonly documentCategories: DocumentCategoriesApi;
    readonly documentTags: DocumentTagsApi;
    readonly documentTaxonomy: DocumentTaxonomyApi;
    constructor(config: SdkworkAppConfig);
    setAuthToken(token: string): this;
    setAccessToken(token: string): this;
    setTokenManager(manager: AuthTokenManager): this;
    get http(): HttpClient;
}
export declare function createClient(config: SdkworkAppConfig): SdkworkDocumentsAppClient;
export default SdkworkDocumentsAppClient;
//# sourceMappingURL=sdk.d.ts.map