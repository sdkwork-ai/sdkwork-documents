import { type GatewayEndpointKind, resolveGatewayEndpoints } from '@sdkwork/utils/gatewayEndpoint';
export type { GatewayEndpointKind };
export type IdeToolId = 'cursor' | 'windsurf' | 'continue' | 'cline' | 'birdcoder' | 'claude-code' | 'codex' | 'gemini' | 'opencode' | 'openclaw' | 'hermes-agent' | 'aider';
export type IdeToolCategory = 'ide' | 'cli';
export type IdeToolSnippetLanguage = 'Shell' | 'JSON' | 'YAML' | 'TOML';
export interface IdeToolProfile {
    id: IdeToolId;
    category: IdeToolCategory;
    modelKitToolId: string;
    labelKey: string;
    fallbackLabel: string;
    summaryKey: string;
    fallbackSummary: string;
    endpointKind: GatewayEndpointKind;
    protocolKey: string;
    fallbackProtocol: string;
    configPathKey: string;
    fallbackConfigPath: string;
    referenceKey: string;
    fallbackReference: string;
    hintKey: string;
    fallbackHint: string;
    stepsKey: string;
    fallbackSteps: string;
    verifyKey?: string;
    fallbackVerify?: string;
    snippetLanguage: IdeToolSnippetLanguage;
}
export type IdeToolSnippetMap = Record<IdeToolId, string>;
export interface IdeToolSnippetInput {
    apiKeyPlaceholder: string;
    openAiBaseUrl: string;
    anthropicBaseUrl: string;
    geminiBaseUrl: string;
}
export declare const IDE_TOOL_CATEGORY_ORDER: IdeToolCategory[];
export declare const IDE_TOOL_CATEGORY_META: Record<IdeToolCategory, {
    labelKey: string;
    fallbackLabel: string;
}>;
export declare const IDE_TOOL_PROFILES: IdeToolProfile[];
export declare function groupIdeToolProfilesByCategory(): Record<IdeToolCategory, IdeToolProfile[]>;
export declare function buildIdeToolSnippets(input: IdeToolSnippetInput): IdeToolSnippetMap;
export { resolveGatewayEndpoints };
//# sourceMappingURL=ideToolProfiles.d.ts.map