import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
function parseSteps(raw) {
    return raw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.replace(/^\d+\.\s*/, ''));
}
export function ToolConfigurationGuide({ profile }) {
    const { t } = useTranslation();
    const hint = t(profile.hintKey, profile.fallbackHint);
    const steps = parseSteps(t(profile.stepsKey, profile.fallbackSteps));
    const verify = profile.verifyKey
        ? t(profile.verifyKey, profile.fallbackVerify ?? '')
        : '';
    return (_jsxs("div", { className: "mb-6 space-y-4", children: [_jsxs("div", { className: "flex gap-3 rounded-xl border border-blue-200 bg-blue-50/80 p-4 dark:border-blue-500/20 dark:bg-blue-500/10", children: [_jsx(AlertCircle, { className: "h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" }), _jsx("p", { className: "text-sm text-blue-900 dark:text-blue-200/90 leading-relaxed", children: hint })] }), steps.length > 0 ? (_jsxs("div", { className: "rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] p-4", children: [_jsx("h4", { className: "text-sm font-semibold text-slate-900 dark:text-white mb-3", children: t('docs.page.toolConfigStepsTitle', 'Configuration steps') }), _jsx("ol", { className: "space-y-2", children: steps.map((step) => (_jsxs("li", { className: "flex gap-2.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed", children: [_jsx(CheckCircle2, { className: "h-4 w-4 shrink-0 text-emerald-500 mt-0.5" }), _jsx("span", { children: step })] }, step))) })] })) : null, verify ? (_jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400 leading-relaxed", children: verify })) : null] }));
}
//# sourceMappingURL=ToolConfigurationGuide.js.map