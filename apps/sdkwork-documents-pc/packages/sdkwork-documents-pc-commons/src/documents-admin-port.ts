/**
 * Host-injected document management port for the documents admin pages.
 *
 * The admin UI never constructs an SDK client. A host (the SDKWork Documents
 * reference app or an application such as Cloud Router) adapts its generated
 * `documents-app-sdk` client to this port, which keeps the pages transport
 * agnostic and testable without an HTTP boundary.
 */
export interface DocumentsAdminDocument {
  id: string;
  title: string;
  status: string;
  body: string;
}

export interface DocumentsAdminCreateInput {
  title: string;
  body?: string;
}

export interface DocumentsAdminUpdateInput {
  title?: string;
  body?: string;
  status?: string;
}

/** Drive binding for the body file of one localized document. */
export interface DocumentsAdminDriveBindingInput {
  driveSpaceId?: string;
  driveNodeId?: string;
}

export interface DocumentsAdminRevision {
  id: string;
  documentId: string;
  locale: string;
  slug?: string;
  driveSpaceId?: string;
  driveNodeId?: string;
  contentChecksumSha256?: string;
  contentVersion: string;
  createdAt: string;
}

export interface DocumentsAdminIdentity {
  locale: string;
  slug: string;
}

export interface DocumentsAdminRevisionContent {
  revision: DocumentsAdminRevision;
  body: string;
}

export interface DocumentsAdminClient {
  list(): Promise<DocumentsAdminDocument[]>;
  retrieve(documentId: string): Promise<DocumentsAdminDocument>;
  create(input: DocumentsAdminCreateInput): Promise<DocumentsAdminDocument>;
  update(documentId: string, input: DocumentsAdminUpdateInput): Promise<DocumentsAdminDocument>;
  bindDrive(
    documentId: string,
    input: DocumentsAdminDriveBindingInput,
  ): Promise<DocumentsAdminDocument>;
  delete(documentId: string): Promise<void>;
  listRevisions(documentId: string): Promise<DocumentsAdminRevision[]>;
  getIdentity(documentId: string): Promise<DocumentsAdminIdentity>;
  updateIdentity(
    documentId: string,
    input: { locale?: string; slug?: string },
  ): Promise<DocumentsAdminIdentity>;
  getRevisionContent(
    documentId: string,
    revisionId: string,
  ): Promise<DocumentsAdminRevisionContent>;
  restoreRevision(documentId: string, revisionId: string): Promise<DocumentsAdminDocument>;
}
