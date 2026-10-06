import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { MethodBadge } from '../components/MethodBadge';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Terminal, Code, Coffee, Box, BookOpen, ChevronRight, Download, Gem, FileCode2, Hash, Cog, Smartphone, Search, X, RefreshCw, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSdkDataForSystem } from '../data/sdkData';
import { CopyButton, createReferenceSidebarGroupElementId, isReferenceSidebarGroupCollapsed, toggleReferenceSidebarGroup, filterReferenceSidebarTree, } from '@sdkwork/documents-pc-commons';
import { AdaptiveTabs } from '@sdkwork/documents-pc-commons/adaptive-tabs';
import { resolveDocumentsRuntimeBoolean } from '@sdkwork/documents-pc-commons/runtime';
import { SdkEndpointView } from '../components/SdkEndpointView';
import { getApiSystemDisplayName } from '@sdkwork/documents-pc-api-reference/apiReferenceSchemaTabs';
import { generateSdkReferenceArchive, generateSdkReferenceDocumentation, } from '../sdkReferenceGenerationService';
import { buildSdkReferenceSidebarTree, createGeneratedSdkToolConfig, getGeneratedSdkMetadataForSystem, isGeneratedSdkArchiveLanguage, loadSdkReferenceSystem, loadSdkReferenceSystemSummaries, normalizeSdkReferenceLanguage, } from '../sdkReferenceRuntime';
const IconMap = {
    Terminal,
    Code,
    TerminalSquare: Terminal,
    Coffee,
    Gem,
    FileCode2,
    Hash,
    Cog,
    Smartphone
};
const localToolApiEnabled = resolveDocumentsRuntimeBoolean('VITE_TOOL_API_ENABLED', false);
export function SdkReference() {
    const { t } = useTranslation();
    const [activeSystem, setActiveSystem] = useState('llm-open-api');
    const [activeSdkId, setActiveSdkId] = useState('typescript');
    const [activeEndpointId, setActiveEndpointId] = useState('overview');
    const [apiData, setApiData] = useState([]);
    const [activeSpec, setActiveSpec] = useState(null);
    const [activeSchemaUrl, setActiveSchemaUrl] = useState('/openapi.json');
    const [readmeContent, setReadmeContent] = useState(null);
    const [loadingReadme, setLoadingReadme] = useState(false);
    const [activeSdkConfig, setActiveSdkConfig] = useState(null);
    const [downloadError, setDownloadError] = useState(null);
    const [collapsedGroups, setCollapsedGroups] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [loadError, setLoadError] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingSystemIds, setLoadingSystemIds] = useState(new Set());
    const [systemLoadErrors, setSystemLoadErrors] = useState(new Set());
    const loadedSystemIdsRef = useRef(new Set());
    const systemLoadPromisesRef = useRef(new Map());
    const loadGenerationRef = useRef(0);
    const sdkData = getSdkDataForSystem(activeSystem);
    const activeSdk = sdkData.find(s => s.id === activeSdkId) || sdkData[0];
    const activeLanguage = normalizeSdkReferenceLanguage(activeSdk.id);
    const activateSystem = (system) => {
        setActiveSystem(system.id);
        setActiveEndpointId('overview');
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
            loadPromise = loadSdkReferenceSystem(system);
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
    const loadSdkData = async () => {
        const loadGeneration = loadGenerationRef.current + 1;
        loadGenerationRef.current = loadGeneration;
        setLoading(true);
        setLoadError(false);
        setSystemLoadErrors(new Set());
        loadedSystemIdsRef.current.clear();
        systemLoadPromisesRef.current.clear();
        try {
            const systems = await loadSdkReferenceSystemSummaries();
            if (systems.length === 0) {
                throw new Error('SDK reference manifest has no systems');
            }
            const initialSummary = systems.find((system) => system.id === activeSystem) ?? systems[0];
            const initialSystem = initialSummary.status === 'planned'
                ? initialSummary
                : await loadSdkReferenceSystem(initialSummary);
            if (loadGeneration !== loadGenerationRef.current) {
                return;
            }
            if (initialSystem.status !== 'planned') {
                loadedSystemIdsRef.current.add(initialSystem.id);
            }
            const initialIndex = systems.findIndex((system) => system.id === initialSystem.id);
            systems[initialIndex] = initialSystem;
            setApiData(systems);
            activateSystem(initialSystem);
            setLoading(false);
        }
        catch {
            if (loadGeneration !== loadGenerationRef.current) {
                return;
            }
            setActiveSpec(null);
            setReadmeContent(null);
            setLoadError(true);
            setLoading(false);
        }
    };
    useEffect(() => {
        void loadSdkData();
        return () => {
            loadGenerationRef.current += 1;
        };
    }, []);
    const activeSystemData = apiData.find(s => s.id === activeSystem);
    useEffect(() => {
        const schemaUrl = activeSystemData?.schemaUrl ?? '/openapi.json';
        setActiveSchemaUrl(schemaUrl);
        setActiveSpec(activeSystemData?.openApiSpec ?? activeSystemData?.categories[0]?.endpoints[0]?.openApiSpec ?? null);
        if (activeEndpointId !== 'overview') {
            const endpointExists = activeSystemData?.categories.some((category) => (category.endpoints.some((endpoint) => endpoint.id === activeEndpointId)));
            if (!endpointExists) {
                setActiveEndpointId('overview');
            }
        }
    }, [activeSystemData, activeEndpointId]);
    useEffect(() => {
        const config = createGeneratedSdkToolConfig(activeSystem, activeLanguage, activeSchemaUrl);
        setActiveSdkConfig(config);
    }, [activeSystem, activeLanguage, activeSchemaUrl]);
    useEffect(() => {
        if (!activeSpec || !activeSdkConfig) {
            setReadmeContent(null);
            setLoadingReadme(false);
            return;
        }
        let cancelled = false;
        const loadReadme = async () => {
            setReadmeContent(null);
            setLoadingReadme(true);
            try {
                const documentation = await generateSdkReferenceDocumentation({
                    spec: activeSpec,
                    language: activeLanguage,
                    config: activeSdkConfig,
                });
                if (cancelled) {
                    return;
                }
                setReadmeContent(documentation.readme);
            }
            catch {
                if (!cancelled) {
                    setReadmeContent(null);
                }
            }
            finally {
                if (!cancelled) {
                    setLoadingReadme(false);
                }
            }
        };
        loadReadme();
        return () => {
            cancelled = true;
        };
    }, [activeSpec, activeLanguage, activeSdkConfig]);
    const extractSectionCode = (readme, sectionName) => {
        if (!readme)
            return null;
        const regex = new RegExp(`## ${sectionName}\\n+[\\s\\S]*?\`\`\`[a-z]*\\n([\\s\\S]*?)\\n\`\`\``, 'i');
        const match = readme.match(regex);
        return match ? match[1].trim() : null;
    };
    const extractUsageExamples = (readme) => {
        if (!readme)
            return null;
        const regex = /## Usage Examples\n+([\s\S]*?)(?=\n## |\n$)/i;
        const match = readme.match(regex);
        if (!match)
            return null;
        const codeBlocks = [];
        const codeRegex = /```[a-z]*\n([\s\S]*?)\n```/gi;
        let codeMatch;
        while ((codeMatch = codeRegex.exec(match[1])) !== null) {
            codeBlocks.push(codeMatch[1].trim());
        }
        return codeBlocks.length > 0 ? codeBlocks.join('\n\n') : null;
    };
    const generatedInstallCode = extractSectionCode(readmeContent, 'Installation');
    const generatedInitCode = extractSectionCode(readmeContent, 'Quick Start');
    const generatedExampleCode = extractUsageExamples(readmeContent);
    const displayInstallCode = generatedInstallCode || activeSdk.installCommand;
    const displayInitCode = generatedInitCode || (activeSdk.importCode + '\n\n' + activeSdk.initCode);
    const displayExampleCode = generatedExampleCode || activeSdk.exampleCode;
    const handleDownloadSdk = async (sdk) => {
        if (!activeSpec || !localToolApiEnabled) {
            return;
        }
        setDownloadError(null);
        try {
            const language = normalizeSdkReferenceLanguage(sdk.id);
            const config = createGeneratedSdkToolConfig(activeSystem, language, activeSchemaUrl);
            const generatedSdkMetadata = getGeneratedSdkMetadataForSystem(activeSystem);
            const archive = await generateSdkReferenceArchive({
                spec: activeSpec,
                language,
                config,
            });
            const blob = base64ToBlob(archive.contentBase64, archive.contentType || 'application/zip');
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = archive.fileName
                || `${generatedSdkMetadata.packageName.replace(/^@/, '').replace(/\//g, '-')}-${language}-${generatedSdkMetadata.version}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        catch (error) {
            setDownloadError(error instanceof Error && error.message ? error.message : 'Failed to generate SDK.');
        }
    };
    const sidebarTree = activeSystemData ? filterReferenceSidebarTree(buildSdkReferenceSidebarTree(activeSystemData.categories), searchQuery) : [];
    const activeEndpoint = activeSystemData?.categories.flatMap(c => c.endpoints).find(e => e.id === activeEndpointId);
    const handleEndpointClick = (id) => {
        setActiveEndpointId(id);
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
        const groupElementId = createReferenceSidebarGroupElementId('sdk-reference-sidebar-group', activeSystem, node.id);
        return (_jsxs("div", { className: "space-y-2", children: [_jsxs("button", { type: "button", onClick: () => handleCategoryToggle(node.id), "aria-expanded": !isCollapsed, "aria-controls": groupElementId, className: "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-bold uppercase tracking-wider text-slate-900 transition-colors hover:bg-white dark:text-white dark:hover:bg-white/5", children: [_jsx(ChevronRight, { className: `h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${isCollapsed ? '' : 'rotate-90'}`, "aria-hidden": "true" }), _jsx("span", { className: "min-w-0 flex-1 truncate", children: node.name }), _jsx("span", { className: "shrink-0 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-slate-600 dark:bg-white/10 dark:text-slate-300", children: node.totalEndpoints })] }), _jsx(AnimatePresence, { initial: false, children: !isCollapsed && (_jsxs(motion.div, { id: groupElementId, initial: { height: 0, opacity: 0 }, animate: { height: 'auto', opacity: 1 }, exit: { height: 0, opacity: 0 }, transition: { duration: 0.16, ease: 'easeOut' }, className: "space-y-2 overflow-hidden", children: [node.endpoints.length > 0 && (_jsx("ul", { className: "space-y-0.5", children: node.endpoints.map((endpoint) => renderEndpointItem(endpoint)) })), node.children.map((child) => renderSidebarChildNode(child, 1))] })) })] }, node.id));
    };
    const renderSidebarChildNode = (node, depth) => {
        const isCollapsed = isReferenceSidebarGroupCollapsed(collapsedGroups, activeSystem, node.id);
        const groupElementId = createReferenceSidebarGroupElementId('sdk-reference-sidebar-subgroup', activeSystem, node.id);
        return (_jsxs("div", { className: "space-y-1", children: [_jsxs("button", { type: "button", onClick: () => handleCategoryToggle(node.id), "aria-expanded": !isCollapsed, "aria-controls": groupElementId, className: "mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] font-semibold text-slate-500 transition-colors hover:bg-white hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white", children: [_jsx(ChevronRight, { className: `h-3 w-3 shrink-0 text-slate-400 transition-transform ${isCollapsed ? '' : 'rotate-90'}`, "aria-hidden": "true" }), _jsx("span", { className: "min-w-0 flex-1 truncate", children: node.name }), _jsx("span", { className: "shrink-0 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-slate-600 dark:bg-white/10 dark:text-slate-300", children: node.totalEndpoints })] }), _jsx(AnimatePresence, { initial: false, children: !isCollapsed && (_jsxs(motion.div, { id: groupElementId, initial: { height: 0, opacity: 0 }, animate: { height: 'auto', opacity: 1 }, exit: { height: 0, opacity: 0 }, transition: { duration: 0.16, ease: 'easeOut' }, className: "space-y-2 overflow-hidden", children: [node.endpoints.length > 0 && (_jsx("ul", { className: "space-y-0.5", children: node.endpoints.map((endpoint) => renderEndpointItem(endpoint)) })), node.children.map((child) => renderSidebarChildNode(child, depth + 1))] })) })] }, node.id));
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen pt-20 bg-white dark:bg-[#0a0a0a]", children: _jsx(Loader2, { className: "w-8 h-8 animate-spin text-blue-500" }) }));
    }
    if (loadError) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen pt-20 bg-white dark:bg-[#0a0a0a]", children: _jsxs("div", { className: "flex flex-col items-center gap-4 max-w-md text-center", children: [_jsx(AlertCircle, { className: "w-10 h-10 text-red-500" }), _jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: t('sdk.loadError.title', 'Failed to load SDK schema') }), _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400", children: t('sdk.loadError.description', 'The backend service may be starting up or temporarily unavailable. Please try again.') }), _jsxs("button", { onClick: loadSdkData, className: "flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), t('sdk.loadError.retry', 'Retry')] })] }) }));
    }
    return (_jsxs("div", { className: "flex flex-col w-full min-h-screen pt-20 bg-white dark:bg-[#0a0a0a]", children: [_jsx("div", { className: "sticky top-[56px] z-40 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10", children: _jsx("div", { className: "w-full min-w-0 px-4 md:px-6 lg:px-8", children: _jsx(AdaptiveTabs, { items: apiData.map((system) => {
                            const Icon = system.icon;
                            return {
                                id: system.id,
                                label: getApiSystemDisplayName(system),
                                busy: loadingSystemIds.has(system.id),
                                content: (_jsxs(_Fragment, { children: [_jsx(Icon, { className: "w-4 h-4" }), getApiSystemDisplayName(system), loadingSystemIds.has(system.id) && (_jsx(Loader2, { className: "h-3.5 w-3.5 animate-spin text-blue-500" })), systemLoadErrors.has(system.id) && (_jsx(AlertCircle, { className: "h-3.5 w-3.5 text-red-500", "aria-label": t('sdk.loadError.retry', 'Retry') }))] })),
                            };
                        }), activeId: activeSystem, onSelect: (systemId) => {
                            const system = apiData.find((item) => item.id === systemId);
                            if (system) {
                                void loadAndActivateSystem(system);
                            }
                        }, moreLabel: t('sdk.tabs.more', 'More'), ariaLabel: t('nav.sdkReference', 'SDK Reference') }) }) }), _jsxs("div", { className: "flex flex-col md:flex-row flex-1", children: [_jsx("aside", { className: "relative w-full shrink-0 border-b border-slate-200 bg-slate-50/50 dark:border-white/10 dark:bg-[#0a0a0a] md:sticky md:top-[111px] md:h-[calc(100vh-111px)] md:w-[360px] md:max-w-[360px] md:basis-[360px] md:border-b-0 md:border-r", children: _jsxs("div", { className: "md:h-full overflow-y-auto custom-scrollbar py-6 px-6 md:py-8", children: [_jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" }), _jsx("input", { type: "text", placeholder: t('sdk.searchPlaceholder', 'Search endpoints...'), value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "w-full bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-lg pl-9 pr-8 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors shadow-sm" }), searchQuery && (_jsx("button", { onClick: () => setSearchQuery(''), className: "absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors", children: _jsx(X, { className: "w-3.5 h-3.5" }) }))] }), _jsx("div", { className: "mt-4 pt-4", children: _jsxs("button", { onClick: () => handleEndpointClick('overview'), className: `w-full flex items-center gap-3 px-2 py-2 text-[13px] rounded-lg transition-all ${activeEndpointId === 'overview'
                                                    ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 font-medium shadow-sm ring-1 ring-slate-200 dark:ring-white/10'
                                                    : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`, children: [_jsx(BookOpen, { className: "w-4 h-4" }), _jsx("span", { className: "truncate", children: t('common.actions.sdkOverview') })] }) })] }), _jsx("div", { className: "flex-1 mt-4", children: _jsx(AnimatePresence, { mode: "wait", children: _jsx(motion.div, { initial: { opacity: 0, x: -10 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 10 }, transition: { duration: 0.2 }, className: "space-y-6 pb-8", children: sidebarTree.length === 0 && searchQuery ? (_jsx("div", { className: "text-center py-8 text-slate-500 dark:text-slate-400 text-sm", children: t('sdk.notFound', 'No endpoints found.') })) : (sidebarTree.map((node) => renderSidebarNode(node))) }, activeSystem) }) })] }) }), _jsxs("main", { className: "flex-1 min-w-0 flex flex-col", children: [_jsxs("div", { className: "sticky top-[111px] z-30 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-4 md:px-8 py-3 shrink-0", children: [_jsxs("div", { className: "flex min-w-0 flex-col items-center justify-between gap-4 lg:flex-row", children: [_jsx("div", { className: "w-full min-w-0 flex-1", children: _jsx(AdaptiveTabs, { items: sdkData.map((sdk) => {
                                                        const Icon = IconMap[sdk.icon] || Box;
                                                        return {
                                                            id: sdk.id,
                                                            label: sdk.name,
                                                            content: (_jsxs(_Fragment, { children: [_jsx(Icon, { className: "h-4 w-4" }), sdk.name] })),
                                                        };
                                                    }), activeId: activeSdkId, onSelect: setActiveSdkId, moreLabel: t('sdk.tabs.more', 'More'), ariaLabel: t('sdk.languages', 'SDK languages'), variant: "pill" }) }), _jsxs("div", { className: "flex items-center gap-3 shrink-0", children: [_jsxs("a", { href: activeSdk.githubUrl, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors", children: [_jsx("svg", { viewBox: "0 0 24 24", className: "w-4 h-4 fill-current", "aria-hidden": "true", children: _jsx("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" }) }), "GitHub"] }), activeSpec && localToolApiEnabled && isGeneratedSdkArchiveLanguage(activeSdk.id) && (_jsxs("button", { onClick: () => handleDownloadSdk(activeSdk), className: "flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm", children: [_jsx(Download, { className: "w-4 h-4" }), t('common.actions.download')] }))] })] }), downloadError && (_jsxs("div", { className: "mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200", children: [_jsx(AlertCircle, { className: "mt-0.5 h-4 w-4 shrink-0" }), _jsx("span", { children: downloadError })] }))] }), _jsx("div", { className: "flex-1 overflow-y-auto", children: activeEndpointId === 'overview' ? (_jsx("div", { className: "px-4 md:px-6 lg:px-8 py-8 md:py-12 pb-32", children: _jsx(AnimatePresence, { mode: "wait", children: _jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.2 }, className: "space-y-12", children: [_jsxs("div", { children: [_jsx("div", { className: "flex items-center justify-between mb-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center", children: React.createElement(IconMap[activeSdk.icon] || Box, { className: "w-5 h-5 text-blue-600 dark:text-blue-400" }) }), _jsxs("h1", { className: "text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight", children: [activeSdk.name, " SDK"] })] }) }), _jsx("p", { className: "text-lg text-slate-600 dark:text-slate-400 leading-relaxed", children: activeSdk.description })] }), _jsxs("section", { children: [_jsxs("h2", { className: "text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2", children: [_jsx(Download, { className: "w-5 h-5 text-slate-400" }), "Installation"] }), _jsxs("div", { className: "relative group", children: [_jsx("div", { className: "absolute right-3 top-3", children: _jsx(CopyButton, { text: displayInstallCode, label: t('common.actions.copyInstallation'), copiedLabel: t('common.actions.copied'), className: "p-2 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 dark:bg-slate-800/50 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors", disabled: loadingReadme, title: t('common.actions.copyInstallation') }) }), _jsx("pre", { className: `bg-slate-50 text-slate-700 dark:bg-[#0d1117] dark:text-slate-300 p-6 rounded-2xl overflow-x-auto text-sm font-mono border border-slate-200 dark:border-slate-800 transition-opacity duration-300 ${loadingReadme ? 'opacity-50' : 'opacity-100'}`, children: _jsx("code", { children: loadingReadme ? 'Loading...' : displayInstallCode }) })] })] }), _jsxs("section", { children: [_jsxs("h2", { className: "text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2", children: [_jsx(BookOpen, { className: "w-5 h-5 text-slate-400" }), "Initialization"] }), _jsxs("div", { className: "relative group", children: [_jsx("div", { className: "absolute right-3 top-3", children: _jsx(CopyButton, { text: displayInitCode, label: t('common.actions.copyInitialization'), copiedLabel: t('common.actions.copied'), className: "p-2 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 dark:bg-slate-800/50 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors", disabled: loadingReadme, title: t('common.actions.copyInitialization') }) }), _jsx("pre", { className: `bg-slate-50 text-slate-700 dark:bg-[#0d1117] dark:text-slate-300 p-6 rounded-2xl overflow-x-auto text-sm font-mono border border-slate-200 dark:border-slate-800 transition-opacity duration-300 ${loadingReadme ? 'opacity-50' : 'opacity-100'}`, children: _jsx("code", { children: loadingReadme ? 'Loading...' : displayInitCode }) })] })] }), _jsxs("section", { children: [_jsxs("h2", { className: "text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2", children: [_jsx(Code, { className: "w-5 h-5 text-slate-400" }), "Example Usage"] }), _jsxs("div", { className: "relative group", children: [_jsx("div", { className: "absolute right-3 top-3", children: _jsx(CopyButton, { text: displayExampleCode, label: t('common.actions.copyExample'), copiedLabel: t('common.actions.copied'), className: "p-2 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 dark:bg-slate-800/50 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors", disabled: loadingReadme, title: t('common.actions.copyExample') }) }), _jsx("pre", { className: `bg-slate-50 text-slate-700 dark:bg-[#0d1117] dark:text-slate-300 p-6 rounded-2xl overflow-x-auto text-sm font-mono border border-slate-200 dark:border-slate-800 transition-opacity duration-300 ${loadingReadme ? 'opacity-50' : 'opacity-100'}`, children: _jsx("code", { children: loadingReadme ? 'Loading...' : displayExampleCode }) })] })] })] }, `${activeSystem}-${activeSdk.id}-overview`) }) })) : (activeEndpoint && activeSdkConfig && activeSystemData && (_jsx(SdkEndpointView, { endpoint: activeEndpoint, requestBaseUrl: activeSystemData.requestBaseUrl, sdkData: activeSdkConfig, language: activeSdk.id, sdkConfig: activeSdkConfig, spec: activeSpec }, activeEndpoint.id))) })] })] })] }));
}
function base64ToBlob(contentBase64, contentType) {
    const binary = atob(contentBase64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new Blob([bytes], { type: contentType });
}
//# sourceMappingURL=SdkReference.js.map