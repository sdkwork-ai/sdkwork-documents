export * from "./documents-reference-runtime.js";
export * from "./api-request-url.js";
export * from "./api-result.js";
export * from "./json-value.js";
export * from "./app-session-token.js";
export * from "./portal-auth.js";
export { getDocumentsAppSdkClient, getDocumentsReferenceRuntime, registerDocumentsReferenceRuntime, } from "./documents-sdk-client.js";
import { getDocumentsReferenceRuntime } from "./documents-sdk-client.js";
export function getSdkSystemConfig() {
    return getDocumentsReferenceRuntime().sdkSystemConfig;
}
//# sourceMappingURL=runtime.js.map