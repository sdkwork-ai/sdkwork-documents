import { createClient as createGeneratedAppClient, SdkworkDocumentsAppClient, } from '../generated/server-openapi/src/index';
export { SdkworkDocumentsAppClient, createGeneratedAppClient };
export * from '../generated/server-openapi/src/types';
export * from '../generated/server-openapi/src/api';
export * from '../generated/server-openapi/src/http';
export * from '../generated/server-openapi/src/auth';
export function createClient(config) {
    return createGeneratedAppClient(config);
}
//# sourceMappingURL=index.js.map