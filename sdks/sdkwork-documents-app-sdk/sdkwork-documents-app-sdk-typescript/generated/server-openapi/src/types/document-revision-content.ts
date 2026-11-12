import type { DocumentRevision } from './document-revision';

export interface DocumentRevisionContent {
  revision: DocumentRevision;
  body: string;
}
