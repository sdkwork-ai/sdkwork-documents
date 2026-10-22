import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Boxes, Braces, ChevronRight, Database, Download, Filter, Loader2, Package, RefreshCw, Search, Sparkles, TerminalSquare, X, } from 'lucide-react';
import { CopyButton } from '@sdkwork/documents-pc-commons';
import { getDocumentsAppSdkClient, getDocumentsReferenceRuntime, } from '@sdkwork/documents-pc-commons/runtime';
import { ApiEndpointView } from '../components/ApiEndpointView';
import { buildApiCategoriesFromOpenApiDocument, } from '../apiReferenceSchemaTabs';
const API_SURFACE_LABELS = {
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
function useCatalogClient() {
    const [client, setClient] = useState(null);
    useEffect(() => {
        try {
            setClient(getDocumentsAppSdkClient().developerCatalog);
        }
        catch {
            setClient(null);
        }
    }, []);
    return client;
}
function useDebouncedValue(value, delay = 250) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}
function formatCount(value) {
    if (typeof value !== 'number' || !Number.isFinite(value))
        return '0';
    return value.toLocaleString();
}
function ErrorBanner({ message, onRetry }) {
    return (_jsxs("div", { className: "flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200", children: [_jsx(AlertCircle, { className: "mt-0.5 h-4 w-4 shrink-0" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium", children: "The developer catalog could not be loaded." }), _jsx("p", { className: "mt-1 break-all text-xs opacity-80", children: message })] }), _jsxs("button", { type: "button", onClick: onRetry, className: "inline-flex items-center gap-1 rounded-lg border border-amber-300 px-2.5 py-1.5 text-xs font-medium hover:bg-amber-100 dark:border-amber-300/40 dark:hover:bg-amber-300/10", children: [_jsx(RefreshCw, { className: "h-3.5 w-3.5" }), " Retry"] })] }));
}
function EmptyState({ icon: Icon, title, hint }) {
    return (_jsxs("div", { className: "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 py-16 text-center dark:border-white/15", children: [_jsx(Icon, { className: "h-8 w-8 text-slate-400 dark:text-slate-500" }), _jsx("p", { className: "text-sm font-semibold text-slate-700 dark:text-slate-200", children: title }), _jsx("p", { className: "max-w-sm text-xs text-slate-500 dark:text-slate-400", children: hint })] }));
}
function StatCard({ label, value, hint }) {
    return (_jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5", children: [_jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400", children: label }), _jsx("p", { className: "mt-1 text-2xl font-bold text-slate-900 dark:text-white", children: value }), _jsx("p", { className: "mt-0.5 text-xs text-slate-500 dark:text-slate-400", children: hint })] }));
}
function CategoryChips({ categories, active, onChange, countLabel, }) {
    return (_jsxs("div", { className: "-mx-1 flex gap-2 overflow-x-auto px-1 pb-1", children: [_jsx("button", { type: "button", onClick: () => onChange(''), className: `shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${active === ''
                    ? 'border-teal-600 bg-teal-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-white'}`, children: "All" }), categories.map((category) => {
                const selected = active === category.code;
                return (_jsxs("button", { type: "button", onClick: () => onChange(selected ? '' : category.code), className: `shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${selected
                        ? 'border-teal-600 bg-teal-600 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-white'}`, children: [category.name, _jsx("span", { className: `ml-1.5 text-[10px] ${selected ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`, children: formatCount(countLabel(category)) })] }, category.code));
            })] }));
}
function SearchField({ value, onChange, placeholder }) {
    return (_jsxs("label", { className: "relative block flex-1", children: [_jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" }), _jsx("input", { value: value, onChange: (event) => onChange(event.target.value), placeholder: placeholder, className: "h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-500" })] }));
}
function Drawer({ title, subtitle, onClose, children, widthClass = 'max-w-6xl', }) {
    useEffect(() => {
        const onKey = (event) => {
            if (event.key === 'Escape')
                onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);
    return (_jsxs("div", { className: "fixed inset-0 z-[80] flex justify-end bg-slate-950/50 backdrop-blur-sm", children: [_jsx("button", { type: "button", "aria-label": "Close", className: "flex-1 cursor-default", onClick: onClose }), _jsxs("div", { className: `flex h-full w-full ${widthClass} flex-col overflow-hidden bg-white shadow-2xl dark:bg-[#101418]`, role: "dialog", "aria-modal": "true", "aria-label": title, children: [_jsxs("div", { className: "flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4 dark:border-white/10", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("h2", { className: "truncate text-lg font-bold text-slate-900 dark:text-white", children: title }), subtitle ? _jsx("p", { className: "mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400", children: subtitle }) : null] }), _jsx("button", { type: "button", onClick: onClose, "aria-label": "Close", className: "rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white", children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsx("div", { className: "min-h-0 flex-1 overflow-auto", children: children })] })] }));
}
function LoadingPane({ label }) {
    return (_jsxs("div", { className: "flex items-center justify-center gap-2 py-20 text-sm text-slate-500 dark:text-slate-400", children: [_jsx(Loader2, { className: "h-4 w-4 animate-spin" }), " ", label] }));
}
function LoadMoreButton({ loading, onClick }) {
    return (_jsxs("button", { type: "button", disabled: loading, onClick: onClick, className: "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-teal-400 hover:text-slate-900 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:text-white", children: [loading ? _jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : _jsx(ChevronRight, { className: "h-4 w-4" }), "Load more"] }));
}
function ApiSurfaceCard({ surface, categoryNames, onOpen, }) {
    return (_jsxs("button", { type: "button", onClick: onOpen, className: "group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-400 hover:shadow-lg dark:border-white/10 dark:bg-white/5 dark:hover:border-teal-400/60", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [_jsxs("span", { className: "inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white dark:bg-white dark:text-slate-900", children: [_jsx(Braces, { className: "h-3 w-3" }), API_SURFACE_LABELS[surface.surfaceCode] ?? surface.surfaceCode] }), surface.deprecated ? (_jsx("span", { className: "rounded-md bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700 dark:bg-amber-400/15 dark:text-amber-200", children: "Deprecated" })) : null] }), _jsx(ChevronRight, { className: "h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-teal-500 dark:text-slate-600" })] }), _jsx("h3", { className: "mt-3 line-clamp-2 text-base font-bold text-slate-900 dark:text-white", children: surface.title }), _jsx("p", { className: "mt-1 text-xs font-medium text-teal-700 dark:text-teal-300", children: surface.moduleName }), _jsx("p", { className: "mt-2 line-clamp-3 flex-1 text-xs leading-5 text-slate-500 dark:text-slate-400", children: surface.description || 'No description published.' }), _jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400", children: [_jsxs("span", { className: "rounded-md bg-slate-100 px-2 py-1 dark:bg-white/10", children: ["v", surface.apiVersion] }), _jsxs("span", { className: "rounded-md bg-slate-100 px-2 py-1 dark:bg-white/10", children: [formatCount(surface.operationCount), " operations"] }), surface.authModes.length > 0 ? (_jsx("span", { className: "rounded-md bg-slate-100 px-2 py-1 dark:bg-white/10", children: surface.authModes.join(' / ') })) : null] }), _jsx("div", { className: "mt-3 flex flex-wrap gap-1.5", children: surface.categories.slice(0, 3).map((code) => (_jsx("span", { className: "rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700 dark:bg-teal-400/10 dark:text-teal-200", children: categoryNames.get(code) ?? code }, code))) })] }));
}
function ApiSurfaceDrawer({ surfaceId, categoryNames, onClose, }) {
    const client = useCatalogClient();
    const [detail, setDetail] = useState(null);
    const [schema, setSchema] = useState(null);
    const [activeEndpointId, setActiveEndpointId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reloadKey, setReloadKey] = useState(0);
    useEffect(() => {
        if (!client)
            return undefined;
        let cancelled = false;
        setLoading(true);
        setError('');
        Promise.all([client.apiRetrieve(surfaceId), client.apiSchemaRetrieve(surfaceId)])
            .then(([nextDetail, nextSchema]) => {
            if (cancelled)
                return;
            setDetail(nextDetail);
            setSchema(nextSchema);
        })
            .catch((cause) => {
            if (!cancelled)
                setError(cause instanceof Error ? cause.message : String(cause));
        })
            .finally(() => {
            if (!cancelled)
                setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [client, surfaceId, reloadKey]);
    const categories = useMemo(() => {
        if (!schema)
            return [];
        return buildApiCategoriesFromOpenApiDocument(schema.spec);
    }, [schema]);
    const endpoints = useMemo(() => categories.flatMap((category) => category.endpoints), [categories]);
    useEffect(() => {
        if (endpoints.length === 0) {
            setActiveEndpointId('');
            return;
        }
        setActiveEndpointId((current) => (current && endpoints.some((endpoint) => endpoint.id === current) ? current : endpoints[0].id));
    }, [endpoints]);
    const activeEndpoint = endpoints.find((endpoint) => endpoint.id === activeEndpointId) ?? null;
    const requestBaseUrl = useMemo(() => {
        if (!detail)
            return '';
        const prefix = detail.surface.apiPrefix;
        try {
            return getDocumentsReferenceRuntime().developerMarket?.resolveRequestBaseUrl?.(detail.surface.moduleCode, prefix) ?? prefix;
        }
        catch {
            return prefix;
        }
    }, [detail]);
    const title = detail?.surface.title ?? 'API surface';
    const subtitle = detail
        ? `${detail.surface.moduleName} · ${API_SURFACE_LABELS[detail.surface.surfaceCode] ?? detail.surface.surfaceCode} · ${detail.surface.apiAuthority}`
        : 'Loading surface...';
    return (_jsxs(Drawer, { title: title, subtitle: subtitle, onClose: onClose, widthClass: "max-w-[1400px]", children: [loading ? _jsx(LoadingPane, { label: "Loading API surface..." }) : null, error ? (_jsx("div", { className: "p-6", children: _jsx(ErrorBanner, { message: error, onRetry: () => setReloadKey((value) => value + 1) }) })) : null, !loading && !error && detail && schema ? (_jsxs("div", { className: "flex h-full min-h-0 flex-col", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2 border-b border-slate-200 px-6 py-3 text-[11px] text-slate-600 dark:border-white/10 dark:text-slate-300", children: [_jsxs("span", { className: "rounded-md bg-slate-100 px-2 py-1 dark:bg-white/10", children: ["Version ", detail.schemaVersion ?? detail.surface.apiVersion] }), _jsxs("span", { className: "rounded-md bg-slate-100 px-2 py-1 dark:bg-white/10", children: [formatCount(detail.surface.operationCount), " operations"] }), _jsx("span", { className: "rounded-md bg-slate-100 px-2 py-1 dark:bg-white/10", children: detail.surface.authModes.length > 0 ? detail.surface.authModes.join(' / ') : 'anonymous' }), detail.surface.apiPrefix ? (_jsx("code", { className: "rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] dark:bg-white/10", children: detail.surface.apiPrefix })) : null, detail.sourcePath ? (_jsxs("span", { className: "ml-auto inline-flex items-center gap-1 text-slate-400 dark:text-slate-500", children: [_jsx(Database, { className: "h-3.5 w-3.5" }), " ", detail.sourcePath] })) : null] }), detail.surface.categories.length > 0 ? (_jsx("div", { className: "flex flex-wrap gap-1.5 border-b border-slate-200 px-6 py-2.5 dark:border-white/10", children: detail.surface.categories.map((code) => (_jsx("span", { className: "rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700 dark:bg-teal-400/10 dark:text-teal-200", children: categoryNames.get(code) ?? code }, code))) })) : null, _jsxs("div", { className: "grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)]", children: [_jsx("aside", { className: "min-h-0 overflow-auto border-r border-slate-200 bg-slate-50/60 p-3 dark:border-white/10 dark:bg-white/[0.02]", children: categories.length === 0 ? (_jsx("p", { className: "p-3 text-xs text-slate-500 dark:text-slate-400", children: "No operations are documented for this surface yet." })) : (categories.map((category) => (_jsxs("section", { className: "mb-3", children: [_jsx("h4", { className: "px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400", children: category.name }), _jsx("div", { className: "space-y-0.5", children: category.endpoints.map((endpoint) => {
                                                const active = endpoint.id === activeEndpointId;
                                                return (_jsxs("button", { type: "button", onClick: () => setActiveEndpointId(endpoint.id), className: `flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition ${active
                                                        ? 'bg-white font-semibold text-slate-900 shadow-sm dark:bg-white/10 dark:text-white'
                                                        : 'text-slate-600 hover:bg-white/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white'}`, children: [_jsx("span", { className: "mt-0.5 w-10 shrink-0 font-mono text-[10px] font-bold text-teal-600 dark:text-teal-300", children: endpoint.method }), _jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block truncate", children: endpoint.name }), _jsx("span", { className: "mt-0.5 block truncate font-mono text-[10px] text-slate-400 dark:text-slate-500", children: endpoint.path })] })] }, endpoint.id));
                                            }) })] }, category.id)))) }), _jsx("div", { className: "min-h-0 overflow-auto p-6", children: activeEndpoint ? (_jsx(ApiEndpointView, { endpoint: activeEndpoint, requestBaseUrl: requestBaseUrl })) : (_jsx(EmptyState, { icon: TerminalSquare, title: "Select an operation", hint: "Pick an operation from the sidebar to read its contract and send a live request." })) })] })] })) : null] }));
}
export function ApiMarketPage() {
    const client = useCatalogClient();
    const [overview, setOverview] = useState(null);
    const [items, setItems] = useState([]);
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
    const [selectedSurfaceId, setSelectedSurfaceId] = useState(null);
    const loadGeneration = useRef(0);
    useEffect(() => {
        if (!client)
            return undefined;
        let cancelled = false;
        client.overviewRetrieve()
            .then((value) => {
            if (!cancelled) {
                setOverview(value);
                setOverviewError('');
            }
        })
            .catch((cause) => {
            if (!cancelled)
                setOverviewError(cause instanceof Error ? cause.message : String(cause));
        });
        return () => {
            cancelled = true;
        };
    }, [client]);
    const loadPage = useCallback(async (nextPage, append) => {
        if (!client)
            return;
        const generation = loadGeneration.current + 1;
        loadGeneration.current = generation;
        if (append)
            setLoadingMore(true);
        else
            setLoading(true);
        setError('');
        try {
            const result = await client.apisList({
                page: nextPage,
                pageSize: PAGE_SIZE,
                ...(debouncedQuery ? { q: debouncedQuery } : {}),
                ...(category ? { categoryCode: category } : {}),
                ...(surfaceCode ? { surfaceCode } : {}),
            });
            if (loadGeneration.current !== generation)
                return;
            setItems((current) => (append ? [...current, ...result.items] : result.items));
            setTotal(result.total);
            setPage(nextPage);
        }
        catch (cause) {
            if (loadGeneration.current !== generation)
                return;
            setError(cause instanceof Error ? cause.message : String(cause));
            if (!append) {
                setItems([]);
                setTotal(0);
            }
        }
        finally {
            if (loadGeneration.current === generation) {
                setLoading(false);
                setLoadingMore(false);
            }
        }
    }, [client, debouncedQuery, category, surfaceCode]);
    useEffect(() => {
        if (!client)
            return;
        void loadPage(1, false);
    }, [client, loadPage]);
    const categories = overview?.categories ?? [];
    const surfaceFacets = overview?.surfaceFacets ?? [];
    const counts = overview?.counts;
    const categoryNames = useMemo(() => new Map(categories.map((item) => [item.code, item.name])), [categories]);
    return (_jsxs("main", { className: "mx-auto w-full max-w-[1500px] px-4 pb-16 pt-6 md:px-6", children: [_jsxs("header", { className: "mb-6 flex flex-wrap items-end justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-300", children: "Developer Catalog" }), _jsx("h1", { className: "mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white", children: "API Market \u00B7 API \u5E02\u573A" }), _jsx("p", { className: "mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400", children: "Every API surface published by the SDKWork workspace, with its stored OpenAPI contract, categories, and operations." })] }), _jsxs("div", { className: "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-300", children: [_jsx(Boxes, { className: "h-4 w-4 text-teal-600 dark:text-teal-300" }), formatCount(counts?.modules), " modules \u00B7 ", formatCount(counts?.apiSurfaces), " API surfaces \u00B7 ", formatCount(counts?.apiOperations), " operations"] })] }), _jsxs("div", { className: "mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4", children: [_jsx(StatCard, { label: "API surfaces", value: formatCount(counts?.apiSurfaces), hint: "Open, App, Backend, Internal, Gateway" }), _jsx(StatCard, { label: "Operations", value: formatCount(counts?.apiOperations), hint: "Normalized from stored OpenAPI documents" }), _jsx(StatCard, { label: "Modules", value: formatCount(counts?.modules), hint: "SDKWork workspace product modules" }), _jsx(StatCard, { label: "SDK families", value: formatCount(counts?.sdkFamilies), hint: "Linked multi-language SDK releases" })] }), overviewError ? (_jsx("div", { className: "mb-4", children: _jsx(ErrorBanner, { message: overviewError, onRetry: () => window.location.reload() }) })) : null, _jsxs("div", { className: "mb-4 flex flex-col gap-3 lg:flex-row lg:items-center", children: [_jsx(SearchField, { value: query, onChange: setQuery, placeholder: "Search APIs, modules, authorities..." }), _jsxs("label", { className: "flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400", children: [_jsx(Filter, { className: "h-3.5 w-3.5" }), _jsxs("select", { value: surfaceCode, onChange: (event) => setSurfaceCode(event.target.value), className: "h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-teal-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-200", children: [_jsx("option", { value: "", children: "All API types" }), surfaceFacets.map((facet) => (_jsxs("option", { value: facet.code, children: [API_SURFACE_LABELS[facet.code] ?? facet.code, " (", facet.count, ")"] }, facet.code)))] })] })] }), _jsx("div", { className: "mb-5", children: _jsx(CategoryChips, { categories: categories, active: category, onChange: setCategory, countLabel: (item) => item.apiCount }) }), error && items.length === 0 ? _jsx(ErrorBanner, { message: error, onRetry: () => void loadPage(1, false) }) : null, loading && items.length === 0 ? _jsx(LoadingPane, { label: "Loading API catalog..." }) : null, !loading && !error && items.length === 0 ? (_jsx(EmptyState, { icon: Braces, title: "No API surfaces match these filters", hint: "Try a different search term, category, or API type." })) : null, _jsx("div", { className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3", children: items.map((surface) => (_jsx(ApiSurfaceCard, { surface: surface, categoryNames: categoryNames, onOpen: () => setSelectedSurfaceId(surface.id) }, surface.id))) }), items.length > 0 ? (_jsxs("div", { className: "mt-6 flex items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400", children: [_jsxs("span", { children: ["Showing ", formatCount(items.length), " of ", formatCount(total), " API surfaces"] }), items.length < total ? _jsx(LoadMoreButton, { loading: loadingMore, onClick: () => void loadPage(page + 1, true) }) : null] })) : null, selectedSurfaceId ? (_jsx(ApiSurfaceDrawer, { surfaceId: selectedSurfaceId, categoryNames: categoryNames, onClose: () => setSelectedSurfaceId(null) })) : null] }));
}
function SdkCard({ sdk, onOpen }) {
    return (_jsxs("button", { type: "button", onClick: onOpen, className: "group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-400 hover:shadow-lg dark:border-white/10 dark:bg-white/5 dark:hover:border-violet-400/60", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("span", { className: "inline-flex items-center gap-1 rounded-md bg-violet-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white", children: [_jsx(Package, { className: "h-3 w-3" }), API_SURFACE_LABELS[sdk.sdkType] ?? sdk.sdkType, " SDK"] }), sdk.featured ? (_jsxs("span", { className: "inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700 dark:bg-amber-400/15 dark:text-amber-200", children: [_jsx(Sparkles, { className: "h-3 w-3" }), " Featured"] })) : null] }), _jsx("h3", { className: "mt-3 line-clamp-2 text-base font-bold text-slate-900 dark:text-white", children: sdk.sdkName }), _jsx("p", { className: "mt-1 text-xs font-medium text-violet-700 dark:text-violet-300", children: sdk.moduleName }), _jsx("p", { className: "mt-2 line-clamp-2 flex-1 text-xs leading-5 text-slate-500 dark:text-slate-400", children: sdk.description || 'No description published.' }), _jsx("code", { className: "mt-3 block truncate rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-[11px] text-slate-600 dark:bg-white/10 dark:text-slate-300", children: sdk.packageName }), _jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-1.5", children: [sdk.languages.slice(0, 6).map((language) => (_jsx("span", { className: "rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-400/10 dark:text-violet-200", children: language }, language))), sdk.languages.length > 6 ? (_jsxs("span", { className: "text-[10px] text-slate-400 dark:text-slate-500", children: ["+", sdk.languages.length - 6] })) : null] }), _jsxs("div", { className: "mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400", children: [_jsxs("span", { children: ["v", sdk.sdkVersion] }), _jsxs("span", { children: [formatCount(sdk.releaseCount), " releases"] }), _jsxs("span", { className: "inline-flex items-center gap-1", children: [_jsx(Download, { className: "h-3 w-3" }), " ", formatCount(sdk.downloadCount)] })] })] }));
}
function SdkDrawer({ sdkId, onClose }) {
    const client = useCatalogClient();
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reloadKey, setReloadKey] = useState(0);
    useEffect(() => {
        if (!client)
            return undefined;
        let cancelled = false;
        setLoading(true);
        setError('');
        client.sdkRetrieve(sdkId)
            .then((value) => {
            if (!cancelled)
                setDetail(value);
        })
            .catch((cause) => {
            if (!cancelled)
                setError(cause instanceof Error ? cause.message : String(cause));
        })
            .finally(() => {
            if (!cancelled)
                setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [client, sdkId, reloadKey]);
    const title = detail?.sdk.sdkName ?? 'SDK family';
    const subtitle = detail
        ? `${detail.sdk.moduleName} · ${API_SURFACE_LABELS[detail.sdk.sdkType] ?? detail.sdk.sdkType} · ${detail.sdk.packageName}`
        : 'Loading SDK...';
    return (_jsxs(Drawer, { title: title, subtitle: subtitle, onClose: onClose, widthClass: "max-w-5xl", children: [loading ? _jsx(LoadingPane, { label: "Loading SDK family..." }) : null, error ? (_jsx("div", { className: "p-6", children: _jsx(ErrorBanner, { message: error, onRetry: () => setReloadKey((value) => value + 1) }) })) : null, !loading && !error && detail ? (_jsxs("div", { className: "space-y-6 p-6", children: [_jsxs("div", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4", children: [_jsx(StatCard, { label: "Version", value: detail.sdk.sdkVersion, hint: "Latest published SDK version" }), _jsx(StatCard, { label: "Languages", value: formatCount(detail.sdk.languages.length), hint: "Generated language packages" }), _jsx(StatCard, { label: "License", value: detail.licenseCode ?? 'n/a', hint: "Package distribution license" }), _jsx(StatCard, { label: "Support", value: detail.supportLevel ?? 'standard', hint: `${detail.pricingTier ?? 'free'} tier` })] }), _jsxs("section", { className: "rounded-2xl border border-slate-200 p-4 dark:border-white/10", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300", children: [_jsx("code", { className: "rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono dark:bg-white/10", children: detail.sdk.packageName }), detail.repositoryUrl ? (_jsx("a", { href: detail.repositoryUrl, target: "_blank", rel: "noreferrer", className: "rounded-lg border border-slate-200 px-2.5 py-1.5 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20", children: "Repository" })) : null, detail.docsUrl ? (_jsx("a", { href: detail.docsUrl, target: "_blank", rel: "noreferrer", className: "rounded-lg border border-slate-200 px-2.5 py-1.5 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20", children: "Documentation" })) : null] }), detail.sdk.description ? (_jsx("p", { className: "mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300", children: detail.sdk.description })) : null] }), _jsxs("section", { children: [_jsx("h3", { className: "mb-3 text-sm font-bold text-slate-900 dark:text-white", children: "Language releases" }), _jsx("div", { className: "overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10", children: _jsxs("table", { className: "w-full text-left text-xs", children: [_jsx("thead", { className: "bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 dark:bg-white/5 dark:text-slate-400", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-2.5", children: "Language" }), _jsx("th", { className: "px-4 py-2.5", children: "Package" }), _jsx("th", { className: "px-4 py-2.5", children: "Version" }), _jsx("th", { className: "px-4 py-2.5", children: "Install" }), _jsx("th", { className: "px-4 py-2.5", children: "State" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-white/5", children: detail.releases.map((release) => (_jsxs("tr", { className: "align-top text-slate-600 dark:text-slate-300", children: [_jsxs("td", { className: "px-4 py-3", children: [_jsx("span", { className: "font-semibold text-slate-900 dark:text-white", children: release.languageName }), _jsx("span", { className: "ml-1 text-[10px] text-slate-400 dark:text-slate-500", children: release.family })] }), _jsx("td", { className: "max-w-[220px] truncate px-4 py-3 font-mono text-[11px]", children: release.packageName }), _jsx("td", { className: "px-4 py-3", children: release.version }), _jsx("td", { className: "px-4 py-3", children: release.installCommand ? (_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("code", { className: "max-w-[260px] truncate rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] dark:bg-white/10", children: release.installCommand }), _jsx(CopyButton, { text: release.installCommand })] })) : (_jsx("span", { className: "text-slate-400 dark:text-slate-500", children: "n/a" })) }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex flex-col items-start gap-0.5", children: [_jsx("span", { className: `rounded-full px-2 py-0.5 text-[10px] font-medium ${release.releaseState === 'published'
                                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200'
                                                                        : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'}`, children: release.releaseState }), release.isLatest ? (_jsx("span", { className: "text-[10px] font-medium text-emerald-600 dark:text-emerald-300", children: "latest" })) : null] }) })] }, `${release.languageCode}:${release.version}`))) })] }) })] })] })) : null] }));
}
export function SdkMarketPage() {
    const client = useCatalogClient();
    const [overview, setOverview] = useState(null);
    const [languages, setLanguages] = useState([]);
    const [items, setItems] = useState([]);
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
    const [selectedSdkId, setSelectedSdkId] = useState(null);
    const loadGeneration = useRef(0);
    useEffect(() => {
        if (!client)
            return undefined;
        let cancelled = false;
        Promise.all([client.overviewRetrieve(), client.languagesList()])
            .then(([nextOverview, nextLanguages]) => {
            if (cancelled)
                return;
            setOverview(nextOverview);
            setLanguages(nextLanguages.items);
            setOverviewError('');
        })
            .catch((cause) => {
            if (!cancelled)
                setOverviewError(cause instanceof Error ? cause.message : String(cause));
        });
        return () => {
            cancelled = true;
        };
    }, [client]);
    const loadPage = useCallback(async (nextPage, append) => {
        if (!client)
            return;
        const generation = loadGeneration.current + 1;
        loadGeneration.current = generation;
        if (append)
            setLoadingMore(true);
        else
            setLoading(true);
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
            if (loadGeneration.current !== generation)
                return;
            setItems((current) => (append ? [...current, ...result.items] : result.items));
            setTotal(result.total);
            setPage(nextPage);
        }
        catch (cause) {
            if (loadGeneration.current !== generation)
                return;
            setError(cause instanceof Error ? cause.message : String(cause));
            if (!append) {
                setItems([]);
                setTotal(0);
            }
        }
        finally {
            if (loadGeneration.current === generation) {
                setLoading(false);
                setLoadingMore(false);
            }
        }
    }, [client, debouncedQuery, category, language, sdkType]);
    useEffect(() => {
        if (!client)
            return;
        void loadPage(1, false);
    }, [client, loadPage]);
    const categories = overview?.categories ?? [];
    const sdkTypeFacets = overview?.sdkTypeFacets ?? [];
    const counts = overview?.counts;
    return (_jsxs("main", { className: "mx-auto w-full max-w-[1500px] px-4 pb-16 pt-6 md:px-6", children: [_jsxs("header", { className: "mb-6 flex flex-wrap items-end justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300", children: "Developer Catalog" }), _jsx("h1", { className: "mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white", children: "SDK Market \u00B7 SDK \u5E02\u573A" }), _jsx("p", { className: "mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400", children: "Multi-language SDK families generated from every published API surface, with package coordinates and install commands." })] }), _jsxs("div", { className: "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-300", children: [_jsx(Package, { className: "h-4 w-4 text-violet-600 dark:text-violet-300" }), formatCount(counts?.sdkFamilies), " SDK families \u00B7 ", formatCount(counts?.sdkReleases), " releases \u00B7 ", formatCount(counts?.languages), " languages"] })] }), _jsxs("div", { className: "mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4", children: [_jsx(StatCard, { label: "SDK families", value: formatCount(counts?.sdkFamilies), hint: "Open, App, Backend, Internal, Custom" }), _jsx(StatCard, { label: "Language releases", value: formatCount(counts?.sdkReleases), hint: "TypeScript, Python, Java, Go, Rust, ..." }), _jsx(StatCard, { label: "Languages", value: formatCount(counts?.languages), hint: "Web, server, mobile, desktop, data" }), _jsx(StatCard, { label: "API surfaces", value: formatCount(counts?.apiSurfaces), hint: "Contracts the SDKs are generated from" })] }), overviewError ? (_jsx("div", { className: "mb-4", children: _jsx(ErrorBanner, { message: overviewError, onRetry: () => window.location.reload() }) })) : null, _jsxs("div", { className: "mb-4 flex flex-col gap-3 lg:flex-row lg:items-center", children: [_jsx(SearchField, { value: query, onChange: setQuery, placeholder: "Search SDKs, packages, modules..." }), _jsxs("label", { className: "flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400", children: [_jsx(Filter, { className: "h-3.5 w-3.5" }), _jsxs("select", { value: sdkType, onChange: (event) => setSdkType(event.target.value), className: "h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-200", children: [_jsx("option", { value: "", children: "All SDK types" }), sdkTypeFacets.map((facet) => (_jsxs("option", { value: facet.code, children: [API_SURFACE_LABELS[facet.code] ?? facet.code, " SDK (", facet.count, ")"] }, facet.code)))] })] }), _jsxs("label", { className: "flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400", children: [_jsx(TerminalSquare, { className: "h-3.5 w-3.5" }), _jsxs("select", { value: language, onChange: (event) => setLanguage(event.target.value), className: "h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-200", children: [_jsx("option", { value: "", children: "All languages" }), languages.filter((item) => item.releaseCount > 0).map((item) => (_jsxs("option", { value: item.code, children: [item.name, " (", item.releaseCount, ")"] }, item.code)))] })] })] }), _jsx("div", { className: "mb-5", children: _jsx(CategoryChips, { categories: categories, active: category, onChange: setCategory, countLabel: (item) => item.sdkCount }) }), error && items.length === 0 ? _jsx(ErrorBanner, { message: error, onRetry: () => void loadPage(1, false) }) : null, loading && items.length === 0 ? _jsx(LoadingPane, { label: "Loading SDK catalog..." }) : null, !loading && !error && items.length === 0 ? (_jsx(EmptyState, { icon: Package, title: "No SDKs match these filters", hint: "Try a different search term, category, type, or language." })) : null, _jsx("div", { className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3", children: items.map((sdk) => (_jsx(SdkCard, { sdk: sdk, onOpen: () => setSelectedSdkId(sdk.id) }, sdk.id))) }), items.length > 0 ? (_jsxs("div", { className: "mt-6 flex items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400", children: [_jsxs("span", { children: ["Showing ", formatCount(items.length), " of ", formatCount(total), " SDK families"] }), items.length < total ? _jsx(LoadMoreButton, { loading: loadingMore, onClick: () => void loadPage(page + 1, true) }) : null] })) : null, selectedSdkId ? _jsx(SdkDrawer, { sdkId: selectedSdkId, onClose: () => setSelectedSdkId(null) }) : null] }));
}
//# sourceMappingURL=DeveloperCatalog.js.map