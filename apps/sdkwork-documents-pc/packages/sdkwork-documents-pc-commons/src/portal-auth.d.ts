export interface PortalAuthLocationLike {
    hash?: string;
    pathname: string;
    search?: string;
}
export type PortalLoginRequiredActionDecision = {
    allowed: true;
} | {
    allowed: false;
    redirectTo: string;
};
export declare function buildPortalAuthLoginRedirect(location: PortalAuthLocationLike): string;
export declare function resolvePortalLoginRequiredAction({ hasSession, location, }: {
    hasSession: boolean;
    location: PortalAuthLocationLike;
}): PortalLoginRequiredActionDecision;
export declare function hasStoredPortalSession(): boolean;
export declare function subscribePortalSessionChange(listener: () => void): () => void;
//# sourceMappingURL=portal-auth.d.ts.map