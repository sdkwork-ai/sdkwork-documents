import type { ApiRequestOptions, HttpClient } from '../http/client';
import type { DocumentIdentity, DocumentIdentityUpdateRequest } from '../types';
export declare class DocumentIdentityIdentityApi {
    private client;
    constructor(client: HttpClient);
    /** Read editable public identity */
    retrieve(documentId: string, requestOptions?: ApiRequestOptions): Promise<DocumentIdentity>;
    /** Update locale and slug */
    update(documentId: string, body: DocumentIdentityUpdateRequest, requestOptions?: ApiRequestOptions): Promise<DocumentIdentity>;
}
export declare class DocumentIdentityApi {
    readonly identity: DocumentIdentityIdentityApi;
    constructor(client: HttpClient);
}
export declare function createDocumentIdentityApi(client: HttpClient): DocumentIdentityApi;
//# sourceMappingURL=document-identity.d.ts.map