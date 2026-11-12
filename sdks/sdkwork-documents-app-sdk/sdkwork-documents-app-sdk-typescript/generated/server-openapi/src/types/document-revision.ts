export interface DocumentRevision {
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
