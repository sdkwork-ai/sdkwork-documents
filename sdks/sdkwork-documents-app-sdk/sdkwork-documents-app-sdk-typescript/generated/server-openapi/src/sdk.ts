import { HttpClient, createHttpClient } from './http/client';
import type { SdkworkAppConfig } from './types/common';
import type { AuthTokenManager } from '@sdkwork/sdk-common';

import { DocumentsApi, createDocumentsApi } from './api/documents';
import { DeveloperCatalogApi, createDeveloperCatalogApi } from './api/developer-catalog';
import { RevisionsApi, createRevisionsApi } from './api/revisions';
import { DocumentIdentityApi, createDocumentIdentityApi } from './api/document-identity';
import { DocumentOverviewApi, createDocumentOverviewApi } from './api/document-overview';
import { DocumentCategoriesApi, createDocumentCategoriesApi } from './api/document-categories';
import { DocumentTagsApi, createDocumentTagsApi } from './api/document-tags';
import { DocumentTaxonomyApi, createDocumentTaxonomyApi } from './api/document-taxonomy';

export class SdkworkDocumentsAppClient {
  private httpClient: HttpClient;

  public readonly documents: DocumentsApi;
  public readonly developerCatalog: DeveloperCatalogApi;
  public readonly revisions: RevisionsApi;
  public readonly documentIdentity: DocumentIdentityApi;
  public readonly documentOverview: DocumentOverviewApi;
  public readonly documentCategories: DocumentCategoriesApi;
  public readonly documentTags: DocumentTagsApi;
  public readonly documentTaxonomy: DocumentTaxonomyApi;

  constructor(config: SdkworkAppConfig) {
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
  setAuthToken(token: string): this {
    this.httpClient.setAuthToken(token);
    return this;
  }

  setAccessToken(token: string): this {
    this.httpClient.setAccessToken(token);
    return this;
  }

  setTokenManager(manager: AuthTokenManager): this {
    this.httpClient.setTokenManager(manager);
    return this;
  }

  get http(): HttpClient {
    return this.httpClient;
  }
}

export function createClient(config: SdkworkAppConfig): SdkworkDocumentsAppClient {
  return new SdkworkDocumentsAppClient(config);
}

export default SdkworkDocumentsAppClient;
