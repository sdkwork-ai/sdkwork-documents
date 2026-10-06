import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
const JSON_TOKEN_PATTERN = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g;
function formatJsonValue(value) {
    if (typeof value === 'string') {
        return value;
    }
    return JSON.stringify(value, undefined, 2);
}
function tokenClassName(token) {
    if (/^"/.test(token)) {
        if (/:$/.test(token)) {
            return 'text-[#005cc5] dark:text-[#a5d6ff] font-medium';
        }
        return 'text-[#032f62] dark:text-[#ff7b72]';
    }
    if (/^(true|false)$/.test(token)) {
        return 'text-[#d73a49] dark:text-[#ffab70] font-medium';
    }
    if (token === 'null') {
        return 'text-[#005cc5] dark:text-[#79c0ff] font-medium';
    }
    return 'text-[#098658] dark:text-[#79c0ff]';
}
export function JsonSyntaxHighlight({ value }) {
    const json = formatJsonValue(value);
    const nodes = [];
    let lastIndex = 0;
    let match;
    JSON_TOKEN_PATTERN.lastIndex = 0;
    while ((match = JSON_TOKEN_PATTERN.exec(json)) !== null) {
        if (match.index > lastIndex) {
            nodes.push(json.slice(lastIndex, match.index));
        }
        nodes.push(_jsx("span", { className: tokenClassName(match[0]), children: match[0] }, `${match.index}-${match[0]}`));
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < json.length) {
        nodes.push(json.slice(lastIndex));
    }
    return _jsx(_Fragment, { children: nodes });
}
//# sourceMappingURL=JsonSyntaxHighlight.js.map