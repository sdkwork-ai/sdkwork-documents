import { createClient as createGeneratedAppClient, SdkworkDocumentsAppClient } from '../generated/server-openapi/src/index';
import type { SdkworkAppConfig } from '../generated/server-openapi/src/types/common';
export { SdkworkDocumentsAppClient, createGeneratedAppClient };
export type { SdkworkAppConfig };
export type SdkworkAppClient = SdkworkDocumentsAppClient;
export * from '../generated/server-openapi/src/types';
export * from '../generated/server-openapi/src/api';
export * from '../generated/server-openapi/src/http';
export * from '../generated/server-openapi/src/auth';
export declare function createClient(config: SdkworkAppConfig): SdkworkDocumentsAppClient;
//# sourceMappingURL=index.d.ts.map