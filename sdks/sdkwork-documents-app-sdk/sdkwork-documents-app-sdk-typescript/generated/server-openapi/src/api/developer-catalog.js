import { appApiPath } from './paths';
export class DeveloperCatalogApi {
    client;
    constructor(client) {
        this.client = client;
    }
    /** Developer catalog overview and facets */
    async overviewRetrieve(requestOptions) {
        return this.client.request(appApiPath(`/developer_catalog/overview`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET', sdkworkUnwrapKind: 'data' });
    }
    /** Developer catalog categories */
    async categoriesList(requestOptions) {
        return this.client.request(appApiPath(`/developer_catalog/categories`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET', sdkworkUnwrapKind: 'data' });
    }
    /** SDK language catalog */
    async languagesList(requestOptions) {
        return this.client.request(appApiPath(`/developer_catalog/languages`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET', sdkworkUnwrapKind: 'data' });
    }
    /** List API surfaces across the SDKWork workspace */
    async apisList(params, requestOptions) {
        const query = buildQueryString([
            { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
            { name: 'categoryCode', value: params?.categoryCode, style: 'form', explode: true, allowReserved: false },
            { name: 'moduleCode', value: params?.moduleCode, style: 'form', explode: true, allowReserved: false },
            { name: 'surfaceCode', value: params?.surfaceCode, style: 'form', explode: true, allowReserved: false },
            { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
            { name: 'pageSize', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
        ]);
        return this.client.request(appendQueryString(appApiPath(`/developer_catalog/apis`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET', sdkworkUnwrapKind: 'data' });
    }
    /** Retrieve one API surface */
    async apiRetrieve(surfaceId, requestOptions) {
        return this.client.request(appApiPath(`/developer_catalog/apis/${serializePathParameter(surfaceId, { name: 'surfaceId', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET', sdkworkUnwrapKind: 'data' });
    }
    /** Retrieve the stored OpenAPI document for one API surface */
    async apiSchemaRetrieve(surfaceId, requestOptions) {
        return this.client.request(appApiPath(`/developer_catalog/apis/${serializePathParameter(surfaceId, { name: 'surfaceId', style: 'simple', explode: false })}/schema`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET', sdkworkUnwrapKind: 'data' });
    }
    /** List normalized operations for one API surface */
    async apiOperationsList(surfaceId, params, requestOptions) {
        const query = buildQueryString([
            { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
            { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
            { name: 'pageSize', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
        ]);
        return this.client.request(appendQueryString(appApiPath(`/developer_catalog/apis/${serializePathParameter(surfaceId, { name: 'surfaceId', style: 'simple', explode: false })}/operations`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET', sdkworkUnwrapKind: 'data' });
    }
    /** List generated SDK families across the SDKWork workspace */
    async sdksList(params, requestOptions) {
        const query = buildQueryString([
            { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
            { name: 'categoryCode', value: params?.categoryCode, style: 'form', explode: true, allowReserved: false },
            { name: 'moduleCode', value: params?.moduleCode, style: 'form', explode: true, allowReserved: false },
            { name: 'languageCode', value: params?.languageCode, style: 'form', explode: true, allowReserved: false },
            { name: 'sdkType', value: params?.sdkType, style: 'form', explode: true, allowReserved: false },
            { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
            { name: 'pageSize', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
        ]);
        return this.client.request(appendQueryString(appApiPath(`/developer_catalog/sdks`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET', sdkworkUnwrapKind: 'data' });
    }
    /** Retrieve one SDK family with its language releases */
    async sdkRetrieve(sdkId, requestOptions) {
        return this.client.request(appApiPath(`/developer_catalog/sdks/${serializePathParameter(sdkId, { name: 'sdkId', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET', sdkworkUnwrapKind: 'data' });
    }
}
export function createDeveloperCatalogApi(client) {
    return new DeveloperCatalogApi(client);
}
function appendQueryString(path, rawQueryString) {
    const query = rawQueryString.replace(/^\?+/, '');
    if (!query) {
        return path;
    }
    return path.includes('?') ? `${path}&${query}` : `${path}?${query}`;
}
function serializePathParameter(value, spec) {
    if (value === undefined || value === null) {
        return '';
    }
    const style = spec.style || 'simple';
    if (Array.isArray(value)) {
        return serializePathArray(spec.name, value, style, spec.explode);
    }
    if (typeof value === 'object') {
        return serializePathObject(spec.name, value, style, spec.explode);
    }
    return pathPrefix(spec.name, style, false) + encodePathValue(serializePathPrimitive(value));
}
function serializePathArray(name, values, style, explode) {
    const serialized = values
        .filter((item) => item !== undefined && item !== null)
        .map((item) => encodePathValue(serializePathPrimitive(item)));
    if (serialized.length === 0) {
        return pathPrefix(name, style, false);
    }
    if (style === 'matrix') {
        return explode
            ? serialized.map((item) => `;${name}=${item}`).join('')
            : `;${name}=${serialized.join(',')}`;
    }
    return pathPrefix(name, style, false) + serialized.join(explode ? '.' : ',');
}
function serializePathObject(name, value, style, explode) {
    const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
    if (entries.length === 0) {
        return pathPrefix(name, style, true);
    }
    if (style === 'matrix') {
        return explode
            ? entries.map(([key, entryValue]) => `;${encodePathValue(key)}=${encodePathValue(serializePathPrimitive(entryValue))}`).join('')
            : `;${name}=${entries.flatMap(([key, entryValue]) => [encodePathValue(key), encodePathValue(serializePathPrimitive(entryValue))]).join(',')}`;
    }
    const serialized = explode
        ? entries.map(([key, entryValue]) => `${encodePathValue(key)}=${encodePathValue(serializePathPrimitive(entryValue))}`).join(style === 'label' ? '.' : ',')
        : entries.flatMap(([key, entryValue]) => [encodePathValue(key), encodePathValue(serializePathPrimitive(entryValue))]).join(',');
    return pathPrefix(name, style, true) + serialized;
}
function pathPrefix(name, style, _objectValue) {
    if (style === 'label')
        return '.';
    if (style === 'matrix')
        return `;${name}`;
    return '';
}
function encodePathValue(value) {
    return encodeURIComponent(value);
}
function serializePathPrimitive(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}
function buildQueryString(parameters) {
    const pairs = [];
    for (const parameter of parameters) {
        appendSerializedParameter(pairs, parameter);
    }
    return pairs.join('&');
}
function appendSerializedParameter(pairs, parameter) {
    if (parameter.value === undefined || parameter.value === null) {
        return;
    }
    if (parameter.contentType) {
        pairs.push(`${encodeQueryComponent(parameter.name)}=${encodeQueryValue(JSON.stringify(parameter.value), parameter.allowReserved)}`);
        return;
    }
    const style = parameter.style || 'form';
    if (style === 'deepObject') {
        appendDeepObjectParameter(pairs, parameter.name, parameter.value, parameter.allowReserved);
        return;
    }
    if (Array.isArray(parameter.value)) {
        appendArrayParameter(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
        return;
    }
    if (typeof parameter.value === 'object') {
        appendObjectParameter(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
        return;
    }
    pairs.push(`${encodeQueryComponent(parameter.name)}=${encodeQueryValue(serializePrimitive(parameter.value), parameter.allowReserved)}`);
}
function appendArrayParameter(pairs, name, value, style, explode, allowReserved) {
    const values = value
        .filter((item) => item !== undefined && item !== null)
        .map((item) => serializePrimitive(item));
    if (values.length === 0) {
        return;
    }
    if (style === 'form' && explode) {
        for (const item of values) {
            pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(item, allowReserved)}`);
        }
        return;
    }
    pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(values.join(','), allowReserved)}`);
}
function appendObjectParameter(pairs, name, value, style, explode, allowReserved) {
    const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
    if (entries.length === 0) {
        return;
    }
    if (style === 'form' && explode) {
        for (const [key, entryValue] of entries) {
            pairs.push(`${encodeQueryComponent(key)}=${encodeQueryValue(serializePrimitive(entryValue), allowReserved)}`);
        }
        return;
    }
    const serialized = entries.flatMap(([key, entryValue]) => [key, serializePrimitive(entryValue)]).join(',');
    pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(serialized, allowReserved)}`);
}
function appendDeepObjectParameter(pairs, name, value, allowReserved) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(serializePrimitive(value), allowReserved)}`);
        return;
    }
    for (const [key, entryValue] of Object.entries(value)) {
        if (entryValue === undefined || entryValue === null) {
            continue;
        }
        pairs.push(`${encodeQueryComponent(`${name}[${key}]`)}=${encodeQueryValue(serializePrimitive(entryValue), allowReserved)}`);
    }
}
function serializePrimitive(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}
function encodeQueryComponent(value) {
    return encodeURIComponent(value);
}
function encodeQueryValue(value, allowReserved) {
    const encoded = encodeURIComponent(value);
    if (!allowReserved) {
        return encoded;
    }
    return encoded.replace(/%3A/gi, ':')
        .replace(/%2F/gi, '/')
        .replace(/%3F/gi, '?')
        .replace(/%23/gi, '#')
        .replace(/%5B/gi, '[')
        .replace(/%5D/gi, ']')
        .replace(/%40/gi, '@')
        .replace(/%21/gi, '!')
        .replace(/%24/gi, '$')
        .replace(/%26/gi, '&')
        .replace(/%27/gi, "'")
        .replace(/%28/gi, '(')
        .replace(/%29/gi, ')')
        .replace(/%2A/gi, '*')
        .replace(/%2B/gi, '+')
        .replace(/%2C/gi, ',')
        .replace(/%3B/gi, ';')
        .replace(/%3D/gi, '=');
}
//# sourceMappingURL=developer-catalog.js.map