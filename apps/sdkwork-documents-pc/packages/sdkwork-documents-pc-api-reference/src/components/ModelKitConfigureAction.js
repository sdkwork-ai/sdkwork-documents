import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from 'react';
import { Download, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { detectModelKitInstalled, openModelKitConfigure, resolveModelKitBaseUrl, resolveModelKitDownloadUrl, } from '../modelKitIntegration';
export function ModelKitConfigureAction({ profile, endpoints, apiKeyPlaceholder = '<YOUR_API_KEY>', providerName = 'Cloud Router', variant = 'inline', }) {
    const { t } = useTranslation();
    const [status, setStatus] = useState('unknown');
    const [isLaunching, setIsLaunching] = useState(false);
    const [downloadPrompt, setDownloadPrompt] = useState(false);
    const refreshInstallStatus = useCallback(async () => {
        setStatus('checking');
        const installed = await detectModelKitInstalled();
        setStatus(installed ? 'installed' : 'missing');
    }, []);
    useEffect(() => {
        void refreshInstallStatus();
    }, [refreshInstallStatus]);
    const handleConfigure = async () => {
        setIsLaunching(true);
        setDownloadPrompt(false);
        try {
            const result = await openModelKitConfigure({
                apiKey: apiKeyPlaceholder,
                baseUrl: resolveModelKitBaseUrl(profile.endpointKind, endpoints),
                name: `${providerName} - ${t(profile.labelKey, profile.fallbackLabel)}`,
                description: t('docs.modelkit.configureDescription', 'Configured from developer documentation'),
                supportedTools: [profile.modelKitToolId],
            });
            if (!result.opened) {
                setDownloadPrompt(true);
                setStatus('missing');
                return;
            }
            setStatus('installed');
        }
        finally {
            setIsLaunching(false);
        }
    };
    const statusLabel = status === 'checking'
        ? t('docs.modelkit.statusChecking', 'Checking local ModelKit...')
        : status === 'installed'
            ? t('docs.modelkit.statusInstalled', 'ModelKit detected')
            : status === 'missing'
                ? t('docs.modelkit.statusMissing', 'ModelKit not detected')
                : t('docs.modelkit.statusUnknown', 'ModelKit status unknown');
    const statusClassName = status === 'installed'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20'
        : status === 'checking'
            ? 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-300 dark:border-white/10'
            : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20';
    const containerClassName = variant === 'card'
        ? 'rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] p-4'
        : 'rounded-xl border border-emerald-200/80 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/5 p-4';
    return (_jsxs("div", { className: containerClassName, children: [_jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2 mb-1", children: [_jsxs("span", { className: "inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-white", children: [_jsx(Sparkles, { className: "h-4 w-4 text-emerald-500" }), "ModelKit"] }), _jsx("span", { className: `inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusClassName}`, children: statusLabel })] }), _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400 leading-relaxed", children: t('docs.modelkit.toolActionHint', 'Detect ModelKit locally and open the desktop client to apply this tool configuration automatically.') }), _jsx("p", { className: "mt-2 text-xs text-slate-500 dark:text-slate-500 leading-relaxed", children: t('docs.modelkit.apiKeyReminder', 'Replace <YOUR_API_KEY> with a real gateway API key before configuring. ModelKit cannot infer your key automatically from the docs page.') })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2 shrink-0", children: [_jsxs("button", { type: "button", onClick: () => void handleConfigure(), disabled: isLaunching, className: "inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-70", children: [isLaunching ? _jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : _jsx(ExternalLink, { className: "h-4 w-4" }), t('docs.modelkit.configureWithModelKit', 'Configure with ModelKit')] }), _jsxs("a", { href: resolveModelKitDownloadUrl(), target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-white/20 dark:hover:text-white", children: [_jsx(Download, { className: "h-4 w-4" }), t('docs.modelkit.downloadModelKit', 'Download ModelKit')] })] })] }), downloadPrompt ? (_jsx("p", { className: "mt-3 text-sm text-amber-800 dark:text-amber-300/90 leading-relaxed", children: t('docs.modelkit.downloadPrompt', 'ModelKit was not detected on this device. A download page has been opened. Install ModelKit first, then click configure again.') })) : null] }));
}
//# sourceMappingURL=ModelKitConfigureAction.js.map