export const PORTAL_SESSION_CHANGE_EVENT = 'sdkwork-documents:portal-session-change';
export function dispatchPortalSessionChange() {
    if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
        return;
    }
    window.dispatchEvent(new Event(PORTAL_SESSION_CHANGE_EVENT));
}
//# sourceMappingURL=portal-session-events.js.map