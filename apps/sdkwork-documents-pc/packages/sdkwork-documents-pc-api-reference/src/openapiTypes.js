export const OPEN_API_OPERATION_METHODS = [
    'get',
    'put',
    'post',
    'delete',
    'options',
    'head',
    'patch',
    'trace',
];
function isJsonRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isStringArray(value) {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
export function asOpenApiJsonSchema(value) {
    if (!isJsonRecord(value)) {
        return undefined;
    }
    return value;
}
export function isOpenApiParameter(value) {
    if (!isJsonRecord(value)) {
        return false;
    }
    return ((typeof value.$ref === 'undefined' || typeof value.$ref === 'string') &&
        (typeof value.in === 'undefined' || typeof value.in === 'string') &&
        (typeof value.name === 'undefined' || typeof value.name === 'string') &&
        (typeof value.description === 'undefined' || typeof value.description === 'string') &&
        (typeof value.required === 'undefined' || typeof value.required === 'boolean') &&
        (typeof value.schema === 'undefined' || Boolean(asOpenApiJsonSchema(value.schema))));
}
function isOpenApiRequestBody(value) {
    return isJsonRecord(value) && (typeof value.content === 'undefined' || isJsonRecord(value.content));
}
function isOpenApiResponses(value) {
    return isJsonRecord(value);
}
export function isOpenApiOperation(value) {
    if (!isJsonRecord(value)) {
        return false;
    }
    return ((typeof value.operationId === 'undefined' || typeof value.operationId === 'string') &&
        (typeof value.summary === 'undefined' || typeof value.summary === 'string') &&
        (typeof value.description === 'undefined' || typeof value.description === 'string') &&
        (typeof value.tags === 'undefined' || isStringArray(value.tags)) &&
        (typeof value.parameters === 'undefined' || (Array.isArray(value.parameters) && value.parameters.every(isOpenApiParameter))) &&
        (typeof value.requestBody === 'undefined' || isOpenApiRequestBody(value.requestBody)) &&
        (typeof value.responses === 'undefined' || isOpenApiResponses(value.responses)));
}
function isOpenApiPathItem(value) {
    return isJsonRecord(value);
}
export function isOpenApiDocument(value) {
    if (!isJsonRecord(value) || !isJsonRecord(value.paths)) {
        return false;
    }
    return Object.values(value.paths).every(isOpenApiPathItem);
}
//# sourceMappingURL=openapiTypes.js.map