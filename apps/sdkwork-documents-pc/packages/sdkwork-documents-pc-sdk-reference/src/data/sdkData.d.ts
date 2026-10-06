import type { DocumentsGeneratedSdkMetadata } from '@sdkwork/documents-pc-commons/runtime';
import type { SdkReferenceSystem } from '../sdkReferenceRuntime';
export interface SdkLanguage {
    id: string;
    name: string;
    icon: string;
    description: string;
    installCommand: string;
    importCode: string;
    initCode: string;
    exampleCode: string;
    githubUrl: string;
}
export type ApiSystem = SdkReferenceSystem;
export type GeneratedSdkMetadata = DocumentsGeneratedSdkMetadata;
export declare const getGeneratedSdkMetadataForSystem: (system: ApiSystem) => GeneratedSdkMetadata;
export declare const getSdkDataForSystem: (system: ApiSystem) => SdkLanguage[];
export declare const SDK_DATA: SdkLanguage[];
//# sourceMappingURL=sdkData.d.ts.map