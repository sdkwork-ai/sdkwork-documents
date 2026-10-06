import { type GatewayEndpointKind } from '@sdkwork/utils/gatewayEndpoint';
export type { GatewayEndpointKind };
export declare const MODELKIT_APP_KEY = "sdkwork-local-router-sdkwork-modelkit-pc";
export declare const MODELKIT_STORE_URL = "https://sdkwork.com/apps/sdkwork-local-router-sdkwork-modelkit-pc";
export declare const MODELKIT_SCHEME = "modelkit://config";
export declare const MODELKIT_DOWNLOAD_URLS: {
    readonly windows: "https://cdn.sdkwork.com/apps/sdkwork-local-router-sdkwork-modelkit-pc/STABLE/0.0.0/windows/x64/app.zip";
    readonly macos: "https://cdn.sdkwork.com/apps/sdkwork-local-router-sdkwork-modelkit-pc/STABLE/0.0.0/macos/universal/app.dmg";
    readonly linux: "https://cdn.sdkwork.com/apps/sdkwork-local-router-sdkwork-modelkit-pc/STABLE/0.0.0/linux/generic/x64/app.AppImage";
};
export type ModelKitInstallStatus = 'unknown' | 'checking' | 'installed' | 'missing';
export interface ModelKitDeepLinkPayload {
    apiKey: string;
    baseUrl: string;
    name: string;
    description?: string;
    supportedTools: string[];
}
export interface ModelKitGatewayEndpoints {
    openAiBaseUrl: string;
    anthropicBaseUrl: string;
    geminiBaseUrl: string;
}
export declare function resolveModelKitBaseUrl(endpointKind: GatewayEndpointKind, endpoints: ModelKitGatewayEndpoints): string;
export declare function buildModelKitDesktopUri(payload: ModelKitDeepLinkPayload): string;
export declare function buildModelKitWebUri(payload: ModelKitDeepLinkPayload, webBaseUrl: string): string;
export declare function resolveModelKitWebBaseUrl(readRuntimeEnv: (name: string) => string | undefined): string;
export declare function resolveModelKitDownloadUrl(): string;
export declare function detectModelKitInstalled(): Promise<boolean>;
export declare function probeModelKitProtocol(uri: string): Promise<boolean>;
export declare function openModelKitConfigure(payload: ModelKitDeepLinkPayload): Promise<{
    installed: boolean;
    opened: boolean;
    downloadUrl: string;
}>;
//# sourceMappingURL=modelKitIntegration.d.ts.map