import type { ApiReferenceEndpoint } from '../openapiTypes';
interface ApiPlaygroundProps {
    endpoint: ApiReferenceEndpoint;
    requestBaseUrl: string;
    onClose: () => void;
}
export declare function ApiPlayground({ endpoint, requestBaseUrl, onClose }: ApiPlaygroundProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=ApiPlayground.d.ts.map