let documentsReferenceRuntime = null;
export function registerDocumentsReferenceRuntime(runtime) {
    documentsReferenceRuntime = runtime;
}
export function getDocumentsReferenceRuntime() {
    if (!documentsReferenceRuntime) {
        throw new Error('Documents reference runtime is not registered.');
    }
    return documentsReferenceRuntime;
}
export function getDocumentsAppSdkClient() {
    return getDocumentsReferenceRuntime().getDocumentsAppSdkClient();
}
//# sourceMappingURL=documents-sdk-client.js.map