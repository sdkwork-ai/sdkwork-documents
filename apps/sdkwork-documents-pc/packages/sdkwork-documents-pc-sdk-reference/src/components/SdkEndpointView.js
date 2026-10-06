import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Play, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CopyButton } from '@sdkwork/documents-pc-commons';
import { ApiPlayground } from '@sdkwork/documents-pc-api-reference';
import { buildSdkEndpointDocumentation, } from '../sdkEndpointDocumentation';
import { generateSdkReferenceDocumentation, } from '../sdkReferenceGenerationService';
import { normalizeSdkReferenceLanguage } from '../sdkReferenceRuntime';
function flattenSdkParameters(parameters = [], parentPath = '') {
    return parameters.flatMap((parameter) => {
        const name = parentPath && parameter.name === '*'
            ? `${parentPath}.*`
            : parentPath
                ? `${parentPath}.${parameter.name}`
                : parameter.name;
        const path = parameter.type.startsWith('array<') && parameter.children?.length
            ? `${name}[]`
            : name;
        return [
            { parameter, path },
            ...flattenSdkParameters(parameter.children ?? [], path),
        ];
    });
}
export function SdkEndpointView({ endpoint, requestBaseUrl, sdkData, language, sdkConfig, spec }) {
    const { t } = useTranslation();
    const [showPlayground, setShowPlayground] = useState(false);
    const [generatedDocs, setGeneratedDocs] = useState(null);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const normalizedLanguage = normalizeSdkReferenceLanguage(language);
    const localDocumentation = buildSdkEndpointDocumentation(endpoint, sdkData, normalizedLanguage);
    useEffect(() => {
        if (!spec) {
            setGeneratedDocs(null);
            return;
        }
        let cancelled = false;
        const fetchDocumentation = async () => {
            setLoadingDocs(true);
            try {
                const result = await generateSdkReferenceDocumentation({
                    spec,
                    language: normalizedLanguage,
                    config: {
                        ...sdkConfig,
                        endpointPath: endpoint.path,
                        endpointMethod: endpoint.method,
                        operationId: endpoint.openApiOperation?.operationId,
                    },
                });
                if (!cancelled) {
                    setGeneratedDocs(result);
                }
            }
            catch {
                if (!cancelled) {
                    setGeneratedDocs(null);
                }
            }
            finally {
                if (!cancelled) {
                    setLoadingDocs(false);
                }
            }
        };
        fetchDocumentation();
        return () => {
            cancelled = true;
        };
    }, [
        spec,
        normalizedLanguage,
        sdkConfig,
        endpoint.path,
        endpoint.method,
        endpoint.openApiOperation?.operationId,
    ]);
    const codeDefinition = generatedDocs?.methodDefinition || localDocumentation.codeDefinition;
    const exampleUsage = generatedDocs?.usageExample || localDocumentation.exampleUsage;
    const methodName = localDocumentation.methodName;
    return (_jsxs("div", { className: "w-full px-4 md:px-8 py-8 md:py-12 pb-32 space-y-12", children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-xs font-bold px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400", children: endpoint.method }), _jsx("code", { className: "text-sm px-2 py-1 rounded bg-slate-100 dark:bg-white/5 font-mono text-slate-700 dark:text-slate-300", children: endpoint.path })] }), _jsx("h1", { className: "text-3xl font-bold text-slate-900 dark:text-white", children: endpoint.name })] }), _jsx("div", { children: _jsxs("button", { onClick: () => setShowPlayground(true), className: "flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm shadow-sm", children: [_jsx(Play, { className: "w-4 h-4 fill-current" }), t('common.actions.tryItOut')] }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h3", { className: "text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider", children: [_jsx("span", { className: "text-emerald-500", children: '</>' }), " CODE DEFINITION"] }), _jsx(CopyButton, { text: codeDefinition, label: t('common.actions.copy'), copiedLabel: t('common.actions.copied'), variant: "inline", className: "flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors border border-slate-200 dark:border-white/10 rounded-md px-2 py-1 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10", iconClassName: "w-3.5 h-3.5" })] }), _jsxs("div", { className: "rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-slate-50 dark:bg-[#1e1e1e]", children: [_jsxs("div", { className: "px-4 py-2 border-b border-slate-200 dark:border-white/5 flex items-center gap-2", children: [_jsx("span", { className: "text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-white/5 px-2 py-1 rounded uppercase", children: localDocumentation.languageLabel }), loadingDocs && _jsx(Loader2, { className: "w-3 h-3 animate-spin text-slate-400" })] }), _jsx("pre", { className: `p-6 overflow-x-auto text-sm font-mono leading-relaxed text-slate-700 dark:text-slate-300 transition-opacity duration-300 ${loadingDocs ? 'opacity-50' : 'opacity-100'}`, children: codeDefinition })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h3", { className: "text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider", children: [_jsx("span", { className: "text-amber-500", children: '{ }' }), " EXAMPLE USAGE"] }), _jsx(CopyButton, { text: exampleUsage, label: t('common.actions.copy'), copiedLabel: t('common.actions.copied'), variant: "inline", className: "flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors border border-slate-200 dark:border-white/10 rounded-md px-2 py-1 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10", iconClassName: "w-3.5 h-3.5" })] }), _jsx("div", { className: "rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-slate-50 dark:bg-[#1e1e1e]", children: _jsx("pre", { className: `p-6 overflow-x-auto text-sm font-mono leading-relaxed text-slate-700 dark:text-slate-300 transition-opacity duration-300 ${loadingDocs ? 'opacity-50' : 'opacity-100'}`, children: exampleUsage }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("h3", { className: "text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider", children: [_jsx("span", { className: "text-blue-500", children: '>_' }), " PARAMETERS AND RETURNS"] }), _jsxs("div", { className: "rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-[#111]", children: [_jsxs("div", { className: "px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center gap-4 bg-slate-50 dark:bg-white/5", children: [_jsx("span", { className: "font-bold text-slate-900 dark:text-white", children: methodName }), _jsx("span", { className: "text-xs px-2 py-1 rounded bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300", children: "Function" })] }), _jsxs("table", { className: "w-full text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-slate-200 dark:border-white/10", children: [_jsx("th", { className: "px-6 py-3 font-medium text-slate-500 w-1/4", children: "PARAMETER" }), _jsx("th", { className: "px-6 py-3 font-medium text-slate-500 w-1/4", children: "TYPE" }), _jsx("th", { className: "px-6 py-3 font-medium text-slate-500 w-1/8", children: "REQUIRED" }), _jsx("th", { className: "px-6 py-3 font-medium text-slate-500", children: "DESCRIPTION" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-white/5", children: localDocumentation.parameters.length > 0 ? (flattenSdkParameters(localDocumentation.parameters).map((row) => (_jsx(SdkParameterRow, { parameter: row.parameter, path: row.path }, row.path)))) : (_jsx("tr", { children: _jsx("td", { colSpan: 4, className: "px-6 py-4 text-sm text-slate-500 dark:text-slate-400", children: "This method does not define a JSON request body." }) })) }), _jsx("tfoot", { className: "border-t border-slate-200 dark:border-white/10 border-double border-t-2", children: _jsxs("tr", { children: [_jsx("td", { colSpan: 1, className: "px-6 py-4 font-medium text-slate-500", children: "RETURNS" }), _jsx("td", { colSpan: 3, className: "px-6 py-4 font-mono font-bold text-blue-600 dark:text-blue-400 text-right", children: localDocumentation.responseType })] }) })] }), localDocumentation.returns.length > 0 && (_jsxs("div", { className: "border-t border-slate-200 dark:border-white/10 px-6 py-4", children: [_jsx("div", { className: "mb-3 text-xs font-bold uppercase tracking-wider text-slate-500", children: "Return Fields" }), _jsx("div", { className: "divide-y divide-slate-100 rounded-lg border border-slate-100 dark:divide-white/5 dark:border-white/10", children: flattenSdkParameters(localDocumentation.returns).map(({ parameter, path }) => (_jsxs("div", { className: "grid grid-cols-1 gap-2 px-4 py-3 text-sm md:grid-cols-[minmax(160px,1fr)_minmax(160px,1fr)_2fr]", children: [_jsx("code", { className: "font-semibold text-teal-600 dark:text-teal-400", children: path }), _jsx("code", { className: "text-emerald-600 dark:text-emerald-400", children: parameter.type }), _jsx("span", { className: "text-slate-600 dark:text-slate-400", children: parameter.desc })] }, path))) })] }))] })] }), _jsx(AnimatePresence, { children: showPlayground && (_jsx(ApiPlayground, { endpoint: endpoint, requestBaseUrl: requestBaseUrl, onClose: () => setShowPlayground(false) })) })] }));
}
function SdkParameterRow({ parameter, path }) {
    return (_jsxs("tr", { children: [_jsx("td", { className: "px-6 py-4 font-mono font-bold text-amber-600 dark:text-amber-400", children: path }), _jsx("td", { className: "px-6 py-4 font-mono text-emerald-600 dark:text-emerald-400", children: parameter.type }), _jsx("td", { className: "px-6 py-4", children: parameter.required ? (_jsx("span", { className: "text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400", children: "YES" })) : (_jsx("span", { className: "text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400", children: "NO" })) }), _jsx("td", { className: "px-6 py-4 text-slate-600 dark:text-slate-400", children: parameter.desc })] }));
}
//# sourceMappingURL=SdkEndpointView.js.map