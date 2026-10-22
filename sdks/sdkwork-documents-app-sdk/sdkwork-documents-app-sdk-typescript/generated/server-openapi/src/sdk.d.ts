import { HttpClient } from './http/client';
import type { SdkworkAppConfig } from './types/common';
import type { AuthTokenManager } from '@sdkwork/sdk-common';
import { DocumentsApi } from './api/documents';
import { DeveloperCatalogApi } from './api/developer-catalog';
export declare class SdkworkDocumentsAppClient {
    private httpClient;
    readonly documents: DocumentsApi;
    readonly developerCatalog: DeveloperCatalogApi;
    constructor(config: SdkworkAppConfig);
    setAuthToken(token: string): this;
    setAccessToken(token: string): this;
    setTokenManager(manager: AuthTokenManager): this;
    get http(): HttpClient;
}
export declare function createClient(config: SdkworkAppConfig): SdkworkDocumentsAppClient;
export default SdkworkDocumentsAppClient;
//# sourceMappingURL=sdk.d.ts.map