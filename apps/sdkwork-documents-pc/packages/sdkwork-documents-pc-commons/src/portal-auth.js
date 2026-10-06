import { getStoredAppSessionAccessToken, getStoredAppSessionAuthToken, } from "./app-session-token.js";
import { PORTAL_SESSION_CHANGE_EVENT } from "./portal-session-events.js";
export function buildPortalAuthLoginRedirect(location) {
    const returnPath = `${normalizePortalPathname(location.pathname)}${location.search ?? ''}${location.hash ?? ''}`;
    return `/auth/login?redirect=${encodeURIComponent(returnPath)}`;
}
export function resolvePortalLoginRequiredAction({ hasSession, location, }) {
    if (hasSession) {
        return { allowed: true };
    }
    return {
        allowed: false,
        redirectTo: buildPortalAuthLoginRedirect(location),
    };
}
export function hasStoredPortalSession() {
    return Boolean(getStoredAppSessionAuthToken() || getStoredAppSessionAccessToken());
}
export function subscribePortalSessionChange(listener) {
    if (typeof window === 'undefined') {
        return () => { };
    }
    window.addEventListener(PORTAL_SESSION_CHANGE_EVENT, listener);
    window.addEventListener('storage', listener);
    return () => {
        window.removeEventListener(PORTAL_SESSION_CHANGE_EVENT, listener);
        window.removeEventListener('storage', listener);
    };
}
function normalizePortalPathname(pathname) {
    const normalized = pathname.trim();
    if (!normalized) {
        return '/';
    }
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
}
//# sourceMappingURL=portal-auth.js.map