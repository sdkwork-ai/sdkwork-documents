import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AlertCircle,
  Boxes,
  Braces,
  ChevronRight,
  Database,
  Download,
  Filter,
  Loader2,
  Package,
  RefreshCw,
  Search,
  Sparkles,
  TerminalSquare,
  X,
} from 'lucide-react';
import { CopyButton } from '@sdkwork/documents-pc-commons';
import {
  getDocumentsAppSdkClient,
  getDocumentsReferenceRuntime,
} from '@sdkwork/documents-pc-commons/runtime';
import type { DocumentsAppSdkClient } from '@sdkwork/documents-pc-commons';
import type { ApiReferenceEndpoint, OpenApiDocument } from '../openapiTypes';
import { ApiEndpointView } from '../components/ApiEndpointView';
import {
  buildApiCategoriesFromOpenApiDocument,
  type ApiCategory,
} from '../apiReferenceSchemaTabs';

type CatalogClient = DocumentsAppSdkClient['developerCatalog'];
type Overview = Awaited<ReturnType<CatalogClient['overviewRetrieve']>>;
type Category = Overview['categories'][number];
type ApiSurface = Awaited<ReturnType<CatalogClient['apisList']>>['items'][number];
type ApiSurfaceDetail = Awaited<ReturnType<CatalogClient['apiRetrieve']>>;
type ApiSchema = Awaited<ReturnType<CatalogClient['apiSchemaRetrieve']>>;
type SdkFamily = Awaited<ReturnType<CatalogClient['sdksList']>>['items'][number];
type SdkFamilyDetail = Awaited<ReturnType<CatalogClient['sdkRetrieve']>>;
type SdkLanguage = Awaited<ReturnType<CatalogClient['languagesList']>>['items'][number];

const API_SURFACE_LABELS: Record<string, string> = {
  open: 'Open API',
  app: 'App API',
  backend: 'Backend API',
  internal: 'Internal API',
  gateway: 'Gateway API',
  admin: 'Admin API',
  rpc: 'RPC',
  custom: 'Custom',
};

const PAGE_SIZE = 24;

function useCatalogClient(): CatalogClient | null {
  const [client, setClient] = useState<CatalogClient | null>(null);
  useEffect(() => {
    try {
      setClient(getDocumentsAppSdkClient().developerCatalog);
    } catch {
      setClient(null);
    }
  }, []);
  return client;
}

function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function formatCount(value: number | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '0';
  return value.toLocaleString();
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">
        <p className="font-medium">The developer catalog could not be loaded.</p>
        <p className="mt-1 break-all text-xs opacity-80">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1 rounded-lg border border-amber-300 px-2.5 py-1.5 text-xs font-medium hover:bg-amber-100 dark:border-amber-300/40 dark:hover:bg-amber-300/10"
      >
        <RefreshCw className="h-3.5 w-3.5" /> Retry
      </button>
    </div>
  );
}

function EmptyState({ icon: Icon, title, hint }: { icon: typeof Boxes; title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 py-16 text-center dark:border-white/15">
      <Icon className="h-8 w-8 text-slate-400 dark:text-slate-500" />
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</p>
      <p className="max-w-sm text-xs text-slate-500 dark:text-slate-400">{hint}</p>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
    </div>
  );
}

