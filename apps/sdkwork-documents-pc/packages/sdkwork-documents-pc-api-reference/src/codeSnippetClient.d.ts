export declare const CODEGEN_LANGUAGE_LIBRARY_MAP: {
    readonly javascript: readonly ["axios", "fetch", "got", "superagent"];
    readonly typescript: readonly ["axios", "fetch", "got", "superagent"];
    readonly python: readonly ["requests", "aiohttp", "httpx"];
    readonly go: readonly ["net/http", "fasthttp", "resty"];
    readonly java: readonly ["okhttp", "apache-httpclient", "retrofit", "unirest"];
    readonly cpp: readonly ["cpprest", "cpp-httplib", "boost-beast"];
    readonly csharp: readonly ["httpclient", "restsharp", "refit"];
    readonly php: readonly ["guzzle", "curl"];
    readonly ruby: readonly ["faraday", "httparty"];
    readonly swift: readonly ["alamofire", "urlsession"];
    readonly kotlin: readonly ["okhttp", "retrofit"];
    readonly dart: readonly ["http", "dio"];
    readonly shell: readonly ["curl"];
    readonly rust: readonly ["reqwest"];
};
export type CodegenLanguage = keyof typeof CODEGEN_LANGUAGE_LIBRARY_MAP;
export declare const CODEGEN_LANGUAGES: CodegenLanguage[];
export declare function getLibraries(language: CodegenLanguage): string[];
export declare function getDefaultLibrary(language: CodegenLanguage): string;
export interface GenerateCodeSnippetRequest {
    path: string;
    method: string;
    operation: unknown;
    pathItem: unknown;
    baseUrl: string;
    language: CodegenLanguage;
    library: string;
    openAPISpec: unknown;
}
export declare function joinRequestUrl(baseUrl: string, path: string): string;
export declare function extractCodeSnippetPathTemplateVariables(path: string | undefined): string[];
export declare function buildStaticCodeSnippet(request: GenerateCodeSnippetRequest): string;
export declare function generateCodeSnippet(request: GenerateCodeSnippetRequest): Promise<string>;
//# sourceMappingURL=codeSnippetClient.d.ts.map