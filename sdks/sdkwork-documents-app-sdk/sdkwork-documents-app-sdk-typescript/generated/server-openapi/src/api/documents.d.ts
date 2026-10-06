import type { ApiRequestOptions, HttpClient } from '../http/client';
import type { Document, DocumentCreateRequest, DocumentUpdateRequest, PageInfo, SdkReferenceGenerationRequest } from '../types';
export interface DocumentsSdkReferenceArchivesCreateParams {
    idempotencyKey: string;
}
export interface DocumentsSdkReferenceDocumentationCreateParams {
    idempotencyKey: string;
}
export declare class DocumentsSdkReferenceApi {
    private client;
    constructor(client: HttpClient);
    archivesCreate(body: SdkReferenceGenerationRequest, params: DocumentsSdkReferenceArchivesCreateParams, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>>;
    documentationCreate(body: SdkReferenceGenerationRequest, params: DocumentsSdkReferenceDocumentationCreateParams, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>>;
}
export interface DocumentsCreateParams {
    idempotencyKey: string;
}
export declare class DocumentsApi {
    private client;
    readonly sdkReference: DocumentsSdkReferenceApi;
    constructor(client: HttpClient);
    list(requestOptions?: ApiRequestOptions): Promise<{
        items: Document[];
        pageInfo: PageInfo;
    }>;
    create(body: DocumentCreateRequest, params: DocumentsCreateParams, requestOptions?: ApiRequestOptions): Promise<Document>;
    retrieve(documentId: string, requestOptions?: ApiRequestOptions): Promise<Document>;
    update(documentId: string, body: DocumentUpdateRequest, requestOptions?: ApiRequestOptions): Promise<Document>;
}
export declare function createDocumentsApi(client: HttpClient): DocumentsApi;
//# sourceMappingURL=documents.d.ts.map