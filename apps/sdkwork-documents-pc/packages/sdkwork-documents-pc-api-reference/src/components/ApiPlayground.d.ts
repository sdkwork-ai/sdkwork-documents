import React from 'react';
import type { ApiReferenceEndpoint } from '../openapiTypes';
interface ApiPlaygroundProps {
    endpoint: ApiReferenceEndpoint;
    requestBaseUrl: string;
    onClose: () => void;
}
export declare function ApiPlayground({ endpoint, requestBaseUrl, onClose }: ApiPlaygroundProps): React.JSX.Element;
export {};
//# sourceMappingURL=ApiPlayground.d.ts.map