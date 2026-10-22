import type { DocumentsReferenceRuntime } from '@sdkwork/documents-pc-commons';
import {
  readDocumentsRuntimeEnv,
  resolveDocumentsRuntimeBoolean,
} from '@sdkwork/documents-pc-commons/runtime';
import {
  resolveSdkworkDocumentsPcRuntimeConfig,
  type SdkworkDocumentsPcRuntimeConfig,
} from './environment.ts';
import {
  createSdkworkDocumentsPcIamRuntime,
  type SdkworkDocumentsPcIamRuntime,
} from './iamRuntime.ts';
import { SdkworkDocumentsPcRoutes } from './routes.ts';
import {
  createSdkworkDocumentsPcSessionStore,
  type SdkworkDocumentsPcSessionStore,
} from './sessionStore.ts';
import { createSdkworkDocumentsPcSessionTokenManager } from './sessionTokenManager.ts';
import {
  createSdkworkDocumentsPcSdkClientsWithTokenManager,
  getDocumentsAppSdkClientForReference,
  type SdkworkDocumentsPcSdkClientInventory,
} from './sdkClients.ts';
import { DOCUMENTS_SDK_SYSTEM_CONFIG } from './sdkSystemConfig.ts';

export interface SdkworkDocumentsPcRuntime {
  config: SdkworkDocumentsPcRuntimeConfig;
  iamRuntime: SdkworkDocumentsPcIamRuntime;
  routes: typeof SdkworkDocumentsPcRoutes;
  sdkClients: SdkworkDocumentsPcSdkClientInventory;
  session: SdkworkDocumentsPcSessionStore;
  documentsReferenceRuntime: DocumentsReferenceRuntime;
}

export function createSdkworkDocumentsPcRuntime(): SdkworkDocumentsPcRuntime {
  const config = resolveSdkworkDocumentsPcRuntimeConfig();
  const session = createSdkworkDocumentsPcSessionStore(
    typeof window === 'undefined' ? undefined : window.sessionStorage,
  );
  const tokenManager = createSdkworkDocumentsPcSessionTokenManager(session);
  const sdkClients = createSdkworkDocumentsPcSdkClientsWithTokenManager(config, tokenManager);
  const iamRuntime = createSdkworkDocumentsPcIamRuntime({
    config,
    sdkClients,
    session,
  });

  const documentsReferenceRuntime: DocumentsReferenceRuntime = {
    readRuntimeEnv: readDocumentsRuntimeEnv,
    resolveRuntimeBoolean: resolveDocumentsRuntimeBoolean,
    sdkSystemConfig: DOCUMENTS_SDK_SYSTEM_CONFIG,
    getDocumentsAppSdkClient: () => getDocumentsAppSdkClientForReference(),
    developerMarket: {
      async listSystems() {
        const response = await sdkClients.documentsAppClient.developerCatalog.apisList({
          pageSize: 100,
        });
        return response.items.map((surface) => ({
          systemCode: surface.id,
          systemName: surface.title,
          description: surface.description,
          availability: surface.deprecated ? 'planned' : 'available',
          sortWeight: surface.operationCount,
          schemaKey: surface.id,
          aliases: [surface.apiAuthority],
        }));
      },
      async loadSchema(surfaceId) {
        const schema = await sdkClients.documentsAppClient.developerCatalog.apiSchemaRetrieve(
          surfaceId,
        );
        return schema.spec;
      },
      resolveRequestBaseUrl(_systemCode, apiPrefix) {
        const prefix = apiPrefix.trim();
        if (!prefix || /^https?:\/\//u.test(prefix)) {
          return prefix;
        }
        // `appApiBaseUrl` already ends with `/app/v3/api`; the playground prefix
        // is absolute, so resolve it against the gateway origin.
        const appApiBaseUrl = sdkClients.appApiBaseUrl.replace(/\/+$/u, '');
        const origin = appApiBaseUrl.endsWith('/app/v3/api')
          ? appApiBaseUrl.slice(0, -'/app/v3/api'.length)
          : appApiBaseUrl;
        return `${origin}${prefix.startsWith('/') ? prefix : `/${prefix}`}`;
      },
    },
    playgroundUserAgent: 'SDKWork-Documents-PC/1.0.0',
  };

  return {
    config,
    iamRuntime,
    routes: SdkworkDocumentsPcRoutes,
    sdkClients,
    session,
    documentsReferenceRuntime,
  };
}
