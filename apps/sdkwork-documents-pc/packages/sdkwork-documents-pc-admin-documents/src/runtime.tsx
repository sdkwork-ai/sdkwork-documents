import { createContext, useContext, type ReactNode } from 'react';
import type { DocumentsAdminClient } from '@sdkwork/documents-pc-commons';

export interface DocumentsAdminRuntime {
  client: DocumentsAdminClient;
  /** Host route prefix; defaults to `/admin/documents`. */
  basePath?: string;
}

const DocumentsAdminRuntimeContext = createContext<DocumentsAdminRuntime | null>(null);

export function DocumentsAdminRuntimeProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: DocumentsAdminRuntime;
}) {
  return (
    <DocumentsAdminRuntimeContext.Provider value={value}>
      {children}
    </DocumentsAdminRuntimeContext.Provider>
  );
}

export function useDocumentsAdminRuntime(): DocumentsAdminRuntime {
  const runtime = useContext(DocumentsAdminRuntimeContext);
  if (!runtime) {
    throw new Error('DocumentsAdminRuntimeProvider is required for the documents admin pages.');
  }
  return runtime;
}
