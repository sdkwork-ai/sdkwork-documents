import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect } from 'react';
import { registerDocumentsReferenceRuntime } from "./documents-sdk-client.js";
export const APP_API_PREFIX = '/app/v3/api';
export const BACKEND_API_PREFIX = '/backend/v3/api';
export const DOCUMENTS_OPEN_API_PREFIX = '/doc/v3/api';
export const OPEN_API_PREFIX = '/v1';
export const CLOUD_API_PREFIX = '/cloud/v3/api';
const DocumentsReferenceRuntimeContext = createContext(null);
export function DocumentsReferenceRuntimeProvider({ value, children, }) {
    useEffect(() => {
        registerDocumentsReferenceRuntime(value);
    }, [value]);
    return (_jsx(DocumentsReferenceRuntimeContext.Provider, { value: value, children: children }));
}
export function useDocumentsReferenceRuntime() {
    const runtime = useContext(DocumentsReferenceRuntimeContext);
    if (!runtime) {
        throw new Error('DocumentsReferenceRuntimeProvider is required for documents reference modules.');
    }
    return runtime;
}
export function readDocumentsRuntimeEnv(name) {
    if (typeof window === 'undefined') {
        return undefined;
    }
    const value = window
        .__SDKWORK_DOCUMENTS_ENV__?.[name];
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}
export function resolveDocumentsRuntimeBoolean(name, defaultValue = false) {
    const value = readDocumentsRuntimeEnv(name);
    if (!value) {
        return defaultValue;
    }
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) {
        return true;
    }
    if (['0', 'false', 'no', 'off'].includes(normalized)) {
        return false;
    }
    return defaultValue;
}
const DEFAULT_PLAYGROUND_USER_AGENT = 'SDKWork-Documents-Playground/1.0.0';
export function resolvePlaygroundUserAgent(runtime) {
    const configured = runtime.playgroundUserAgent?.trim()
        ?? runtime.readRuntimeEnv('VITE_SDKWORK_DOCUMENTS_PLAYGROUND_USER_AGENT')?.trim();
    return configured && configured.length > 0 ? configured : DEFAULT_PLAYGROUND_USER_AGENT;
}
//# sourceMappingURL=documents-reference-runtime.js.map