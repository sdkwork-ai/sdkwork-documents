import { createHttpClient } from './http/client';
import { createDocumentsApi } from './api/documents';
export class SdkworkDocumentsAppClient {
    httpClient;
    documents;
    constructor(config) {
        this.httpClient = createHttpClient(config);
        this.documents = createDocumentsApi(this.httpClient);
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