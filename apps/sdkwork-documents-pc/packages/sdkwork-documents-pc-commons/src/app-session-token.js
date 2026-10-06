import { readApiRecord } from "./api-result.js";
import { dispatchPortalSessionChange } from "./portal-session-events.js";
const APP_SESSION_STORAGE_KEY = 'sdkwork.documents.appSession.v1';
const LEGACY_HOST_SESSION_STORAGE_KEYS = ['sdkwork.cloudRouter.appSession.v1'];
const EXPIRY_SKEW_SECONDS = 30;
let memoryToken = null;
let storageLoaded = false;
export function storeAppSessionFromResult(result) {
    const previousToken = loadStoredAppSessionToken();
    const data = readAppSessionPayload(result);
    const accessToken = readString(data, 'accessToken');
    const authToken = readString(data, 'authToken');
    const expiresAt = readOptionalExpiry(data, 'expiresAt');
    const responseRefreshToken = readString(data, 'refreshToken');
    const responseSessionId = readString(data, 'sessionId');
    const sameSession = Boolean(previousToken) &&
        (!responseSessionId || previousToken?.sessionId === responseSessionId);
    const refreshToken = responseRefreshToken || (sameSession ? previousToken?.refreshToken ?? '' : '');
    const sessionId = responseSessionId || (sameSession ? previousToken?.sessionId ?? '' : '');
    if (!accessToken || !authToken) {
        throw new Error('App session response is missing valid SDKWork IAM token data');
    }
    const stored = {
        accessToken,
        authToken,
        ...(Number.isFinite(expiresAt) ? { expiresAt } : {}),
        ...(refreshToken ? { refreshToken } : {}),
        ...(sessionId ? { sessionId } : {}),
        storedAt: currentUnixSeconds(),
    };
    memoryToken = stored;
    storageLoaded = true;
    writeBrowserStorage(stored);
    dispatchPortalSessionChange();
    return stored;
}
export function getStoredAppSessionToken(now = currentUnixSeconds()) {
    return getStoredAppSessionAuthToken(now);
}
export function getStoredAppSessionAuthToken(now = currentUnixSeconds()) {
    const token = loadStoredAppSessionToken();
    if (!token) {
        return undefined;
    }
    if (isExpired(token, now)) {
        clearStoredAppSessionToken();
        return undefined;
    }
    return token.authToken;
}
export function getStoredAppSessionAccessToken(now = currentUnixSeconds()) {
    const token = loadStoredAppSessionToken();
    if (!token) {
        return undefined;
    }
    if (isExpired(token, now)) {
        clearStoredAppSessionToken();
        return undefined;
    }
    return token.accessToken;
}
export function loadStoredAppSessionToken() {
    if (memoryToken || storageLoaded) {
        return memoryToken;
    }
    storageLoaded = true;
    const raw = readBrowserStorage();
    if (!raw) {
        return null;
    }
    try {
        const parsed = JSON.parse(raw);
        if (!isStoredAppSessionToken(parsed)) {
            clearStoredAppSessionToken();
            return null;
        }
        memoryToken = parsed;
        writeBrowserStorage(parsed);
        return parsed;
    }
    catch {
        clearStoredAppSessionToken();
        return null;
    }
}
export function clearStoredAppSessionToken() {
    memoryToken = null;
    storageLoaded = true;
    removeBrowserStorage();
    dispatchPortalSessionChange();
}
function readAppSessionPayload(result) {
    return readApiRecord(result);
}
function isExpired(token, now) {
    if (typeof token.expiresAt !== 'number') {
        return false;
    }
    return token.expiresAt <= now + EXPIRY_SKEW_SECONDS;
}
function isStoredAppSessionToken(value) {
    if (!isRecord(value)) {
        return false;
    }
    return (typeof value.accessToken === 'string' &&
        value.accessToken.length > 0 &&
        typeof value.authToken === 'string' &&
        value.authToken.length > 0 &&
        typeof value.storedAt === 'number' &&
        Number.isFinite(value.storedAt) &&
        (value.expiresAt === undefined ||
            (typeof value.expiresAt === 'number' && Number.isFinite(value.expiresAt))) &&
        (value.refreshToken === undefined ||
            (typeof value.refreshToken === 'string' && value.refreshToken.length > 0)) &&
        (value.sessionId === undefined ||
            (typeof value.sessionId === 'string' && value.sessionId.length > 0)));
}
function readString(record, key) {
    const value = record[key];
    return typeof value === 'string' ? value.trim() : '';
}
function readNumber(record, key) {
    const value = record[key];
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'string' && value.trim()) {
        return Number(value);
    }
    return Number.NaN;
}
function readOptionalExpiry(record, key) {
    const value = record[key];
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    const parsedNumber = readNumber(record, key);
    if (Number.isFinite(parsedNumber)) {
        return parsedNumber;
    }
    if (typeof value === 'string') {
        const parsedTime = Date.parse(value);
        if (Number.isFinite(parsedTime)) {
            return Math.floor(parsedTime / 1000);
        }
    }
    return undefined;
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function currentUnixSeconds() {
    return Math.floor(Date.now() / 1000);
}
function readBrowserStorage() {
    return readLocalStorage() ?? readSessionStorage();
}
function writeBrowserStorage(token) {
    writeLocalStorage(token);
    writeSessionStorage(token);
}
function removeBrowserStorage() {
    removeLocalStorage();
    removeSessionStorage();
}
function readLocalStorage() {
    return readStorageValue(globalThis.localStorage);
}
function readSessionStorage() {
    return readStorageValue(globalThis.sessionStorage);
}
function readStorageValue(storage) {
    if (!storage) {
        return null;
    }
    try {
        const primary = storage.getItem(APP_SESSION_STORAGE_KEY);
        if (primary) {
            return primary;
        }
        for (const legacyKey of LEGACY_HOST_SESSION_STORAGE_KEYS) {
            const legacy = storage.getItem(legacyKey);
            if (legacy) {
                return legacy;
            }
        }
    }
    catch {
        return null;
    }
    return null;
}
function writeLocalStorage(token) {
    try {
        globalThis.localStorage?.setItem(APP_SESSION_STORAGE_KEY, JSON.stringify(token));
    }
    catch {
        // Memory storage remains available for restrictive browser contexts.
    }
}
function removeLocalStorage() {
    removeStorageKeys(globalThis.localStorage);
}
function removeSessionStorage() {
    removeStorageKeys(globalThis.sessionStorage);
}
function removeStorageKeys(storage) {
    if (!storage) {
        return;
    }
    try {
        storage.removeItem(APP_SESSION_STORAGE_KEY);
        for (const legacyKey of LEGACY_HOST_SESSION_STORAGE_KEYS) {
            storage.removeItem(legacyKey);
        }
    }
    catch {
        // Nothing to clear when storage is unavailable.
    }
}
function writeSessionStorage(token) {
    try {
        globalThis.sessionStorage?.setItem(APP_SESSION_STORAGE_KEY, JSON.stringify(token));
    }
    catch {
        // Memory storage remains available for restrictive browser contexts.
    }
}
//# sourceMappingURL=app-session-token.js.map