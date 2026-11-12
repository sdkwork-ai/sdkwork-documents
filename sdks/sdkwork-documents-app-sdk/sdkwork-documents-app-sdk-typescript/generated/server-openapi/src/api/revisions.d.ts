import type { ApiRequestOptions, HttpClient } from '../http/client';
import type { Document, DocumentRevision, DocumentRevisionContent } from '../types';
export declare class RevisionsApi {
    private client;
    constructor(client: HttpClient);
    /** List Drive-backed published revisions */
    list(documentId: string, requestOptions?: ApiRequestOptions): Promise<{
        items: DocumentRevision[];
    }>;
    /** Read one revision body */
    retrieve(documentId: string, revisionId: string, requestOptions?: ApiRequestOptions): Promise<DocumentRevisionContent>;
    /** Restore a revision as a new version */
    restore(documentId: string, revisionId: string, requestOptions?: ApiRequestOptions): Promise<Document>;
}
export declare function createRevisionsApi(client: HttpClient): RevisionsApi;
//# sourceMappingURL=revisions.d.ts.map