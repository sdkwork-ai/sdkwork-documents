import { ensureSdkworkApiSuccess, getDocumentsAppSdkClient, isRecord, normalizeJsonObject, readApiData, readBoolean, readNullableString, readString, } from '@sdkwork/documents-pc-commons/runtime';
import { normalizeSdkReferenceLanguage } from './sdkReferenceRuntime';
export async function generateSdkReferenceDocumentation(input) {
    const language = normalizeSdkReferenceLanguage(input.language);
    const result = await getDocumentsAppSdkClient().documents.sdkReference.documentationCreate({
        spec: normalizeJsonObject(input.spec, 'spec'),
        language,
        config: normalizeJsonObject({
            ...input.config,
            language,
        }, 'config'),
    }, { idempotencyKey: createSdkReferenceIdempotencyKey('documentation') });
    ensureSdkworkApiSuccess(result, 'SDK reference documentation could not be generated');
    const data = readApiData(result);
    if (!isRecord(data)) {
        throw new Error('SDK reference documentation response is invalid');
    }
    return {
        readme: readString(data, 'readme'),
        methodDefinition: readNullableString(data, 'methodDefinition'),
        usageExample: readNullableString(data, 'usageExample'),
        language: readString(data, 'language', language),
        generated: readBoolean(data, 'generated', false),
    };
}
export async function generateSdkReferenceArchive(input) {
    const language = normalizeSdkReferenceLanguage(input.language);
    const result = await getDocumentsAppSdkClient().documents.sdkReference.archivesCreate({
        spec: normalizeJsonObject(input.spec, 'spec'),
        language,
        config: normalizeJsonObject({
            ...input.config,
            language,
        }, 'config'),
    }, { idempotencyKey: createSdkReferenceIdempotencyKey('archives') });
    ensureSdkworkApiSuccess(result, 'SDK archive could not be generated');
    const data = readApiData(result);
    if (!isRecord(data)) {
        throw new Error('SDK archive response is invalid');
    }
    return {
        fileName: readString(data, 'fileName'),
        contentType: readString(data, 'contentType', 'application/zip'),
        contentBase64: readString(data, 'contentBase64'),
        language: readString(data, 'language', language),
    };
}
/**
 * The SDK-reference operations are POST commands carrying the contract's
 * `Idempotency-Key` header. A fresh key per invocation lets a network retry
 * after an ambiguous failure replay safely without collapsing distinct
 * generations into one cached response.
 */
function createSdkReferenceIdempotencyKey(scope) {
    const unique = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    return `sdk-reference-${scope}-${unique}`;
}
//# sourceMappingURL=sdkReferenceGenerationService.js.map