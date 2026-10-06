import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect, useRef } from 'react';
import { Play, Loader2, X, CheckCircle2, XCircle, Wand2, Eraser, AlertCircle, Database, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { CopyButton, JsonSyntaxHighlight, resolvePlaygroundUserAgent, useDocumentsReferenceRuntime } from '@sdkwork/documents-pc-commons';
import { buildPortalAuthLoginRedirect, getStoredAppSessionAccessToken, getStoredAppSessionAuthToken, hasStoredPortalSession, } from '@sdkwork/documents-pc-commons/runtime';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiPlaygroundParamsTable } from './ApiPlaygroundParamsTable';
import { createApiPlaygroundInitialState, createApiPlaygroundInitialStateKey, makeApiPlaygroundEmptyRow, parseApiPlaygroundBulkRows, } from '../apiPlaygroundRows';
import { buildPlaygroundRequest, buildPlaygroundUrl } from '../playgroundRequest';
import { sendPlaygroundRequest } from '../playgroundSender';
import { downloadApiPlaygroundResponse, serializeApiPlaygroundResponseData } from '../playgroundResponseDownload';
export function ApiPlayground({ endpoint, requestBaseUrl, onClose }) {
    const { t } = useTranslation();
    const documentsRuntime = useDocumentsReferenceRuntime();
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState(null);
    const [activeTab, setActiveTab] = useState('params');
    const [activeResponseTab, setActiveResponseTab] = useState('body');
    const [responseViewMode, setResponseViewMode] = useState('pretty');
    // Extract parameters
    const parameters = React.useMemo(() => endpoint.openApiOperation?.parameters || [], [endpoint.openApiOperation]);
    const requestBody = React.useMemo(() => endpoint.openApiOperation?.requestBody, [endpoint.openApiOperation]);
    const initialStateKey = createApiPlaygroundInitialStateKey(endpoint);
    const initialState = React.useMemo(() => createApiPlaygroundInitialState(endpoint), [initialStateKey]);
    const [queryParams, setQueryParams] = useState(() => initialState.queryParams);
    const [pathParams, setPathParams] = useState(() => initialState.pathParams);
    const [headerParams, setHeaderParams] = useState(() => initialState.headerParams);
    const [bodyValue, setBodyValue] = useState(() => initialState.bodyValue);
    const [authType, setAuthType] = useState('current_user');
    const [apiKey, setApiKey] = useState('');
    const [errors, setErrors] = useState({});
    const [showHiddenHeaders, setShowHiddenHeaders] = useState(false);
    const hiddenHeaders = [
        { key: 'Accept', value: '*/*' },
        { key: 'Accept-Encoding', value: 'gzip, deflate, br' },
        { key: 'Connection', value: 'keep-alive' },
        { key: 'Content-Type', value: 'application/json' },
        { key: 'User-Agent', value: resolvePlaygroundUserAgent(documentsRuntime) },
    ];
    const textareaRef = useRef(null);
    const lineNumbersRef = useRef(null);
    const customRowSequenceRef = useRef(0);
    const nextCustomRow = (location, enabled = false) => {
        customRowSequenceRef.current += 1;
        return makeApiPlaygroundEmptyRow(location, customRowSequenceRef.current, enabled);
    };
    useEffect(() => {
        customRowSequenceRef.current = 0;
        setQueryParams(initialState.queryParams);
        setPathParams(initialState.pathParams);
        setHeaderParams(initialState.headerParams);
        setBodyValue(initialState.bodyValue);
        setActiveTab(initialState.activeTab);
    }, [initialState, initialStateKey]);
    const handleQueryParamChange = (id, field, value) => {
        if (errors[id]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        }
        setQueryParams(prev => {
            const newParams = [...prev];
            const index = newParams.findIndex(p => p.id === id);
            if (index === -1)
                return prev;
            newParams[index] = { ...newParams[index], [field]: value };
            // If we edited the last (empty) row, enable it and add a new empty row
            if (index === newParams.length - 1 && (field === 'key' || field === 'value') && value !== '') {
                newParams[index].enabled = true;
                newParams.push(nextCustomRow('query'));
            }
            return newParams;
        });
    };
    const handleRemoveQueryParam = (id) => {
        setQueryParams(prev => prev.filter(p => p.id !== id));
    };
    const handleHeaderParamChange = (id, field, value) => {
        if (errors[id]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        }
        setHeaderParams(prev => {
            const newParams = [...prev];
            const index = newParams.findIndex(p => p.id === id);
            if (index === -1)
                return prev;
            newParams[index] = { ...newParams[index], [field]: value };
            if (index === newParams.length - 1 && (field === 'key' || field === 'value') && value !== '') {
                newParams[index].enabled = true;
                newParams.push(nextCustomRow('header'));
            }
            return newParams;
        });
    };
    const handleRemoveHeaderParam = (id) => {
        setHeaderParams(prev => prev.filter(p => p.id !== id));
    };
    const handlePathParamChange = (id, value) => {
        if (errors[id]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        }
        setPathParams(prev => prev.map(p => p.id === id ? { ...p, value } : p));
    };
    const handleBeautify = () => {
        try {
            if (!bodyValue.trim())
                return;
            const parsed = JSON.parse(bodyValue);
            setBodyValue(JSON.stringify(parsed, null, 2));
        }
        catch (e) {
            // Ignore if invalid JSON
        }
    };
    const handleSendAndDownload = async () => {
        downloadApiPlaygroundResponse(await handleSend());
    };
    const handleClear = () => {
        setBodyValue('');
    };
    const handleScroll = () => {
        if (textareaRef.current && lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };
    const buildUrl = () => {
        return buildPlaygroundUrl({
            baseUrl: requestBaseUrl,
            endpoint,
            pathParams,
            queryParams,
        });
    };
    const handleSend = async () => {
        if (authType === 'current_user' && !hasStoredPortalSession()) {
            navigate(buildPortalAuthLoginRedirect(location));
            return null;
        }
        const authToken = getStoredAppSessionAuthToken();
        const accessToken = getStoredAppSessionAccessToken();
        const request = buildPlaygroundRequest({
            baseUrl: requestBaseUrl,
            endpoint,
            pathParams,
            queryParams,
            headerParams,
            bodyValue,
            authType,
            accessToken,
            apiKey,
            authToken,
        });
        if (request.ok === false) {
            setErrors(request.errors);
            setActiveTab(request.activeTab);
            setActiveResponseTab('body');
            setResponse(request.response);
            return request.response;
        }
        setLoading(true);
        setErrors({});
        setActiveResponseTab('body');
        try {
            const nextResponse = await sendPlaygroundRequest(request.url, request.requestInit);
            setResponse(nextResponse);
            return nextResponse;
        }
        finally {
            setLoading(false);
        }
    };
    const methodColors = {
        GET: 'text-blue-600 dark:text-blue-400',
        POST: 'text-green-600 dark:text-green-400',
        PUT: 'text-amber-600 dark:text-amber-400',
        DELETE: 'text-red-600 dark:text-red-400',
        PATCH: 'text-purple-600 dark:text-purple-400',
    };
    const methodColor = methodColors[endpoint.method] || 'text-slate-600 dark:text-slate-400';
    const getStatusColor = (status) => {
        if (status >= 200 && status < 300)
            return 'text-[#00c853] dark:text-[#00e676]';
        if (status >= 300 && status < 400)
            return 'text-[#2962ff] dark:text-[#448aff]';
        if (status >= 400 && status < 500)
            return 'text-[#ff6d00] dark:text-[#ff9100]';
        return 'text-[#d50000] dark:text-[#ff1744]';
    };
    const lineCount = bodyValue.split('\n').length;
    const responseBodyText = response ? serializeApiPlaygroundResponseData(response.data) : '';
    const responseBodyLineCount = Math.max(1, responseBodyText.split('\n').length);
    return (_jsxs(_Fragment, { children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: onClose, className: "fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" }), _jsxs(motion.div, { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' }, transition: { type: 'spring', damping: 25, stiffness: 200 }, className: "fixed inset-y-0 left-0 z-[101] w-full md:w-[1000px] xl:w-[1200px] max-w-[100vw] bg-white dark:bg-[#0d1117] shadow-2xl flex flex-col border-r border-slate-200 dark:border-white/10 font-sans", children: [_jsxs("div", { className: "flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d1117]", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex flex-col", children: [_jsx("div", { className: "flex items-center gap-2 mb-1", children: _jsx("span", { className: "text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-sm", children: "API Playground" }) }), _jsx("span", { className: "text-lg font-semibold text-slate-800 dark:text-slate-200", children: endpoint.name })] }), _jsxs("button", { type: "button", className: "flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded transition-colors ml-2", children: [_jsx(Database, { className: "w-3.5 h-3.5" }), t('common.actions.saveResponse')] })] }), _jsx("button", { type: "button", onClick: onClose, className: "p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors", title: t('common.actions.closeDrawer'), children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsx("div", { className: "px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d1117]", children: _jsxs("div", { className: "flex items-stretch bg-white dark:bg-[#0d1117] border border-slate-300 dark:border-white/20 rounded-md overflow-hidden shadow-sm focus-within:ring-1 focus-within:ring-[#006ce5] focus-within:border-[#006ce5] transition-all", children: [_jsxs("div", { className: `flex items-center justify-center gap-1.5 px-4 py-2.5 text-[13px] font-bold uppercase tracking-wider border-r border-slate-300 dark:border-white/20 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 cursor-pointer transition-colors ${methodColor}`, children: [endpoint.method, _jsx(ChevronDown, { className: "w-3.5 h-3.5 opacity-70" })] }), _jsx("div", { className: "flex-1 flex items-center px-4 py-2.5 text-[14px] font-mono text-slate-800 dark:text-slate-200 overflow-x-auto hide-scrollbar bg-transparent select-all", children: buildUrl() }), _jsx(CopyButton, { text: buildUrl(), label: t('common.actions.copyUrl'), copiedLabel: t('common.actions.urlCopied'), className: "px-3 py-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center justify-center border-r border-slate-300 dark:border-white/20 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10", title: t('common.actions.copyUrl') }), _jsxs("div", { className: "flex shrink-0 relative group/send", children: [_jsxs("button", { type: "button", onClick: handleSend, disabled: loading, className: "px-6 py-2.5 bg-[#006ce5] hover:bg-[#005bb5] text-white text-[13px] font-semibold transition-colors flex items-center gap-2 disabled:opacity-70 rounded-l", children: [loading ? _jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : _jsx(Play, { className: "w-3.5 h-3.5 fill-current" }), t('common.actions.send')] }), _jsx("button", { type: "button", disabled: loading, "aria-label": t('common.actions.openSendOptions'), className: "px-2 py-2.5 bg-[#006ce5] hover:bg-[#005bb5] text-white border-l border-white/20 transition-colors disabled:opacity-70 flex items-center justify-center rounded-r", children: _jsx(ChevronDown, { className: "w-4 h-4" }) }), _jsx("div", { className: "absolute top-full right-0 mt-1 w-48 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/10 rounded-md shadow-lg opacity-0 invisible group-hover/send:opacity-100 group-hover/send:visible group-focus-within/send:opacity-100 group-focus-within/send:visible transition-all z-50 py-1", children: _jsx("button", { type: "button", onClick: handleSendAndDownload, className: "w-full text-left px-4 py-2 text-[13px] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors", children: t('common.actions.sendAndDownload') }) })] })] }) }), _jsxs("div", { className: "flex items-center px-6 pt-2 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d1117] gap-6", children: [_jsxs("button", { type: "button", onClick: () => setActiveTab('params'), className: `py-2.5 text-[13px] font-semibold border-b-2 transition-colors relative ${activeTab === 'params' ? 'border-[#ff6c37] text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`, children: [t('common.actions.params'), parameters.filter((p) => p.in === 'query' || p.in === 'path').length > 0 && _jsx("span", { className: `ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'params' ? 'bg-[#ff6c37]/10 text-[#ff6c37]' : 'bg-slate-100 dark:bg-white/10 text-slate-500'}`, children: parameters.filter((p) => p.in === 'query' || p.in === 'path').length })] }), _jsxs("button", { type: "button", onClick: () => setActiveTab('headers'), className: `py-2.5 text-[13px] font-semibold border-b-2 transition-colors relative ${activeTab === 'headers' ? 'border-[#ff6c37] text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`, children: [t('common.actions.headers'), headerParams.filter(p => p.enabled && p.key).length > 0 && _jsx("span", { className: `ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'headers' ? 'bg-[#ff6c37]/10 text-[#ff6c37]' : 'bg-slate-100 dark:bg-white/10 text-slate-500'}`, children: headerParams.filter(p => p.enabled && p.key).length })] }), _jsx("button", { type: "button", onClick: () => setActiveTab('auth'), className: `py-2.5 text-[13px] font-semibold border-b-2 transition-colors ${activeTab === 'auth' ? 'border-[#ff6c37] text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`, children: t('common.actions.authorization') }), requestBody && (_jsx("button", { type: "button", onClick: () => setActiveTab('body'), className: `py-2.5 text-[13px] font-semibold border-b-2 transition-colors ${activeTab === 'body' ? 'border-[#ff6c37] text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`, children: t('common.actions.body') }))] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-6 bg-white dark:bg-[#0d1117] custom-scrollbar", children: [activeTab === 'params' && (_jsxs("div", { className: "space-y-8", children: [_jsx(ApiPlaygroundParamsTable, { title: "Query Params", params: queryParams, errors: errors, onChange: handleQueryParamChange, onRemove: handleRemoveQueryParam, onBulkEdit: (text) => {
                                            setQueryParams(parseApiPlaygroundBulkRows(text, 'query'));
                                        } }), _jsx(ApiPlaygroundParamsTable, { title: "Path Variables", params: pathParams, errors: errors, onChange: (id, field, value) => {
                                            if (field === 'value' && typeof value === 'string') {
                                                handlePathParamChange(id, value);
                                            }
                                        }, onRemove: () => { }, hideEnabled: true })] })), activeTab === 'headers' && (_jsxs("div", { className: "space-y-8", children: [_jsx(ApiPlaygroundParamsTable, { title: "Headers", params: headerParams, errors: errors, onChange: handleHeaderParamChange, onRemove: handleRemoveHeaderParam, onBulkEdit: (text) => {
                                            setHeaderParams(parseApiPlaygroundBulkRows(text, 'header'));
                                        } }), _jsxs("div", { className: "mt-6", children: [_jsxs("button", { type: "button", onClick: () => setShowHiddenHeaders(!showHiddenHeaders), className: "flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-md", children: [_jsx(ChevronDown, { className: `w-3.5 h-3.5 transition-transform ${showHiddenHeaders ? 'rotate-180' : ''}` }), _jsxs("span", { children: [hiddenHeaders.length, " ", t('common.actions.hidden')] })] }), showHiddenHeaders && (_jsx("div", { className: "mt-3 border border-slate-200 dark:border-white/10 rounded-md overflow-hidden opacity-70", children: _jsxs("table", { className: "w-full text-left border-collapse", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#161b22]", children: [_jsx("th", { className: "w-10 px-2 py-2 border-r border-slate-200 dark:border-white/10 text-center" }), _jsx("th", { className: "px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-white/10 w-[30%]", children: "Key" }), _jsx("th", { className: "px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-white/10 w-[30%]", children: "Value" }), _jsx("th", { className: "px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 w-[40%]", children: "Description" })] }) }), _jsx("tbody", { children: hiddenHeaders.map((h, i) => (_jsxs("tr", { className: "border-b border-slate-200 dark:border-white/10 bg-slate-50/30 dark:bg-[#161b22]/30", children: [_jsx("td", { className: "px-2 py-1.5 border-r border-slate-200 dark:border-white/10 text-center align-middle", children: _jsx("input", { type: "checkbox", checked: true, disabled: true, className: "rounded border-slate-300 text-blue-600 opacity-50 cursor-not-allowed" }) }), _jsx("td", { className: "border-r border-slate-200 dark:border-white/10 p-0", children: _jsx("input", { type: "text", value: h.key, readOnly: true, className: "w-full h-full px-3 py-2 text-[13px] bg-transparent font-mono text-slate-700 dark:text-slate-300 cursor-default" }) }), _jsx("td", { className: "border-r border-slate-200 dark:border-white/10 p-0", children: _jsx("input", { type: "text", value: h.value, readOnly: true, className: "w-full h-full px-3 py-2 text-[13px] bg-transparent font-mono text-slate-700 dark:text-slate-300 cursor-default" }) }), _jsx("td", { className: "p-0", children: _jsx("input", { type: "text", value: "Auto-generated", readOnly: true, className: "w-full h-full px-3 py-2 text-[13px] bg-transparent text-slate-500 cursor-default italic" }) })] }, i))) })] }) }))] })] })), activeTab === 'auth' && (_jsxs("div", { className: "max-w-xl", children: [_jsxs("div", { className: "mb-6", children: [_jsx("label", { className: "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2", children: "Auth Type" }), _jsxs("select", { value: authType, onChange: (e) => setAuthType(e.target.value), className: "w-full max-w-[280px] bg-white dark:bg-[#0d1117] border border-slate-300 dark:border-white/20 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#006ce5] transition-shadow cursor-pointer", children: [_jsx("option", { value: "current_user", children: "Current Logged-in User" }), _jsx("option", { value: "api_key", children: "Bearer Token" })] })] }), authType === 'api_key' ? (_jsxs(motion.div, { initial: { opacity: 0, y: 5 }, animate: { opacity: 1, y: 0 }, className: "space-y-4", children: [_jsx("div", { className: "p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 rounded-lg mb-4", children: _jsxs("p", { className: "text-[13px] text-amber-800 dark:text-amber-400/90 leading-relaxed", children: ["The token will be sent in the ", _jsx("code", { className: "font-mono bg-amber-100 dark:bg-amber-900/30 px-1 py-0.5 rounded", children: "Authorization" }), " header as a Bearer token."] }) }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2", children: "Token" }), _jsx("input", { type: "password", value: apiKey, onChange: (e) => setApiKey(e.target.value), placeholder: "Enter your API Key (sk-...)", className: "w-full bg-white dark:bg-[#0d1117] border border-slate-300 dark:border-white/20 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#006ce5] font-mono transition-shadow" })] })] })) : (_jsxs(motion.div, { initial: { opacity: 0, y: 5 }, animate: { opacity: 1, y: 0 }, className: "p-5 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-lg flex items-start gap-3", children: [_jsx("div", { className: "mt-0.5", children: _jsx(CheckCircle2, { className: "w-5 h-5 text-[#006ce5] dark:text-blue-400" }) }), _jsxs("div", { children: [_jsx("h5", { className: "text-sm font-semibold text-slate-900 dark:text-slate-200 mb-1.5", children: "Using Current Session" }), _jsx("p", { className: "text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed", children: "Requests will be automatically authenticated using your current login session. The system will include your session cookies and any stored access tokens automatically. No manual key entry is required." })] })] }))] })), activeTab === 'body' && requestBody && (_jsxs("div", { className: "h-full flex flex-col border border-slate-200 dark:border-white/10 rounded-md overflow-hidden", children: [_jsxs("div", { className: "flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-[#161b22] border-b border-slate-200 dark:border-white/10", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400", children: [_jsxs("label", { className: "flex items-center gap-1.5 cursor-not-allowed opacity-50", children: [_jsx("input", { type: "radio", name: "bodyType", disabled: true, className: "w-3 h-3" }), " none"] }), _jsxs("label", { className: "flex items-center gap-1.5 cursor-not-allowed opacity-50", children: [_jsx("input", { type: "radio", name: "bodyType", disabled: true, className: "w-3 h-3" }), " form-data"] }), _jsxs("label", { className: "flex items-center gap-1.5 cursor-not-allowed opacity-50", children: [_jsx("input", { type: "radio", name: "bodyType", disabled: true, className: "w-3 h-3" }), " x-www-form-urlencoded"] }), _jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer text-slate-900 dark:text-white font-medium", children: [_jsx("input", { type: "radio", name: "bodyType", checked: true, readOnly: true, className: "w-3 h-3 accent-[#ff6c37]" }), " raw"] }), _jsxs("label", { className: "flex items-center gap-1.5 cursor-not-allowed opacity-50", children: [_jsx("input", { type: "radio", name: "bodyType", disabled: true, className: "w-3 h-3" }), " binary"] }), _jsxs("label", { className: "flex items-center gap-1.5 cursor-not-allowed opacity-50", children: [_jsx("input", { type: "radio", name: "bodyType", disabled: true, className: "w-3 h-3" }), " GraphQL"] })] }), _jsx("div", { className: "w-px h-4 bg-slate-300 dark:bg-white/20 mx-1" }), _jsxs("button", { type: "button", className: "flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-slate-200 dark:hover:bg-white/10 rounded transition-colors", children: ["JSON ", _jsx(ChevronDown, { className: "w-3 h-3 opacity-70" })] })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsxs("button", { type: "button", onClick: handleBeautify, className: "flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 rounded transition-colors", title: t('common.actions.formatJson'), children: [_jsx(Wand2, { className: "w-3.5 h-3.5" }), t('common.actions.beautify')] }), _jsx("div", { className: "w-px h-4 bg-slate-300 dark:bg-white/20 mx-1" }), _jsx(CopyButton, { text: bodyValue, label: t('common.actions.copy'), copiedLabel: t('common.actions.copied'), variant: "inline", className: "flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 rounded transition-colors", iconClassName: "w-3.5 h-3.5", title: t('common.actions.copyToClipboard') }), _jsxs("button", { type: "button", onClick: handleClear, className: "flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-200 dark:hover:bg-white/10 rounded transition-colors", title: t('common.actions.clearBody'), children: [_jsx(Eraser, { className: "w-3.5 h-3.5" }), t('common.actions.clear')] })] })] }), _jsxs("div", { className: `flex-1 relative bg-white dark:bg-[#0d1117] flex min-h-[200px] ${errors['body'] ? 'ring-2 ring-inset ring-red-500 bg-red-50/10 dark:bg-red-900/10' : ''}`, children: [_jsx("div", { ref: lineNumbersRef, className: "w-10 bg-slate-50/50 dark:bg-[#161b22]/50 border-r border-slate-200 dark:border-white/10 flex flex-col items-end py-3 pr-2 text-[12px] font-mono text-slate-400 select-none overflow-hidden", children: Array.from({ length: Math.max(1, lineCount) }).map((_, i) => (_jsx("div", { className: "h-[21px] leading-[21px]", children: i + 1 }, i))) }), _jsx("textarea", { ref: textareaRef, value: bodyValue, onChange: (e) => {
                                                    setBodyValue(e.target.value);
                                                    if (errors['body']) {
                                                        setErrors(prev => {
                                                            const next = { ...prev };
                                                            delete next['body'];
                                                            return next;
                                                        });
                                                    }
                                                }, onScroll: handleScroll, className: "flex-1 w-full h-full bg-transparent p-3 text-[13px] font-mono text-slate-800 dark:text-slate-300 focus:outline-none resize-none custom-scrollbar leading-[21px]", spellCheck: false, wrap: "off" }), errors['body'] && (_jsxs("div", { className: "absolute top-3 right-4 flex items-center gap-1.5 text-red-500 text-xs font-medium bg-white dark:bg-[#0d1117] px-2 py-1 rounded shadow-sm border border-red-200 dark:border-red-900/50", children: [_jsx(AlertCircle, { className: "w-3.5 h-3.5" }), "Body is required"] }))] })] }))] }), _jsxs("div", { className: "h-[50%] min-h-[350px] border-t-2 border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d1117] flex flex-col relative", children: [_jsx("div", { className: "absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full cursor-ns-resize z-10" }), _jsxs("div", { className: "flex items-center justify-between px-6 py-2 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d1117]", children: [_jsxs("div", { className: "flex items-center gap-6", children: [_jsx("span", { className: "text-[13px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider", children: "Response" }), response && (_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("button", { type: "button", onClick: () => setActiveResponseTab('body'), className: `text-[13px] font-semibold pb-2 border-b-2 transition-colors ${activeResponseTab === 'body' ? 'border-[#ff6c37] text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`, style: { marginBottom: '-9px' }, children: t('common.actions.body') }), _jsx("button", { type: "button", className: "text-[13px] font-semibold pb-2 border-b-2 border-transparent text-slate-400 cursor-not-allowed", style: { marginBottom: '-9px' }, title: t('common.actions.cookiesUnavailable'), children: t('common.actions.cookies') }), _jsxs("button", { type: "button", onClick: () => setActiveResponseTab('headers'), className: `text-[13px] font-semibold pb-2 border-b-2 transition-colors ${activeResponseTab === 'headers' ? 'border-[#ff6c37] text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`, style: { marginBottom: '-9px' }, children: [t('common.actions.headers'), " ", _jsx("span", { className: `ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${activeResponseTab === 'headers' ? 'bg-[#ff6c37]/10 text-[#ff6c37]' : 'bg-slate-100 dark:bg-white/10 text-slate-500'}`, children: response.headers?.length || 0 })] }), _jsx("button", { type: "button", className: "text-[13px] font-semibold pb-2 border-b-2 border-transparent text-slate-400 cursor-not-allowed", style: { marginBottom: '-9px' }, title: t('common.actions.testResultsUnavailable'), children: t('common.actions.testResults') })] }))] }), response && (_jsxs("div", { className: "flex items-center gap-4", children: [activeResponseTab === 'body' && (_jsxs("div", { className: "flex items-center gap-1 mr-2 bg-slate-100 dark:bg-[#161b22] p-0.5 rounded-md border border-slate-200 dark:border-white/10", children: [_jsx("button", { type: "button", onClick: () => setResponseViewMode('pretty'), className: `px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${responseViewMode === 'pretty' ? 'bg-white dark:bg-[#0d1117] text-slate-800 dark:text-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`, children: t('common.actions.pretty') }), _jsx("button", { type: "button", onClick: () => setResponseViewMode('raw'), className: `px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${responseViewMode === 'raw' ? 'bg-white dark:bg-[#0d1117] text-slate-800 dark:text-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`, children: t('common.actions.raw') })] })), _jsxs("div", { className: "flex items-center gap-4 text-[13px] font-medium mr-4", children: [_jsxs("span", { className: `flex items-center gap-1.5 ${getStatusColor(response.status)}`, children: [response.status >= 200 && response.status < 300 ? _jsx(CheckCircle2, { className: "w-3.5 h-3.5" }) : _jsx(XCircle, { className: "w-3.5 h-3.5" }), _jsx("span", { className: "text-slate-500 dark:text-slate-400", children: "Status:" }), _jsxs("span", { className: "font-bold", children: [response.status, " ", response.statusText] })] }), _jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "text-slate-500 dark:text-slate-400", children: "Time:" }), _jsxs("span", { className: "text-[#00c853] dark:text-[#00e676] font-bold", children: [response.time, " ms"] })] }), _jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "text-slate-500 dark:text-slate-400", children: "Size:" }), _jsx("span", { className: "text-[#00c853] dark:text-[#00e676] font-bold", children: formatBytes(response.size) })] })] }), _jsxs("div", { className: "flex items-center gap-2 border-l border-slate-200 dark:border-white/10 pl-4", children: [_jsxs("button", { type: "button", onClick: () => {
                                                            downloadApiPlaygroundResponse(response);
                                                        }, className: "flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 rounded transition-colors", title: t('common.actions.saveResponse'), children: [_jsx(Database, { className: "w-3.5 h-3.5" }), t('common.actions.saveResponse')] }), _jsx("div", { className: "w-px h-4 bg-slate-300 dark:bg-white/20 mx-1" }), _jsx(CopyButton, { text: responseBodyText, label: t('common.actions.copy'), copiedLabel: t('common.actions.copied'), variant: "inline", className: "flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 rounded transition-colors", iconClassName: "w-3.5 h-3.5", title: t('common.actions.copyResponse') })] })] }))] }), _jsx("div", { className: "flex-1 p-6 overflow-y-auto custom-scrollbar relative bg-white dark:bg-[#0d1117]", children: response ? (activeResponseTab === 'body' ? (_jsxs("div", { className: "flex", children: [_jsx("div", { className: "w-10 flex flex-col items-end py-0 pr-3 text-[12px] font-mono text-slate-300 dark:text-slate-600 select-none border-r border-slate-100 dark:border-white/5 mr-4", children: Array.from({ length: responseBodyLineCount }).map((_, i) => (_jsx("div", { className: "h-[21px] leading-[21px]", children: i + 1 }, i))) }), _jsx("pre", { className: `text-[13px] font-mono leading-[21px] whitespace-pre-wrap break-all flex-1 ${responseViewMode === 'raw' ? 'text-slate-800 dark:text-slate-300' : ''}`, children: responseViewMode === 'pretty' && typeof response.data === 'object' ? (_jsx(JsonSyntaxHighlight, { value: response.data })) : (responseBodyText) })] })) : (_jsx("div", { className: "border border-slate-200 dark:border-white/10 rounded-md overflow-hidden bg-white dark:bg-[#0d1117]", children: _jsxs("table", { className: "w-full text-left border-collapse", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#161b22]", children: [_jsx("th", { className: "px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-white/10 w-1/3", children: "Key" }), _jsx("th", { className: "px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 w-2/3", children: "Value" })] }) }), _jsxs("tbody", { children: [response.headers.map(([key, value], idx) => (_jsxs("tr", { className: "border-b border-slate-200 dark:border-white/10 hover:bg-slate-50/50 dark:hover:bg-white/[0.02]", children: [_jsx("td", { className: "px-4 py-2 text-[13px] font-mono text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-white/10 bg-slate-50/30 dark:bg-[#161b22]/30", children: key }), _jsx("td", { className: "px-4 py-2 text-[13px] font-mono text-slate-800 dark:text-slate-200 break-all", children: value })] }, idx))), response.headers.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 2, className: "px-4 py-4 text-center text-sm text-slate-500", children: "No headers returned" }) }))] })] }) }))) : (_jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-white dark:bg-[#0d1117]", children: [_jsx("div", { className: "w-32 h-32 mb-6 rounded-full bg-slate-50 dark:bg-[#161b22] flex items-center justify-center border border-slate-100 dark:border-white/5 shadow-sm", children: _jsxs("div", { className: "relative", children: [_jsx(Database, { className: "w-12 h-12 text-slate-300 dark:text-slate-600" }), _jsx("div", { className: "absolute -bottom-2 -right-2 bg-white dark:bg-[#0d1117] rounded-full p-1 shadow-sm border border-slate-100 dark:border-white/5", children: _jsx(Play, { className: "w-5 h-5 text-[#006ce5] fill-current" }) })] }) }), _jsx("span", { className: "text-base font-medium text-slate-600 dark:text-slate-300 mb-2", children: "Enter the URL and click Send to get a response" }), _jsx("span", { className: "text-[13px] text-slate-400 dark:text-slate-500 max-w-sm text-center leading-relaxed", children: "Configure your request parameters, headers, and authorization, then hit Send to see the API response here." })] })) })] })] })] }));
}
function formatBytes(bytes, decimals = 2) {
    if (!+bytes)
        return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
//# sourceMappingURL=ApiPlayground.js.map