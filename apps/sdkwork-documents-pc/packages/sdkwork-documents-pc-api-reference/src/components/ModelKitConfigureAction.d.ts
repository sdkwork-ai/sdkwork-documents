import { type ModelKitGatewayEndpoints } from '../modelKitIntegration';
import type { IdeToolProfile } from '../ideToolProfiles';
interface ModelKitConfigureActionProps {
    profile: IdeToolProfile;
    endpoints: ModelKitGatewayEndpoints;
    apiKeyPlaceholder?: string;
    providerName?: string;
    variant?: 'inline' | 'card';
}
export declare function ModelKitConfigureAction({ profile, endpoints, apiKeyPlaceholder, providerName, variant, }: ModelKitConfigureActionProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=ModelKitConfigureAction.d.ts.map