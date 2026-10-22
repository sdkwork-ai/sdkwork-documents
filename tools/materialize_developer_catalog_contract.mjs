#!/usr/bin/env node
/**
 * Materialize the developer catalog app-api contract into the Documents App API
 * OpenAPI document.
 *
 * The catalog is owned by the documents module and mounted at
 * `/app/v3/api/developer_catalog/*`. Keeping the definition in one script makes
 * the contract deterministic across the phase-1 scaffold, SDK generation, and
 * route-manifest materialization.
 *
 * Usage:
 *   node tools/materialize_developer_catalog_contract.mjs
 *   node tools/materialize_developer_catalog_contract.mjs --check
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDir, '..');
const specPath = path.join(
  workspaceRoot,
  'sdks/sdkwork-documents-app-sdk/openapi/documents-app-api.openapi.json',
);
const checkOnly = process.argv.includes('--check');

const owner = 'sdkwork-documents';
const apiAuthority = 'sdkwork-documents-app-api';
const sdkFamily = 'sdkwork-documents-app-sdk';
const surface = 'app-api';
const prefix = '/app/v3/api/developer_catalog';

const problemResponses = () => ({
  400: { description: 'Problem detail', content: { 'application/problem+json': { schema: { $ref: '#/components/schemas/ProblemDetail' } } } },
  401: { description: 'Problem detail', content: { 'application/problem+json': { schema: { $ref: '#/components/schemas/ProblemDetail' } } } },
  403: { description: 'Problem detail', content: { 'application/problem+json': { schema: { $ref: '#/components/schemas/ProblemDetail' } } } },
  404: { description: 'Problem detail', content: { 'application/problem+json': { schema: { $ref: '#/components/schemas/ProblemDetail' } } } },
  429: { description: 'Problem detail', content: { 'application/problem+json': { schema: { $ref: '#/components/schemas/ProblemDetail' } } } },
  500: { description: 'Problem detail', content: { 'application/problem+json': { schema: { $ref: '#/components/schemas/ProblemDetail' } } } },
});

function operation(operationId, summary, responseSchema, parameters = [], auditEvent = '') {
  return {
    operationId,
    tags: ['developerCatalog'],
    summary,
    'x-sdkwork-owner': owner,
    'x-sdkwork-api-authority': apiAuthority,
    'x-sdkwork-sdk-family': sdkFamily,
    'x-sdkwork-api-surface': surface,
    'x-sdkwork-source-route-crate': 'sdkwork-routes-documents-app-api',
    'x-sdkwork-request-context': 'WebRequestContext',
    'x-sdkwork-auth-mode': 'dual-token',
    'x-sdkwork-permission': 'developer_catalog.read',
    ...(auditEvent ? { 'x-sdkwork-audit-event': auditEvent } : {}),
    security: [{ AuthToken: [], AccessToken: [] }],
    ...(parameters.length > 0 ? { parameters } : {}),
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: { $ref: `#/components/schemas/${responseSchema}` } } },
      },
      ...problemResponses(),
    },
  };
}

const pageParameters = [
  { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
  { name: 'pageSize', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } },
];

const paths = {
  [`${prefix}/overview`]: {
    get: operation('developerCatalog.overviewRetrieve', 'Developer catalog overview and facets', 'DeveloperCatalogOverviewResponse', [], 'developer_catalog.overview'),
  },
  [`${prefix}/categories`]: {
    get: operation('developerCatalog.categoriesList', 'Developer catalog categories', 'CatalogCategoryListResponse', [], 'developer_catalog.categories'),
  },
  [`${prefix}/languages`]: {
    get: operation('developerCatalog.languagesList', 'SDK language catalog', 'CatalogLanguageListResponse', [], 'developer_catalog.languages'),
  },
  [`${prefix}/apis`]: {
    get: operation(
      'developerCatalog.apisList',
      'List API surfaces across the SDKWork workspace',
      'CatalogApiSurfacePageResponse',
      [
        { name: 'q', in: 'query', schema: { type: 'string' } },
        { name: 'categoryCode', in: 'query', schema: { type: 'string' } },
        { name: 'moduleCode', in: 'query', schema: { type: 'string' } },
        { name: 'surfaceCode', in: 'query', schema: { type: 'string' } },
        ...pageParameters,
      ],
      'developer_catalog.apis',
    ),
  },
  [`${prefix}/apis/{surfaceId}`]: {
    get: operation(
      'developerCatalog.apiRetrieve',
      'Retrieve one API surface',
      'CatalogApiSurfaceDetailResponse',
      [{ name: 'surfaceId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      'developer_catalog.api_retrieved',
    ),
  },
  [`${prefix}/apis/{surfaceId}/schema`]: {
    get: operation(
      'developerCatalog.apiSchemaRetrieve',
      'Retrieve the stored OpenAPI document for one API surface',
      'CatalogApiSchemaResponse',
      [{ name: 'surfaceId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      'developer_catalog.schema_opened',
    ),
  },
  [`${prefix}/apis/{surfaceId}/operations`]: {
    get: operation(
      'developerCatalog.apiOperationsList',
      'List normalized operations for one API surface',
      'CatalogApiOperationPageResponse',
      [
        { name: 'surfaceId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        { name: 'q', in: 'query', schema: { type: 'string' } },
        ...pageParameters,
      ],
      'developer_catalog.operations',
    ),
  },
  [`${prefix}/sdks`]: {
    get: operation(
      'developerCatalog.sdksList',
      'List generated SDK families across the SDKWork workspace',
      'CatalogSdkFamilyPageResponse',
      [
        { name: 'q', in: 'query', schema: { type: 'string' } },
        { name: 'categoryCode', in: 'query', schema: { type: 'string' } },
        { name: 'moduleCode', in: 'query', schema: { type: 'string' } },
        { name: 'languageCode', in: 'query', schema: { type: 'string' } },
        { name: 'sdkType', in: 'query', schema: { type: 'string' } },
        ...pageParameters,
      ],
      'developer_catalog.sdks',
    ),
  },
  [`${prefix}/sdks/{sdkId}`]: {
    get: operation(
      'developerCatalog.sdkRetrieve',
      'Retrieve one SDK family with its language releases',
      'CatalogSdkFamilyDetailResponse',
      [{ name: 'sdkId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      'developer_catalog.sdk_retrieved',
    ),
  },
};

const stringArray = { type: 'array', items: { type: 'string' } };
const jsonObject = { type: 'object', additionalProperties: true };

const schemas = {
  CatalogFacet: {
    type: 'object',
    additionalProperties: false,
    required: ['code', 'count'],
    properties: { code: { type: 'string' }, count: { type: 'integer' } },
  },
  CatalogCounts: {
    type: 'object',
    additionalProperties: false,
    required: ['modules', 'apiSurfaces', 'apiOperations', 'sdkFamilies', 'sdkReleases', 'languages'],
    properties: {
      modules: { type: 'integer' },
      apiSurfaces: { type: 'integer' },
      apiOperations: { type: 'integer' },
      sdkFamilies: { type: 'integer' },
      sdkReleases: { type: 'integer' },
      languages: { type: 'integer' },
    },
  },
  CatalogCategory: {
    type: 'object',
    additionalProperties: false,
    required: ['code', 'name', 'description', 'icon', 'sortOrder', 'apiCount', 'sdkCount'],
    properties: {
      code: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string' },
      icon: { type: 'string' },
      sortOrder: { type: 'integer' },
      parentCode: { type: 'string' },
      apiCount: { type: 'integer' },
      sdkCount: { type: 'integer' },
    },
  },
  CatalogCategoryList: {
    type: 'object',
    additionalProperties: false,
    required: ['items'],
    properties: { items: { type: 'array', items: { $ref: '#/components/schemas/CatalogCategory' } } },
  },
  CatalogLanguage: {
    type: 'object',
    additionalProperties: false,
    required: ['code', 'name', 'family', 'icon', 'fileExtension', 'officialUrl', 'sortOrder', 'releaseCount'],
    properties: {
      code: { type: 'string' },
      name: { type: 'string' },
      family: { type: 'string' },
      icon: { type: 'string' },
      fileExtension: { type: 'string' },
      officialUrl: { type: 'string' },
      sortOrder: { type: 'integer' },
      releaseCount: { type: 'integer' },
    },
  },
  CatalogLanguageList: {
    type: 'object',
    additionalProperties: false,
    required: ['items'],
    properties: { items: { type: 'array', items: { $ref: '#/components/schemas/CatalogLanguage' } } },
  },
  DeveloperCatalogOverview: {
    type: 'object',
    additionalProperties: false,
    required: [
      'counts', 'categories', 'surfaceFacets', 'sdkTypeFacets', 'languageFacets',
      'featuredApiSurfaceIds', 'featuredSdkIds',
    ],
    properties: {
      counts: { $ref: '#/components/schemas/CatalogCounts' },
      categories: { type: 'array', items: { $ref: '#/components/schemas/CatalogCategory' } },
      surfaceFacets: { type: 'array', items: { $ref: '#/components/schemas/CatalogFacet' } },
      sdkTypeFacets: { type: 'array', items: { $ref: '#/components/schemas/CatalogFacet' } },
      languageFacets: { type: 'array', items: { $ref: '#/components/schemas/CatalogFacet' } },
      featuredApiSurfaceIds: stringArray,
      featuredSdkIds: stringArray,
    },
  },
  CatalogApiSurface: {
    type: 'object',
    additionalProperties: false,
    required: [
      'id', 'moduleCode', 'moduleName', 'surfaceCode', 'surfaceName', 'title', 'description',
      'apiVersion', 'apiAuthority', 'apiPrefix', 'categoryCode', 'categories',
      'operationCount', 'tagCount', 'authModes', 'tags', 'featured', 'deprecated', 'schemaAvailable',
    ],
    properties: {
      id: { type: 'string', format: 'uuid' },
      moduleCode: { type: 'string' },
      moduleName: { type: 'string' },
      surfaceCode: { type: 'string' },
      surfaceName: { type: 'string' },
      title: { type: 'string' },
      description: { type: 'string' },
      apiVersion: { type: 'string' },
      apiAuthority: { type: 'string' },
      apiPrefix: { type: 'string' },
      categoryCode: { type: 'string' },
      categories: stringArray,
      operationCount: { type: 'integer' },
      tagCount: { type: 'integer' },
      authModes: stringArray,
      tags: stringArray,
      featured: { type: 'boolean' },
      deprecated: { type: 'boolean' },
      schemaAvailable: { type: 'boolean' },
    },
  },
  CatalogApiSurfacePage: {
    type: 'object',
    additionalProperties: false,
    required: ['items', 'total', 'page', 'pageSize'],
    properties: {
      items: { type: 'array', items: { $ref: '#/components/schemas/CatalogApiSurface' } },
      total: { type: 'integer' },
      page: { type: 'integer' },
      pageSize: { type: 'integer' },
    },
  },
  CatalogApiSurfaceDetail: {
    type: 'object',
    additionalProperties: false,
    required: ['surface', 'servers'],
    properties: {
      surface: { $ref: '#/components/schemas/CatalogApiSurface' },
      servers: { type: 'array', items: jsonObject },
      schemaVersion: { type: 'string' },
      schemaChecksum: { type: 'string' },
      sourcePath: { type: 'string' },
    },
  },
  CatalogApiOperation: {
    type: 'object',
    additionalProperties: false,
    required: ['operationKey', 'method', 'path', 'summary', 'description', 'tags', 'deprecated', 'sortOrder'],
    properties: {
      operationKey: { type: 'string' },
      method: { type: 'string' },
      path: { type: 'string' },
      summary: { type: 'string' },
      description: { type: 'string' },
      tags: stringArray,
      deprecated: { type: 'boolean' },
      sortOrder: { type: 'integer' },
    },
  },
  CatalogApiOperationPage: {
    type: 'object',
    additionalProperties: false,
    required: ['items', 'total', 'page', 'pageSize'],
    properties: {
      items: { type: 'array', items: { $ref: '#/components/schemas/CatalogApiOperation' } },
      total: { type: 'integer' },
      page: { type: 'integer' },
      pageSize: { type: 'integer' },
    },
  },
  CatalogApiSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['surfaceId', 'apiAuthority', 'schemaVersion', 'schemaChecksum', 'spec'],
    properties: {
      surfaceId: { type: 'string', format: 'uuid' },
      apiAuthority: { type: 'string' },
      schemaVersion: { type: 'string' },
      schemaChecksum: { type: 'string' },
      spec: jsonObject,
    },
  },
  CatalogSdkRelease: {
    type: 'object',
    additionalProperties: false,
    required: [
      'languageCode', 'languageName', 'family', 'packageName', 'version',
      'generationState', 'releaseState', 'isLatest',
    ],
    properties: {
      languageCode: { type: 'string' },
      languageName: { type: 'string' },
      family: { type: 'string' },
      packageName: { type: 'string' },
      version: { type: 'string' },
      installCommand: { type: 'string' },
      downloadUrl: { type: 'string' },
      archiveName: { type: 'string' },
      generationState: { type: 'string' },
      releaseState: { type: 'string' },
      isLatest: { type: 'boolean' },
      releasedAt: { type: 'string' },
    },
  },
  CatalogSdkFamily: {
    type: 'object',
    additionalProperties: false,
    required: [
      'id', 'moduleCode', 'moduleName', 'sdkCode', 'sdkName', 'sdkType', 'surfaceCode',
      'packageName', 'description', 'sdkVersion', 'categoryCode', 'categories', 'languages',
      'releaseCount', 'featured', 'deprecated', 'downloadCount', 'rating',
    ],
    properties: {
      id: { type: 'string', format: 'uuid' },
      moduleCode: { type: 'string' },
      moduleName: { type: 'string' },
      sdkCode: { type: 'string' },
      sdkName: { type: 'string' },
      sdkType: { type: 'string' },
      surfaceCode: { type: 'string' },
      packageName: { type: 'string' },
      description: { type: 'string' },
      sdkVersion: { type: 'string' },
      categoryCode: { type: 'string' },
      categories: stringArray,
      languages: stringArray,
      releaseCount: { type: 'integer' },
      featured: { type: 'boolean' },
      deprecated: { type: 'boolean' },
      downloadCount: { type: 'integer' },
      rating: { type: 'number' },
    },
  },
  CatalogSdkFamilyPage: {
    type: 'object',
    additionalProperties: false,
    required: ['items', 'total', 'page', 'pageSize'],
    properties: {
      items: { type: 'array', items: { $ref: '#/components/schemas/CatalogSdkFamily' } },
      total: { type: 'integer' },
      page: { type: 'integer' },
      pageSize: { type: 'integer' },
    },
  },
  CatalogSdkFamilyDetail: {
    type: 'object',
    additionalProperties: false,
    required: ['sdk', 'releases'],
    properties: {
      sdk: { $ref: '#/components/schemas/CatalogSdkFamily' },
      repositoryUrl: { type: 'string' },
      docsUrl: { type: 'string' },
      licenseCode: { type: 'string' },
      supportLevel: { type: 'string' },
      pricingTier: { type: 'string' },
      releases: { type: 'array', items: { $ref: '#/components/schemas/CatalogSdkRelease' } },
    },
  },
};

function responseSchema(name, dataRef) {
  return {
    allOf: [
      { $ref: '#/components/schemas/SdkWorkApiResponse' },
      {
        type: 'object',
        required: ['data'],
        properties: { data: { $ref: `#/components/schemas/${dataRef}` } },
      },
    ],
  };
}

const responseSchemas = {
  DeveloperCatalogOverviewResponse: responseSchema('DeveloperCatalogOverviewResponse', 'DeveloperCatalogOverview'),
  CatalogCategoryListResponse: responseSchema('CatalogCategoryListResponse', 'CatalogCategoryList'),
  CatalogLanguageListResponse: responseSchema('CatalogLanguageListResponse', 'CatalogLanguageList'),
  CatalogApiSurfacePageResponse: responseSchema('CatalogApiSurfacePageResponse', 'CatalogApiSurfacePage'),
  CatalogApiSurfaceDetailResponse: responseSchema('CatalogApiSurfaceDetailResponse', 'CatalogApiSurfaceDetail'),
  CatalogApiSchemaResponse: responseSchema('CatalogApiSchemaResponse', 'CatalogApiSchema'),
  CatalogApiOperationPageResponse: responseSchema('CatalogApiOperationPageResponse', 'CatalogApiOperationPage'),
  CatalogSdkFamilyPageResponse: responseSchema('CatalogSdkFamilyPageResponse', 'CatalogSdkFamilyPage'),
  CatalogSdkFamilyDetailResponse: responseSchema('CatalogSdkFamilyDetailResponse', 'CatalogSdkFamilyDetail'),
};

const spec = JSON.parse(await readFile(specPath, 'utf8'));
const before = `${JSON.stringify(spec, null, 2)}\n`;

spec.tags = Array.isArray(spec.tags) ? spec.tags : [];
if (!spec.tags.some((tag) => (typeof tag === 'string' ? tag : tag?.name) === 'developerCatalog')) {
  spec.tags.push({ name: 'developerCatalog', description: 'Developer catalog: API market and SDK market.' });
}
spec.paths = { ...(spec.paths ?? {}), ...paths };
spec.components = spec.components ?? {};
spec.components.schemas = {
  ...(spec.components.schemas ?? {}),
  ...schemas,
  ...responseSchemas,
};

const after = `${JSON.stringify(spec, null, 2)}\n`;
if (checkOnly) {
  if (before !== after) {
    console.error('developer catalog app-api contract is stale; run node tools/materialize_developer_catalog_contract.mjs');
    process.exit(1);
  }
  console.log('developer catalog app-api contract check passed');
} else if (before !== after) {
  await writeFile(specPath, after, 'utf8');
  console.log(`materialized developer catalog contract into ${path.relative(workspaceRoot, specPath)}`);
} else {
  console.log('developer catalog app-api contract is current');
}