function CategoryChips({
  categories,
  active,
  onChange,
  countLabel,
}: {
  categories: Category[];
  active: string;
  onChange: (code: string) => void;
  countLabel: (category: Category) => number;
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="group"
      aria-label="Filter by category"
    >
      <button
        type="button"
        onClick={() => onChange('')}
        aria-pressed={active === ''}
        className={`max-w-full rounded-full border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 ${
          active === ''
            ? 'border-teal-600 bg-teal-600 text-white'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-white'
        }`}
      >
        All
      </button>
      {categories.map((category) => {
        const selected = active === category.code;
        return (
          <button
            key={category.code}
            type="button"
            onClick={() => onChange(selected ? '' : category.code)}
            aria-pressed={selected}
            title={category.name}
            className={`max-w-full rounded-full border px-3 py-1.5 text-left text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 ${
              selected
                ? 'border-teal-600 bg-teal-600 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            <span className="break-words">{category.name}</span>
            <span className={`ml-1.5 text-[10px] ${selected ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
              {formatCount(countLabel(category))}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="relative block flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-500"
      />
    </label>
  );
}

function Drawer({
  title,
  subtitle,
  onClose,
  children,
  widthClass = 'max-w-6xl',
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  widthClass?: string;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-slate-950/50 backdrop-blur-sm">
      <button type="button" aria-label="Close" className="flex-1 cursor-default" onClick={onClose} />
      <div
        className={`flex h-full w-full ${widthClass} flex-col overflow-hidden bg-white shadow-2xl dark:bg-[#101418]`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4 dark:border-white/10">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
            {subtitle ? <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}

function LoadingPane({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-20 text-sm text-slate-500 dark:text-slate-400">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}

function LoadMoreButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-teal-400 hover:text-slate-900 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:text-white"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
      Load more
    </button>
  );
}

function ApiSurfaceCard({
  surface,
  categoryNames,
  onOpen,
}: {
  surface: ApiSurface;
  categoryNames: Map<string, string>;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-400 hover:shadow-lg dark:border-white/10 dark:bg-white/5 dark:hover:border-teal-400/60"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white dark:bg-white dark:text-slate-900">
            <Braces className="h-3 w-3" />
            {API_SURFACE_LABELS[surface.surfaceCode] ?? surface.surfaceCode}
          </span>
          {surface.deprecated ? (
            <span className="rounded-md bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700 dark:bg-amber-400/15 dark:text-amber-200">
              Deprecated
            </span>
          ) : null}
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-teal-500 dark:text-slate-600" />
      </div>
      <h3 className="mt-3 line-clamp-2 text-base font-bold text-slate-900 dark:text-white">{surface.title}</h3>
      <p className="mt-1 text-xs font-medium text-teal-700 dark:text-teal-300">{surface.moduleName}</p>
      <p className="mt-2 line-clamp-3 flex-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
        {surface.description || 'No description published.'}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-white/10">v{surface.apiVersion}</span>
        <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-white/10">{formatCount(surface.operationCount)} operations</span>
        {surface.authModes.length > 0 ? (
          <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-white/10">{surface.authModes.join(' / ')}</span>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {surface.categories.slice(0, 3).map((code) => (
          <span key={code} className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700 dark:bg-teal-400/10 dark:text-teal-200">
            {categoryNames.get(code) ?? code}
          </span>
        ))}
      </div>
    </button>
  );
}

function ApiSurfaceDrawer({
  surfaceId,
  categoryNames,
  onClose,
}: {
  surfaceId: string;
  categoryNames: Map<string, string>;
  onClose: () => void;
}) {
  const client = useCatalogClient();
  const [detail, setDetail] = useState<ApiSurfaceDetail | null>(null);
  const [schema, setSchema] = useState<ApiSchema | null>(null);
  const [activeEndpointId, setActiveEndpointId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!client) return undefined;
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([client.apiRetrieve(surfaceId), client.apiSchemaRetrieve(surfaceId)])
      .then(([nextDetail, nextSchema]) => {
        if (cancelled) return;
        setDetail(nextDetail);
        setSchema(nextSchema);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [client, surfaceId, reloadKey]);

  const categories: ApiCategory[] = useMemo(() => {
    if (!schema) return [];
    return buildApiCategoriesFromOpenApiDocument(schema.spec as unknown as OpenApiDocument);
  }, [schema]);

  const endpoints = useMemo<ApiReferenceEndpoint[]>(
    () => categories.flatMap((category) => category.endpoints),
    [categories],
  );

  useEffect(() => {
    if (endpoints.length === 0) {
      setActiveEndpointId('');
      return;
    }
    setActiveEndpointId((current) => (
      current && endpoints.some((endpoint) => endpoint.id === current) ? current : endpoints[0]!.id
    ));
  }, [endpoints]);

  const activeEndpoint = endpoints.find((endpoint) => endpoint.id === activeEndpointId) ?? null;
  const requestBaseUrl = useMemo(() => {
    if (!detail) return '';
    const prefix = detail.surface.apiPrefix;
    try {
      return getDocumentsReferenceRuntime().developerMarket?.resolveRequestBaseUrl?.(
        detail.surface.moduleCode,
        prefix,
      ) ?? prefix;
    } catch {
      return prefix;
    }
  }, [detail]);

  const title = detail?.surface.title ?? 'API surface';
  const subtitle = detail
    ? `${detail.surface.moduleName} · ${API_SURFACE_LABELS[detail.surface.surfaceCode] ?? detail.surface.surfaceCode} · ${detail.surface.apiAuthority}`
    : 'Loading surface...';

  return (
    <Drawer title={title} subtitle={subtitle} onClose={onClose} widthClass="max-w-[1400px]">
      {loading ? <LoadingPane label="Loading API surface..." /> : null}
      {error ? (
        <div className="p-6">
          <ErrorBanner message={error} onRetry={() => setReloadKey((value) => value + 1)} />
        </div>
      ) : null}
      {!loading && !error && detail && schema ? (
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-6 py-3 text-[11px] text-slate-600 dark:border-white/10 dark:text-slate-300">
            <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-white/10">Version {detail.schemaVersion ?? detail.surface.apiVersion}</span>
            <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-white/10">{formatCount(detail.surface.operationCount)} operations</span>
            <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-white/10">
              {detail.surface.authModes.length > 0 ? detail.surface.authModes.join(' / ') : 'anonymous'}
            </span>
            {detail.surface.apiPrefix ? (
              <code className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] dark:bg-white/10">{detail.surface.apiPrefix}</code>
            ) : null}
            {detail.sourcePath ? (
              <span className="ml-auto inline-flex items-center gap-1 text-slate-400 dark:text-slate-500">
                <Database className="h-3.5 w-3.5" /> {detail.sourcePath}
              </span>
            ) : null}
          </div>
          {detail.surface.categories.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 border-b border-slate-200 px-6 py-2.5 dark:border-white/10">
              {detail.surface.categories.map((code) => (
                <span key={code} className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700 dark:bg-teal-400/10 dark:text-teal-200">
                  {categoryNames.get(code) ?? code}
                </span>
              ))}
            </div>
          ) : null}
          <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)]">
            <aside className="min-h-0 overflow-auto border-r border-slate-200 bg-slate-50/60 p-3 dark:border-white/10 dark:bg-white/[0.02]">
              {categories.length === 0 ? (
                <p className="p-3 text-xs text-slate-500 dark:text-slate-400">No operations are documented for this surface yet.</p>
              ) : (
                categories.map((category) => (
                  <section key={category.id} className="mb-3">
                    <h4 className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {category.name}
                    </h4>
                    <div className="space-y-0.5">
                      {category.endpoints.map((endpoint) => {
                        const active = endpoint.id === activeEndpointId;
                        return (
                          <button
                            key={endpoint.id}
                            type="button"
                            onClick={() => setActiveEndpointId(endpoint.id)}
                            className={`flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition ${
                              active
                                ? 'bg-white font-semibold text-slate-900 shadow-sm dark:bg-white/10 dark:text-white'
                                : 'text-slate-600 hover:bg-white/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white'
                            }`}
                          >
                            <span className="mt-0.5 w-10 shrink-0 font-mono text-[10px] font-bold text-teal-600 dark:text-teal-300">
                              {endpoint.method}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate">{endpoint.name}</span>
                              <span className="mt-0.5 block truncate font-mono text-[10px] text-slate-400 dark:text-slate-500">
                                {endpoint.path}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))
              )}
            </aside>
            <div className="min-h-0 overflow-auto p-6">
              {activeEndpoint ? (
                <ApiEndpointView endpoint={activeEndpoint} requestBaseUrl={requestBaseUrl} />
              ) : (
                <EmptyState
                  icon={TerminalSquare}
                  title="Select an operation"
                  hint="Pick an operation from the sidebar to read its contract and send a live request."
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </Drawer>
  );
}

export function ApiMarketPage() {
  const client = useCatalogClient();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [items, setItems] = useState<ApiSurface[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const [category, setCategory] = useState('');
  const [surfaceCode, setSurfaceCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [overviewError, setOverviewError] = useState('');
  const [selectedSurfaceId, setSelectedSurfaceId] = useState<string | null>(null);
  const loadGeneration = useRef(0);

  useEffect(() => {
    if (!client) return undefined;
    let cancelled = false;
    client.overviewRetrieve()
      .then((value) => {
        if (!cancelled) {
          setOverview(value);
          setOverviewError('');
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) setOverviewError(cause instanceof Error ? cause.message : String(cause));
      });
    return () => {
      cancelled = true;
    };
  }, [client]);

  const loadPage = useCallback(async (nextPage: number, append: boolean) => {
    if (!client) return;
    const generation = loadGeneration.current + 1;
    loadGeneration.current = generation;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError('');
    try {
      const result = await client.apisList({
        page: nextPage,
        pageSize: PAGE_SIZE,
        ...(debouncedQuery ? { q: debouncedQuery } : {}),
        ...(category ? { categoryCode: category } : {}),
        ...(surfaceCode ? { surfaceCode } : {}),
      });
      if (loadGeneration.current !== generation) return;
      setItems((current) => (append ? [...current, ...result.items] : result.items));
      setTotal(result.total);
      setPage(nextPage);
    } catch (cause) {
      if (loadGeneration.current !== generation) return;
      setError(cause instanceof Error ? cause.message : String(cause));
      if (!append) {
        setItems([]);
        setTotal(0);
      }
    } finally {
      if (loadGeneration.current === generation) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [client, debouncedQuery, category, surfaceCode]);

  useEffect(() => {
    if (!client) return;
    void loadPage(1, false);
  }, [client, loadPage]);

  const categories = overview?.categories ?? [];
  const surfaceFacets = overview?.surfaceFacets ?? [];
  const counts = overview?.counts;
  const categoryNames = useMemo(
    () => new Map(categories.map((item) => [item.code, item.name])),
    [categories],
  );

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 pb-16 pt-6 md:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-300">Developer Catalog</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">API Market · API 市场</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Every API surface published by the SDKWork workspace, with its stored OpenAPI contract, categories, and operations.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <Boxes className="h-4 w-4 text-teal-600 dark:text-teal-300" />
          {formatCount(counts?.modules)} modules · {formatCount(counts?.apiSurfaces)} API surfaces · {formatCount(counts?.apiOperations)} operations
        </div>
      </header>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="API surfaces" value={formatCount(counts?.apiSurfaces)} hint="Open, App, Backend, Internal, Gateway" />
        <StatCard label="Operations" value={formatCount(counts?.apiOperations)} hint="Normalized from stored OpenAPI documents" />
        <StatCard label="Modules" value={formatCount(counts?.modules)} hint="SDKWork workspace product modules" />
        <StatCard label="SDK families" value={formatCount(counts?.sdkFamilies)} hint="Linked multi-language SDK releases" />
      </div>

      {overviewError ? (
        <div className="mb-4">
          <ErrorBanner message={overviewError} onRetry={() => window.location.reload()} />
        </div>
      ) : null}

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchField value={query} onChange={setQuery} placeholder="Search APIs, modules, authorities..." />
        <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Filter className="h-3.5 w-3.5" />
          <select
            value={surfaceCode}
            onChange={(event) => setSurfaceCode(event.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-teal-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          >
            <option value="">All API types</option>
            {surfaceFacets.map((facet) => (
              <option key={facet.code} value={facet.code}>
                {API_SURFACE_LABELS[facet.code] ?? facet.code} ({facet.count})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mb-5">
        <CategoryChips categories={categories} active={category} onChange={setCategory} countLabel={(item) => item.apiCount} />
      </div>

      {error && items.length === 0 ? <ErrorBanner message={error} onRetry={() => void loadPage(1, false)} /> : null}
      {loading && items.length === 0 ? <LoadingPane label="Loading API catalog..." /> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState icon={Braces} title="No API surfaces match these filters" hint="Try a different search term, category, or API type." />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((surface) => (
          <ApiSurfaceCard
            key={surface.id}
            surface={surface}
            categoryNames={categoryNames}
            onOpen={() => setSelectedSurfaceId(surface.id)}
          />
        ))}
      </div>

      {items.length > 0 ? (
        <div className="mt-6 flex items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span>Showing {formatCount(items.length)} of {formatCount(total)} API surfaces</span>
          {items.length < total ? <LoadMoreButton loading={loadingMore} onClick={() => void loadPage(page + 1, true)} /> : null}
        </div>
      ) : null}

      {selectedSurfaceId ? (
        <ApiSurfaceDrawer
          surfaceId={selectedSurfaceId}
          categoryNames={categoryNames}
          onClose={() => setSelectedSurfaceId(null)}
        />
      ) : null}
    </main>
  );
}

function SdkCard({ sdk, onOpen }: { sdk: SdkFamily; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-400 hover:shadow-lg dark:border-white/10 dark:bg-white/5 dark:hover:border-violet-400/60"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-1 rounded-md bg-violet-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
          <Package className="h-3 w-3" />
          {API_SURFACE_LABELS[sdk.sdkType] ?? sdk.sdkType} SDK
        </span>
        {sdk.featured ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700 dark:bg-amber-400/15 dark:text-amber-200">
            <Sparkles className="h-3 w-3" /> Featured
          </span>
        ) : null}
      </div>
      <h3 className="mt-3 line-clamp-2 text-base font-bold text-slate-900 dark:text-white">{sdk.sdkName}</h3>
      <p className="mt-1 text-xs font-medium text-violet-700 dark:text-violet-300">{sdk.moduleName}</p>
      <p className="mt-2 line-clamp-2 flex-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
        {sdk.description || 'No description published.'}
      </p>
      <code className="mt-3 block truncate rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-[11px] text-slate-600 dark:bg-white/10 dark:text-slate-300">
        {sdk.packageName}
      </code>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {sdk.languages.slice(0, 6).map((language) => (
          <span key={language} className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-400/10 dark:text-violet-200">
            {language}
          </span>
        ))}
        {sdk.languages.length > 6 ? (
          <span className="text-[10px] text-slate-400 dark:text-slate-500">+{sdk.languages.length - 6}</span>
        ) : null}
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span>v{sdk.sdkVersion}</span>
        <span>{formatCount(sdk.releaseCount)} releases</span>
        <span className="inline-flex items-center gap-1">
          <Download className="h-3 w-3" /> {formatCount(sdk.downloadCount)}
        </span>
      </div>
    </button>
  );
}

function SdkDrawer({ sdkId, onClose }: { sdkId: string; onClose: () => void }) {
  const client = useCatalogClient();
  const [detail, setDetail] = useState<SdkFamilyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!client) return undefined;
    let cancelled = false;
    setLoading(true);
    setError('');
    client.sdkRetrieve(sdkId)
      .then((value) => {
        if (!cancelled) setDetail(value);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [client, sdkId, reloadKey]);

  const title = detail?.sdk.sdkName ?? 'SDK family';
  const subtitle = detail
    ? `${detail.sdk.moduleName} · ${API_SURFACE_LABELS[detail.sdk.sdkType] ?? detail.sdk.sdkType} · ${detail.sdk.packageName}`
    : 'Loading SDK...';

  return (
    <Drawer title={title} subtitle={subtitle} onClose={onClose} widthClass="max-w-5xl">
      {loading ? <LoadingPane label="Loading SDK family..." /> : null}
      {error ? (
        <div className="p-6">
          <ErrorBanner message={error} onRetry={() => setReloadKey((value) => value + 1)} />
        </div>
      ) : null}
      {!loading && !error && detail ? (
        <div className="space-y-6 p-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Version" value={detail.sdk.sdkVersion} hint="Latest published SDK version" />
            <StatCard label="Languages" value={formatCount(detail.sdk.languages.length)} hint="Generated language packages" />
            <StatCard label="License" value={detail.licenseCode ?? 'n/a'} hint="Package distribution license" />
            <StatCard label="Support" value={detail.supportLevel ?? 'standard'} hint={`${detail.pricingTier ?? 'free'} tier`} />
          </div>

          <section className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <code className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono dark:bg-white/10">{detail.sdk.packageName}</code>
              {detail.repositoryUrl ? (
                <a
                  href={detail.repositoryUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20"
                >
                  Repository
                </a>
              ) : null}
              {detail.docsUrl ? (
                <a
                  href={detail.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20"
                >
                  Documentation
                </a>
              ) : null}
            </div>
            {detail.sdk.description ? (
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{detail.sdk.description}</p>
            ) : null}
          </section>

          <section>
            <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">Language releases</h3>
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 dark:bg-white/5 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">Language</th>
                    <th className="px-4 py-2.5">Package</th>
                    <th className="px-4 py-2.5">Version</th>
                    <th className="px-4 py-2.5">Install</th>
                    <th className="px-4 py-2.5">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {detail.releases.map((release) => (
                    <tr key={`${release.languageCode}:${release.version}`} className="align-top text-slate-600 dark:text-slate-300">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-900 dark:text-white">{release.languageName}</span>
                        <span className="ml-1 text-[10px] text-slate-400 dark:text-slate-500">{release.family}</span>
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3 font-mono text-[11px]">{release.packageName}</td>
                      <td className="px-4 py-3">{release.version}</td>
                      <td className="px-4 py-3">
                        {release.installCommand ? (
                          <div className="flex items-center gap-1.5">
                            <code className="max-w-[260px] truncate rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] dark:bg-white/10">
                              {release.installCommand}
                            </code>
                            <CopyButton text={release.installCommand} />
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">n/a</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-0.5">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            release.releaseState === 'published'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200'
                              : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                          }`}>
                            {release.releaseState}
                          </span>
                          {release.isLatest ? (
                            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-300">latest</span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}
    </Drawer>
  );
}

export function SdkMarketPage() {
  const client = useCatalogClient();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [languages, setLanguages] = useState<SdkLanguage[]>([]);
  const [items, setItems] = useState<SdkFamily[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const [category, setCategory] = useState('');
  const [language, setLanguage] = useState('');
  const [sdkType, setSdkType] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [overviewError, setOverviewError] = useState('');
  const [selectedSdkId, setSelectedSdkId] = useState<string | null>(null);
  const loadGeneration = useRef(0);

  useEffect(() => {
    if (!client) return undefined;
    let cancelled = false;
    Promise.all([client.overviewRetrieve(), client.languagesList()])
      .then(([nextOverview, nextLanguages]) => {
        if (cancelled) return;
        setOverview(nextOverview);
        setLanguages(nextLanguages.items);
        setOverviewError('');
      })
      .catch((cause: unknown) => {
        if (!cancelled) setOverviewError(cause instanceof Error ? cause.message : String(cause));
      });
    return () => {
      cancelled = true;
    };
  }, [client]);

  const loadPage = useCallback(async (nextPage: number, append: boolean) => {
    if (!client) return;
    const generation = loadGeneration.current + 1;
    loadGeneration.current = generation;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError('');
    try {
      const result = await client.sdksList({
        page: nextPage,
        pageSize: PAGE_SIZE,
        ...(debouncedQuery ? { q: debouncedQuery } : {}),
        ...(category ? { categoryCode: category } : {}),
        ...(language ? { languageCode: language } : {}),
        ...(sdkType ? { sdkType } : {}),
      });
      if (loadGeneration.current !== generation) return;
      setItems((current) => (append ? [...current, ...result.items] : result.items));
      setTotal(result.total);
      setPage(nextPage);
    } catch (cause) {
      if (loadGeneration.current !== generation) return;
      setError(cause instanceof Error ? cause.message : String(cause));
      if (!append) {
        setItems([]);
        setTotal(0);
      }
    } finally {
      if (loadGeneration.current === generation) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [client, debouncedQuery, category, language, sdkType]);

  useEffect(() => {
    if (!client) return;
    void loadPage(1, false);
  }, [client, loadPage]);

  const categories = overview?.categories ?? [];
  const sdkTypeFacets = overview?.sdkTypeFacets ?? [];
  const counts = overview?.counts;

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 pb-16 pt-6 md:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">Developer Catalog</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">SDK Market · SDK 市场</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Multi-language SDK families generated from every published API surface, with package coordinates and install commands.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <Package className="h-4 w-4 text-violet-600 dark:text-violet-300" />
          {formatCount(counts?.sdkFamilies)} SDK families · {formatCount(counts?.sdkReleases)} releases · {formatCount(counts?.languages)} languages
        </div>
      </header>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="SDK families" value={formatCount(counts?.sdkFamilies)} hint="Open, App, Backend, Internal, Custom" />
        <StatCard label="Language releases" value={formatCount(counts?.sdkReleases)} hint="TypeScript, Python, Java, Go, Rust, ..." />
        <StatCard label="Languages" value={formatCount(counts?.languages)} hint="Web, server, mobile, desktop, data" />
        <StatCard label="API surfaces" value={formatCount(counts?.apiSurfaces)} hint="Contracts the SDKs are generated from" />
      </div>

      {overviewError ? (
        <div className="mb-4">
          <ErrorBanner message={overviewError} onRetry={() => window.location.reload()} />
        </div>
      ) : null}

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchField value={query} onChange={setQuery} placeholder="Search SDKs, packages, modules..." />
        <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Filter className="h-3.5 w-3.5" />
          <select
            value={sdkType}
            onChange={(event) => setSdkType(event.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          >
            <option value="">All SDK types</option>
            {sdkTypeFacets.map((facet) => (
              <option key={facet.code} value={facet.code}>
                {API_SURFACE_LABELS[facet.code] ?? facet.code} SDK ({facet.count})
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <TerminalSquare className="h-3.5 w-3.5" />
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          >
            <option value="">All languages</option>
            {languages.filter((item) => item.releaseCount > 0).map((item) => (
              <option key={item.code} value={item.code}>
                {item.name} ({item.releaseCount})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mb-5">
        <CategoryChips categories={categories} active={category} onChange={setCategory} countLabel={(item) => item.sdkCount} />
      </div>

      {error && items.length === 0 ? <ErrorBanner message={error} onRetry={() => void loadPage(1, false)} /> : null}
      {loading && items.length === 0 ? <LoadingPane label="Loading SDK catalog..." /> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState icon={Package} title="No SDKs match these filters" hint="Try a different search term, category, type, or language." />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((sdk) => (
          <SdkCard key={sdk.id} sdk={sdk} onOpen={() => setSelectedSdkId(sdk.id)} />
        ))}
      </div>

      {items.length > 0 ? (
        <div className="mt-6 flex items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span>Showing {formatCount(items.length)} of {formatCount(total)} SDK families</span>
          {items.length < total ? <LoadMoreButton loading={loadingMore} onClick={() => void loadPage(page + 1, true)} /> : null}
        </div>
      ) : null}

      {selectedSdkId ? <SdkDrawer sdkId={selectedSdkId} onClose={() => setSelectedSdkId(null)} /> : null}
    </main>
  );
}
