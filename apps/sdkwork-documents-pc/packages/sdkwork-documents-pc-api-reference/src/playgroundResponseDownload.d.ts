import type { PlaygroundResponse } from './playgroundRequest';
export interface ApiPlaygroundResponseDownload {
    filename: string;
    mimeType: string;
    text: string;
}
export declare function serializeApiPlaygroundResponseData(data: unknown): string;
export declare function createApiPlaygroundResponseDownload(response: PlaygroundResponse | null | undefined): ApiPlaygroundResponseDownload | null;
export declare function downloadApiPlaygroundResponse(response: PlaygroundResponse | null | undefined): boolean;
//# sourceMappingURL=playgroundResponseDownload.d.ts.map