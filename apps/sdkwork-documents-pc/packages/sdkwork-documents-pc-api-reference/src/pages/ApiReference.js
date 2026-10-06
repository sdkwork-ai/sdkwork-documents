import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { MethodBadge } from '../components/MethodBadge';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiEndpointView } from '../components/ApiEndpointView';
import { ChevronRight, Search, Loader2, X, Clock3, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createReferenceSidebarGroupElementId, isReferenceSidebarGroupCollapsed, toggleReferenceSidebarGroup, filterReferenceSidebarTree, documentsShellLayout, } from '@sdkwork/documents-pc-commons';
import { AdaptiveTabs } from '@sdkwork/documents-pc-commons/adaptive-tabs';
import { buildApiCategorySidebarTree, createApiReferenceSystemSummaries, getApiSystemDisplayName, getDefaultApiReferenceEndpoint, loadApiReferenceSchemaTabs, loadApiReferenceSystem, } from '../apiReferenceSchemaTabs';
export function ApiReference() {
    const { t } = useTranslation();
    // State for navigation
    const [activeSystem, setActiveSystem] = useState('');
    const [activeEndpointId, setActiveEndpointId] = useState('');
    const [apiData, setApiData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [loadingSystemIds, setLoadingSystemIds] = useState(new Set());
    const [systemLoadErrors, setSystemLoadErrors] = useState(new Set());
    const [collapsedGroups, setCollapsedGroups] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const loadedSystemIdsRef = useRef(new Set());
    const systemLoadPromisesRef = useRef(new Map());
    const loadGenerationRef = useRef(0);
    const activateSystem = (system) => {
        setActiveSystem(system.id);
        const defaultEndpoint = getDefaultApiReferenceEndpoint(system);
        setActiveEndpointId(defaultEndpoint?.id ?? '');
    };
    const loadAndActivateSystem = async (system) => {
        if (system.status === 'planned' || loadedSystemIdsRef.current.has(system.id)) {
            activateSystem(system);
            return;
        }
        const loadGeneration = loadGenerationRef.current;
        let loadPromise = systemLoadPromisesRef.current.get(system.id);
        if (!loadPromise) {
            setLoadingSystemIds((current) => new Set(current).add(system.id));
            setSystemLoadErrors((current) => {
                const next = new Set(current);
                next.delete(system.id);
                return next;
            });
            loadPromise = loadApiReferenceSystem(system.schemaTab);
            systemLoadPromisesRef.current.set(system.id, loadPromise);
        }
        try {
            const loadedSystem = await loadPromise;
            if (loadGeneration !== loadGenerationRef.current) {
                return;
            }
            loadedSystemIdsRef.current.add(loadedSystem.id);
            setApiData((current) => current.map((item) => (item.id === loadedSystem.id ? loadedSystem : item)));
            activateSystem(loadedSystem);
        }
        catch {
            if (loadGeneration !== loadGenerationRef.current) {
                return;
            }
            setSystemLoadErrors((current) => new Set(current).add(system.id));
        }
        finally {
            if (loadGeneration !== loadGenerationRef.current) {
                return;
            }
            systemLoadPromisesRef.current.delete(system.id);
            setLoadingSystemIds((current) => {
                const next = new Set(current);
                next.delete(system.id);
                return next;
            });
        }
    };
    const loadOpenApi = async () => {
        const loadGeneration = loadGenerationRef.current + 1;
        loadGenerationRef.current = loadGeneration;
        setLoading(true);
        setLoadError(false);
        setSystemLoadErrors(new Set());
        loadedSystemIdsRef.current.clear();
        systemLoadPromisesRef.current.clear();
        try {
            const manifest = await loadApiReferenceSchemaTabs();
            const systems = createApiReferenceSystemSummaries(manifest);
            if (systems.length === 0) {
                throw new Error('API schema tabs document has no systems');
            }
            const initialSummary = systems[0];
            const initialSystem = initialSummary.status === 'planned'
                ? initialSummary
                : await loadApiReferenceSystem(initialSummary.schemaTab);
            if (loadGeneration !== loadGenerationRef.current) {
                return;
            }
            if (initialSystem.status !== 'planned') {
                loadedSystemIdsRef.current.add(initialSystem.id);
            }
            systems[0] = initialSystem;
            setApiData(systems);
            activateSystem(initialSystem);
            setLoading(false);
        }
        catch {
            if (loadGeneration !== loadGenerationRef.current) {
                return;
            }
            setLoading(false);
            setLoadError(true);
        }
    };
    useEffect(() => {
        void loadOpenApi();
        return () => {
            loadGenerationRef.current += 1;
        };
    }, []);
    const activeSystemData = apiData.find(s => s.id === activeSystem);
    const sidebarTree = useMemo(() => {
        const tree = activeSystemData ? buildApiCategorySidebarTree(activeSystemData.categories) : [];
        return filterReferenceSidebarTree(tree, searchQuery);
    }, [activeSystemData, searchQuery]);
    // Find the active endpoint
    let activeEndpoint = null;
    if (activeSystemData) {
        for (const category of activeSystemData.categories) {
            const endpoint = category.endpoints.find(e => e.id === activeEndpointId);
            if (endpoint) {
                activeEndpoint = endpoint;
                break;
            }
        }
        // Fallback to first endpoint if not found in current system
        if (!activeEndpoint) {
            activeEndpoint = getDefaultApiReferenceEndpoint(activeSystemData);
        }
    }
    const activeSystemDisplayName = activeSystemData ? getApiSystemDisplayName(activeSystemData) : t('api.title');
    const activeSystemIsPlanned = activeSystemData?.status === 'planned';
    const handleEndpointClick = (endpointId) => {
        setActiveEndpointId(endpointId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const handleCategoryToggle = (categoryId) => {
        setCollapsedGroups((current) => toggleReferenceSidebarGroup(current, activeSystem, categoryId));
    };
    const renderEndpointItem = (endpoint, compact = false) => {
        const isActive = activeEndpointId === endpoint.id;
        return (_jsx("li", { children: _jsxs("button", { onClick: () => handleEndpointClick(endpoint.id), className: `w-full flex items-center gap-3 text-left px-2 py-2 text-[13px] rounded-lg transition-all ${compact ? 'pl-3' : ''} ${isActive
                    ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 font-medium shadow-sm ring-1 ring-slate-200 dark:ring-white/10'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`, children: [_jsx(MethodBadge, { method: endpoint.method }), _jsx("span", { className: "truncate", children: endpoint.name })] }) }, endpoint.id));
    };
    const renderSidebarNode = (node) => {
        const isCollapsed = isReferenceSidebarGroupCollapsed(collapsedGroups, activeSystem, node.id);
        const groupElementId = createReferenceSidebarGroupElementId('api-reference-sidebar-group', activeSystem, node.id);
        return (_jsxs("div", { className: "space-y-2", children: [_jsxs("button", { type: "button", onClick: () => handleCategoryToggle(node.id), "aria-expanded": !isCollapsed, "aria-controls": groupElementId, className: "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-bold uppercase tracking-wider text-slate-900 transition-colors hover:bg-white dark:text-white dark:hover:bg-white/5", children: [_jsx(ChevronRight, { className: `h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${isCollapsed ? '' : 'rotate-90'}`, "aria-hidden": "true" }), _jsx("span", { className: "min-w-0 flex-1 truncate", children: node.name }), _jsx("span", { className: "shrink-0 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-slate-600 dark:bg-white/10 dark:text-slate-300", children: node.totalEndpoints })] }), _jsx(AnimatePresence, { initial: false, children: !isCollapsed && (_jsxs(motion.div, { id: groupElementId, initial: { height: 0, opacity: 0 }, animate: { height: 'auto', opacity: 1 }, exit: { height: 0, opacity: 0 }, transition: { duration: 0.16, ease: 'easeOut' }, className: "space-y-2 overflow-hidden", children: [node.endpoints.length > 0 && (_jsx("ul", { className: "space-y-0.5", children: node.endpoints.map((endpoint) => renderEndpointItem(endpoint)) })), node.children.map((child) => renderSidebarChildNode(child, 1))] })) })] }, node.id));
    };
    const renderSidebarChildNode = (node, depth) => {
        const isCollapsed = isReferenceSidebarGroupCollapsed(collapsedGroups, activeSystem, node.id);
        const groupElementId = createReferenceSidebarGroupElementId('api-reference-sidebar-subgroup', activeSystem, node.id);
        return (_jsxs("div", { className: "space-y-1", children: [_jsxs("button", { type: "button", onClick: () => handleCategoryToggle(node.id), "aria-expanded": !isCollapsed, "aria-controls": groupElementId, className: "mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] font-semibold text-slate-500 transition-colors hover:bg-white hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white", children: [_jsx(ChevronRight, { className: `h-3 w-3 shrink-0 text-slate-400 transition-transform ${isCollapsed ? '' : 'rotate-90'}`, "aria-hidden": "true" }), _jsx("span", { className: "min-w-0 flex-1 truncate", children: node.name }), _jsx("span", { className: "shrink-0 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-slate-600 dark:bg-white/10 dark:text-slate-300", children: node.totalEndpoints })] }), _jsx(AnimatePresence, { initial: false, children: !isCollapsed && (_jsxs(motion.div, { id: groupElementId, initial: { height: 0, opacity: 0 }, animate: { height: 'auto', opacity: 1 }, exit: { height: 0, opacity: 0 }, transition: { duration: 0.16, ease: 'easeOut' }, className: "space-y-2 overflow-hidden", children: [node.endpoints.length > 0 && (_jsx("ul", { className: "space-y-0.5", children: node.endpoints.map((endpoint) => renderEndpointItem(endpoint)) })), node.children.map((child) => renderSidebarChildNode(child, depth + 1))] })) })] }, node.id));
    };
    if (loading) {
        return (_jsx("div", { className: documentsShellLayout.pageRootCentered, children: _jsx(Loader2, { className: "w-8 h-8 animate-spin text-blue-500" }) }));
    }
    if (loadError) {
        return (_jsx("div", { className: documentsShellLayout.pageRootCentered, children: _jsxs("div", { className: "flex flex-col items-center gap-4 max-w-md text-center", children: [_jsx(AlertCircle, { className: "w-10 h-10 text-red-500" }), _jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: t('api.loadError.title', 'Failed to load API schema') }), _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400", children: t('api.loadError.description', 'The backend service may be starting up or temporarily unavailable. Please try again.') }), _jsxs("button", { onClick: loadOpenApi, className: "flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), t('api.loadError.retry', 'Retry')] })] }) }));
    }
    return (_jsxs("div", { className: documentsShellLayout.pageRootColumn, children: [_jsx("div", { className: documentsShellLayout.stickySubHeader, children: _jsx("div", { className: "w-full min-w-0 px-4 md:px-6 lg:px-8", children: _jsx(AdaptiveTabs, { items: apiData.map((system) => {
                            const Icon = system.icon;
                            return {
                                id: system.id,
                                label: getApiSystemDisplayName(system),
                                busy: loadingSystemIds.has(system.id),
                                content: (_jsxs(_Fragment, { children: [_jsx(Icon, { className: "w-4 h-4" }), getApiSystemDisplayName(system), loadingSystemIds.has(system.id) && (_jsx(Loader2, { className: "h-3.5 w-3.5 animate-spin text-blue-500" })), systemLoadErrors.has(system.id) && (_jsx(AlertCircle, { className: "h-3.5 w-3.5 text-red-500", "aria-label": t('api.loadError.retry', 'Retry') })), system.status === 'planned' && (_jsx("span", { className: "rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-300", children: t('api.planned.badge', 'Planned') }))] })),
                            };
                        }), activeId: activeSystem, onSelect: (systemId) => {
                            const system = apiData.find((item) => item.id === systemId);
                            if (system) {
                                void loadAndActivateSystem(system);
                            }
                        }, moreLabel: t('api.tabs.more', 'More'), ariaLabel: t('api.title', 'API Reference') }) }) }), _jsxs("div", { className: "flex flex-1 w-full mx-auto", children: [_jsxs("aside", { className: `relative hidden w-[360px] max-w-[360px] basis-[360px] shrink-0 flex-col border-r border-slate-200 bg-slate-50/50 dark:border-white/10 dark:bg-[#0a0a0a] md:flex ${documentsShellLayout.stickySidebarBelowSubHeader}`, children: [_jsx("div", { className: "p-4 border-b border-slate-200 dark:border-white/10", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" }), _jsx("input", { type: "text", placeholder: t('api.searchPlaceholder', 'Search endpoints...'), value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "w-full bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-lg pl-9 pr-8 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors shadow-sm" }), searchQuery && (_jsx("button", { onClick: () => setSearchQuery(''), className: "absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors", children: _jsx(X, { className: "w-3.5 h-3.5" }) }))] }) }), _jsx("div", { className: "flex-1 overflow-y-auto custom-scrollbar p-4", children: _jsx(AnimatePresence, { mode: "wait", children: _jsxs(motion.div, { initial: { opacity: 0, x: -10 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 10 }, transition: { duration: 0.2 }, className: "space-y-8 pb-8", children: [sidebarTree.length === 0 && searchQuery ? (_jsx("div", { className: "text-center py-8 text-slate-500 dark:text-slate-400 text-sm", children: t('api.notFound', 'No endpoints found.') })) : (sidebarTree.map((node) => renderSidebarNode(node))), sidebarTree.length === 0 && activeSystemIsPlanned && (_jsx("div", { className: "rounded-lg border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400", children: t('api.planned.sidebar', 'API groups in planning do not expose endpoints yet.') }))] }, activeSystem) }) })] }), _jsx("main", { className: "flex-1 min-w-0 p-6 md:p-10 lg:p-12 pb-24 overflow-x-hidden", children: _jsxs("div", { className: "max-w-full", children: [_jsxs("div", { className: "mb-12 pb-8 border-b border-slate-200 dark:border-white/10", children: [_jsx("h1", { className: "text-4xl font-bold text-slate-900 dark:text-white mb-4", children: activeSystemDisplayName }), _jsx("p", { className: "text-lg text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed", children: activeSystemData?.description || `${t('api.description')} Explore the ${activeSystemDisplayName} endpoints using the sidebar.` })] }), _jsx("div", { className: "space-y-16", children: _jsx(AnimatePresence, { mode: "wait", children: activeSystemIsPlanned ? (_jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.2 }, className: "flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center dark:border-white/10 dark:bg-white/5", children: [_jsx(Clock3, { className: "mb-5 h-10 w-10 text-blue-500 dark:text-blue-400" }), _jsx("h2", { className: "text-2xl font-semibold text-slate-900 dark:text-white", children: t('api.planned.title', 'API group in planning') }), _jsx("p", { className: "mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400", children: activeSystemData?.description || t('api.planned.description', 'This API group is reserved for upcoming aggregation APIs. Endpoints will appear here after the OpenAPI contract is implemented.') }), activeSystemData?.serviceGroups.length ? (_jsx("div", { className: "mt-8 grid w-full max-w-4xl gap-3 text-left sm:grid-cols-2 xl:grid-cols-3", children: activeSystemData.serviceGroups.map((group) => (_jsxs("div", { className: "rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#101010]", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("h3", { className: "truncate text-sm font-semibold text-slate-900 dark:text-white", children: group.name }), _jsx("p", { className: "mt-1 font-mono text-[11px] text-slate-400", children: group.code })] }), group.providerCodes.length > 0 && (_jsx("span", { className: "shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-300", children: group.providerCodes.length }))] }), group.description && (_jsx("p", { className: "mt-3 line-clamp-3 text-xs leading-5 text-slate-500 dark:text-slate-400", children: group.description })), group.providerCodes.length > 0 && (_jsx("div", { className: "mt-3 flex flex-wrap gap-1.5", children: group.providerCodes.map((providerCode) => (_jsx("span", { className: "rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600 dark:bg-white/10 dark:text-slate-300", children: providerCode }, providerCode))) })), group.operations.length > 0 && (_jsx("p", { className: "mt-3 line-clamp-2 font-mono text-[11px] leading-5 text-slate-400", children: group.operations.join(' / ') }))] }, group.code))) })) : null] }, `${activeSystem}-planned`)) : activeEndpoint && activeSystemData ? (_jsx(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.2 }, children: _jsx(ApiEndpointView, { endpoint: activeEndpoint, requestBaseUrl: activeSystemData.requestBaseUrl }) }, activeEndpoint.id)) : (_jsx("div", { className: "text-center py-20 text-slate-500", children: t('api.selectEndpoint', 'Select an endpoint from the sidebar to view its documentation.') })) }) })] }) })] })] }));
}
//# sourceMappingURL=ApiReference.js.map