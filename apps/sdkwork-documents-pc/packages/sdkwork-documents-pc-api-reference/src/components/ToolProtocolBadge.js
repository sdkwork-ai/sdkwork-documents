import { jsx as _jsx } from "react/jsx-runtime";
const PROTOCOL_STYLES = {
    openai: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20',
    anthropic: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20',
    gemini: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
};
export function ToolProtocolBadge({ profile, label }) {
    return (_jsx("span", { className: `inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${PROTOCOL_STYLES[profile.endpointKind]}`, children: label }));
}
//# sourceMappingURL=ToolProtocolBadge.js.map