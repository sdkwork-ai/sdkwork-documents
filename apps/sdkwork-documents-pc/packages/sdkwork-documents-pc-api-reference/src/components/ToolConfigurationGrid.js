import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { IDE_TOOL_CATEGORY_META, IDE_TOOL_CATEGORY_ORDER, groupIdeToolProfilesByCategory, } from '../ideToolProfiles';
import { ToolProtocolBadge } from './ToolProtocolBadge';
export function ToolConfigurationGrid({ onSelectTool }) {
    const { t } = useTranslation();
    const groupedProfiles = groupIdeToolProfilesByCategory();
    return (_jsx("div", { className: "space-y-6 mb-8", children: IDE_TOOL_CATEGORY_ORDER.map((category) => {
            const profiles = groupedProfiles[category];
            const meta = IDE_TOOL_CATEGORY_META[category];
            return (_jsxs("div", { children: [_jsx("h4", { className: "text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3", children: t(meta.labelKey, meta.fallbackLabel) }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3", children: profiles.map((profile) => (_jsx(ToolConfigurationCard, { profile: profile, onSelect: () => onSelectTool(`tool-${profile.id}`) }, profile.id))) })] }, category));
        }) }));
}
function ToolConfigurationCard({ profile, onSelect, }) {
    const { t } = useTranslation();
    return (_jsxs("button", { type: "button", onClick: onSelect, className: "group rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] p-4 text-left transition-all hover:border-emerald-400 hover:shadow-sm dark:hover:border-emerald-500/40", children: [_jsxs("div", { className: "flex items-start justify-between gap-3 mb-2", children: [_jsx("div", { className: "font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400", children: t(profile.labelKey, profile.fallbackLabel) }), _jsx(ToolProtocolBadge, { profile: profile, label: t(profile.protocolKey, profile.fallbackProtocol) })] }), _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2", children: t(profile.summaryKey, profile.fallbackSummary) }), _jsx("p", { className: "mt-3 text-xs font-mono text-slate-500 dark:text-slate-500 truncate", children: t(profile.configPathKey, profile.fallbackConfigPath) })] }));
}
//# sourceMappingURL=ToolConfigurationGrid.js.map