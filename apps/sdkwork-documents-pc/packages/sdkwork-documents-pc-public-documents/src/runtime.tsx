import { createContext, useContext, type ReactNode } from 'react';
import type { PublicDocumentClient } from './types.ts';

export interface PublicDocumentsRuntime {
  client: PublicDocumentClient;
  basePath?: string;
}

const PublicDocumentsRuntimeContext = createContext<PublicDocumentsRuntime | null>(null);

export function PublicDocumentsRuntimeProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: PublicDocumentsRuntime;
}) {
  return (
    <PublicDocumentsRuntimeContext.Provider value={value}>
      {children}
    </PublicDocumentsRuntimeContext.Provider>
  );
}

export function usePublicDocumentsRuntime(): PublicDocumentsRuntime {
  const runtime = useContext(PublicDocumentsRuntimeContext);
  if (!runtime) {
    throw new Error('PublicDocumentsRuntimeProvider is required for public document pages.');
  }
  return runtime;
}
