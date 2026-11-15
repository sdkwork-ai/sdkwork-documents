import { createHttpClient } from './http/client';
import { createDocumentsApi } from './api/documents';
import { createDeveloperCatalogApi } from './api/developer-catalog';
import { createRevisionsApi } from './api/revisions';
import { createDocumentIdentityApi } from './api/document-identity';
import { createDocumentOverviewApi } from './api/document-overview';
import { createDocumentCategoriesApi } from './api/document-categories';
import { createDocumentTagsApi } from './api/document-tags';
import { createDocumentTaxonomyApi } from './api/document-taxonomy';
export class SdkworkDocumentsAppClient {
    httpClient;
    documents;
    developerCatalog;
    revisions;
    documentIdentity;
    documentOverview;
    documentCategories;
    documentTags;
    documentTaxonomy;
    constructor(config) {
        this.httpClient = createHttpClient(config);
        this.documents = createDocumentsApi(this.httpClient);
        this.developerCatalog = createDeveloperCatalogApi(this.httpClient);
        this.revisions = createRevisionsApi(this.httpClient);
        this.documentIdentity = createDocumentIdentityApi(this.httpClient);
        this.documentOverview = createDocumentOverviewApi(this.httpClient);
        this.documentCategories = createDocumentCategoriesApi(this.httpClient);
        this.documentTags = createDocumentTagsApi(this.httpClient);
        this.documentTaxonomy = createDocumentTaxonomyApi(this.httpClient);
    }
    setAuthToken(token) {
        this.httpClient.setAuthToken(token);
        return this;
    }
    setAccessToken(token) {
        this.httpClient.setAccessToken(token);
        return this;
    }
    setTokenManager(manager) {
        this.httpClient.setTokenManager(manager);
        return this;
    }
    get http() {
        return this.httpClient;
    }
}
export function createClient(config) {
    return new SdkworkDocumentsAppClient(config);
}
export default SdkworkDocumentsAppClient;
//# sourceMappingURL=sdk.js.map