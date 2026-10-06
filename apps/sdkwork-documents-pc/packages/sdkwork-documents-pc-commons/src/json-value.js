export function normalizeJsonValue(value, fieldName = 'value') {
    if (value === null) {
        return null;
    }
    if (typeof value === 'string' || typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) {
            throw new Error(`${fieldName} must be a finite JSON number`);
        }
        return value;
    }
    if (Array.isArray(value)) {
        return value.map((item, index) => normalizeJsonValue(item, `${fieldName}[${index}]`));
    }
    if (isPlainJsonObject(value)) {
        return normalizeJsonObject(value, fieldName);
    }
    throw new Error(`${fieldName} must be a JSON value`);
}
export function normalizeJsonObject(value, fieldName = 'value') {
    if (value === undefined) {
        return {};
    }
    if (!isPlainJsonObject(value)) {
        throw new Error(`${fieldName} must be a JSON object`);
    }
    const normalized = {};
    for (const [key, item] of Object.entries(value)) {
        normalized[key] = normalizeJsonValue(item, `${fieldName}.${key}`);
    }
    return normalized;
}
export function normalizeOptionalJsonObject(value, fieldName = 'value') {
    if (value === undefined) {
        return undefined;
    }
    return normalizeJsonObject(value, fieldName);
}
export function normalizeJsonObjectArray(value, fieldName = 'value') {
    if (value === undefined) {
        return [];
    }
    if (!Array.isArray(value)) {
        throw new Error(`${fieldName} must be a JSON array of objects`);
    }
    return value.map((item, index) => normalizeJsonObject(item, `${fieldName}[${index}]`));
}
function isPlainJsonObject(value) {
    return typeof value === 'object'
        && value !== null
        && !Array.isArray(value)
        && Object.getPrototypeOf(value) === Object.prototype;
}
//# sourceMappingURL=json-value.js.map