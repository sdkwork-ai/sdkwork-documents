export interface StoredAppSessionToken {
    accessToken: string;
    authToken: string;
    expiresAt?: number;
    refreshToken?: string;
    sessionId?: string;
    storedAt: number;
}
export declare function storeAppSessionFromResult(result: unknown): StoredAppSessionToken;
export declare function getStoredAppSessionToken(now?: number): string | undefined;
export declare function getStoredAppSessionAuthToken(now?: number): string | undefined;
export declare function getStoredAppSessionAccessToken(now?: number): string | undefined;
export declare function loadStoredAppSessionToken(): StoredAppSessionToken | null;
export declare function clearStoredAppSessionToken(): void;
//# sourceMappingURL=app-session-token.d.ts.map