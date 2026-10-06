import { asOpenApiJsonSchema } from "./openapiTypes.js";
export function getJsonRequestSchema(requestBody) {
    return asOpenApiJsonSchema(getJsonLikeMediaType(requestBody?.content)?.mediaType.schema);
}
export function getJsonResponseSchema(content) {
    return asOpenApiJsonSchema(getJsonLikeMediaType(content)?.mediaType.schema);
}
export function getDocumentedRequestMediaType(requestBody) {
    return getOpenApiMediaType(requestBody?.content, isJsonLikeContentType);
}
export function getDocumentedResponseMediaType(content) {
    return getOpenApiMediaType(content, isJsonLikeContentType);
}
export function getDocumentedRequestSchema(requestBody) {
    return asOpenApiJsonSchema(getDocumentedRequestMediaType(requestBody)?.mediaType.schema);
}
export function getDocumentedResponseSchema(content) {
    return asOpenApiJsonSchema(getDocumentedResponseMediaType(content)?.mediaType.schema);
}
export function getJsonLikeMediaType(content) {
    if (!content) {
        return undefined;
    }
    const selected = Object.entries(content)
        .find(([contentType]) => isJsonLikeContentType(contentType));
    if (!selected) {
        return undefined;
    }
    const [contentType, mediaType] = selected;
    return { contentType, mediaType };
}
export function getOpenApiMediaType(content, predicate) {
    if (!content) {
        return undefined;
    }
    const entries = Object.entries(content);
    if (entries.length === 0) {
        return undefined;
    }
    const selected = predicate
        ? entries.find(([contentType]) => predicate(contentType))
        : undefined;
    const [contentType, mediaType] = selected ?? entries[0];
    return { contentType, mediaType };
}
function isJsonLikeContentType(contentType) {
    const normalized = contentType.toLowerCase().split(';', 1)[0]?.trim() ?? '';
    return normalized === 'application/json' || normalized.endsWith('+json');
}
export function resolveOpenApiSchema(schema, spec, seenRefs = new Set()) {
    if (!schema) {
        return undefined;
    }
    if (typeof schema.$ref === 'string') {
        const schemaName = schemaNameFromRef(schema.$ref);
        if (seenRefs.has(schema.$ref)) {
            return {
                schema: {
                    type: 'object',
                    description: schemaName ? `Circular reference to ${schemaName}.` : 'Circular schema reference.',
                },
                schemaName,
                seenRefs,
            };
        }
        const nextSeenRefs = new Set(seenRefs);
        nextSeenRefs.add(schema.$ref);
        const referenced = resolveLocalSchemaRef(spec, schema.$ref);
        const resolved = resolveOpenApiSchema(referenced, spec, nextSeenRefs);
        if (!resolved) {
            return { schema, schemaName, seenRefs: nextSeenRefs };
        }
        return {
            schema: {
                ...resolved.schema,
                description: schema.description || resolved.schema.description,
            },
            schemaName: schemaName || resolved.schemaName,
            seenRefs: resolved.seenRefs,
        };
    }
    if (Array.isArray(schema.allOf) && schema.allOf.length > 0) {
        const merged = mergeAllOfSchemas(schema, spec, seenRefs);
        return {
            schema: merged.schema,
            schemaName: schema.title,
            seenRefs: merged.seenRefs,
        };
    }
    if (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
        return resolveOpenApiSchema(schema.oneOf[0], spec, new Set(seenRefs));
    }
    if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
        return resolveOpenApiSchema(schema.anyOf[0], spec, new Set(seenRefs));
    }
    return {
        schema,
        schemaName: schema.title,
        seenRefs,
    };
}
export function getOpenApiSchemaName(schema) {
    if (!schema) {
        return undefined;
    }
    return schema.title || schemaNameFromRef(schema.$ref);
}
export function schemaToApiParameters(schema, options = {}) {
    const resolved = resolveOpenApiSchema(schema, options.spec);
    if (!resolved) {
        return [];
    }
    return resolvedSchemaToApiParameters(resolved.schema, options.spec, resolved.schema.required ?? [], resolved.seenRefs);
}
export function generateOpenApiSchemaExample(schema, options = {}, propertyName = 'value') {
    const resolved = resolveOpenApiSchema(schema, options.spec);
    if (!resolved) {
        return null;
    }
    return generateResolvedSchemaExample(resolved.schema, options.spec, propertyName, resolved.seenRefs);
}
export function getOpenApiMediaExample(mediaType) {
    if (!mediaType) {
        return undefined;
    }
    if (Object.prototype.hasOwnProperty.call(mediaType, 'example')) {
        return mediaType.example;
    }
    if (!mediaType.examples || typeof mediaType.examples !== 'object') {
        return undefined;
    }
    const firstExample = Object.values(mediaType.examples)[0];
    if (isRecord(firstExample) && Object.prototype.hasOwnProperty.call(firstExample, 'value')) {
        return firstExample.value;
    }
    return firstExample;
}
export function schemaToTypeLabel(schema, options = {}) {
    const resolved = resolveOpenApiSchema(schema, options.spec);
    if (!resolved) {
        return 'unknown';
    }
    return schemaTypeLabel(resolved.schema, options.spec, resolved.schemaName, resolved.seenRefs);
}
export function schemaToTypescriptType(schema, options = {}) {
    const schemaName = getOpenApiSchemaName(schema);
    if (schemaName && schemaName !== 'JsonObject') {
        return schemaName;
    }
    const resolved = resolveOpenApiSchema(schema, options.spec);
    if (!resolved) {
        return 'void';
    }
    if (resolved.schemaName && resolved.schemaName !== 'JsonObject') {
        return resolved.schemaName;
    }
    return schemaToInlineTypescriptType(resolved.schema, options.spec, resolved.seenRefs);
}
export function isJsonObjectLikeSchema(schema, spec) {
    const schemaName = getOpenApiSchemaName(schema);
    const resolved = resolveOpenApiSchema(schema, spec);
    const resolvedSchema = resolved?.schema;
    return (schemaName === 'JsonObject'
        || resolved?.schemaName === 'JsonObject'
        || Boolean(resolvedSchema
            && normalizedSchemaTypes(resolvedSchema).includes('object')
            && !resolvedSchema.properties
            && resolvedSchema.additionalProperties === true));
}
function resolvedSchemaToApiParameters(schema, spec, requiredList, seenRefs) {
    const schemaTypes = normalizedSchemaTypes(schema);
    if (schemaTypes.includes('object')) {
        if (schema.properties && Object.keys(schema.properties).length > 0) {
            return Object.entries(schema.properties).map(([key, value]) => {
                const resolvedChild = resolveOpenApiSchema(value, spec, seenRefs);
                const childSchema = resolvedChild?.schema ?? value;
                const childSeenRefs = resolvedChild?.seenRefs ?? seenRefs;
                const param = {
                    name: key,
                    type: schemaTypeLabel(childSchema, spec, resolvedChild?.schemaName, childSeenRefs),
                    desc: childSchema.description || value.description || '',
                    required: requiredList.includes(key),
                };
                const childTypes = normalizedSchemaTypes(childSchema);
                if (childTypes.includes('object')) {
                    param.children = resolvedSchemaToApiParameters(childSchema, spec, childSchema.required || [], childSeenRefs);
                }
                else if (childTypes.includes('array') && childSchema.items) {
                    const resolvedItem = resolveOpenApiSchema(childSchema.items, spec, childSeenRefs);
                    const itemSchema = resolvedItem?.schema ?? childSchema.items;
                    const itemSeenRefs = resolvedItem?.seenRefs ?? childSeenRefs;
                    if (normalizedSchemaTypes(itemSchema).includes('object')) {
                        param.children = resolvedSchemaToApiParameters(itemSchema, spec, itemSchema.required || [], itemSeenRefs);
                        if (param.children.length === 0 && itemSchema.additionalProperties === true) {
                            param.children = [freeFormObjectParameter(itemSchema.description)];
                        }
                    }
                }
                return param;
            });
        }
        if (schema.additionalProperties === true || schema.additionalProperties) {
            return [freeFormObjectParameter(schema.description)];
        }
    }
    if (schemaTypes.includes('array')) {
        return [{
                name: '*',
                type: schemaTypeLabel(schema, spec),
                desc: schema.description || 'Array response body.',
                required: false,
            }];
    }
    return [{
            name: 'value',
            type: schemaTypeLabel(schema, spec),
            desc: schema.description || 'Response body.',
            required: false,
        }];
}
function freeFormObjectParameter(description) {
    return {
        name: '*',
        type: 'Record<string, unknown>',
        desc: description || 'Free-form JSON object. Field names and values are defined by the upstream provider.',
        required: false,
    };
}
function schemaTypeLabel(schema, spec, resolvedSchemaName, seenRefs = new Set()) {
    const schemaName = resolvedSchemaName || getOpenApiSchemaName(schema);
    const schemaTypes = normalizedSchemaTypes(schema);
    if (schemaName && schemaName !== 'JsonObject' && schemaTypes.includes('object')) {
        return schemaName;
    }
    if (schemaTypes.includes('array')) {
        const resolvedItem = resolveOpenApiSchema(schema.items, spec, seenRefs);
        const itemSchema = resolvedItem?.schema ?? schema.items;
        return `array<${itemSchema ? schemaTypeLabel(itemSchema, spec, resolvedItem?.schemaName, resolvedItem?.seenRefs ?? seenRefs) : 'unknown'}>`;
    }
    if (schemaTypes.includes('object')) {
        if (!schema.properties && schema.additionalProperties) {
            return 'Record<string, unknown>';
        }
        return 'object';
    }
    const type = schemaTypes[0] || 'unknown';
    const format = schema.format ? `<${schema.format}>` : '';
    return `${type}${format}`;
}
function schemaToInlineTypescriptType(schema, spec, seenRefs = new Set()) {
    const schemaTypes = normalizedSchemaTypes(schema);
    if (schemaTypes.includes('array')) {
        const resolvedItem = resolveOpenApiSchema(schema.items, spec, seenRefs);
        const itemSchema = resolvedItem?.schema ?? schema.items;
        return `${itemSchema ? schemaToInlineTypescriptType(itemSchema, spec, resolvedItem?.seenRefs ?? seenRefs) : 'unknown'}[]`;
    }
    if (schemaTypes.includes('object')) {
        return 'Record<string, unknown>';
    }
    if (schemaTypes.includes('integer') || schemaTypes.includes('number')) {
        return 'number';
    }
    if (schemaTypes.includes('boolean')) {
        return 'boolean';
    }
    if (schemaTypes.includes('string')) {
        if (Array.isArray(schema.enum) && schema.enum.every((item) => typeof item === 'string')) {
            return schema.enum.map((item) => JSON.stringify(item)).join(' | ');
        }
        return 'string';
    }
    return 'unknown';
}
function generateResolvedSchemaExample(schema, spec, propertyName, seenRefs) {
    if (Object.prototype.hasOwnProperty.call(schema, 'example')) {
        return schema.example;
    }
    if (Object.prototype.hasOwnProperty.call(schema, 'default')) {
        return schema.default;
    }
    if (Array.isArray(schema.enum) && schema.enum.length > 0) {
        return schema.enum[0];
    }
    if (Object.prototype.hasOwnProperty.call(schema, 'const')) {
        return schema.const;
    }
    const schemaTypes = normalizedSchemaTypes(schema);
    if (schemaTypes.includes('object')) {
        const value = {};
        for (const [key, childSchema] of Object.entries(schema.properties ?? {})) {
            const resolvedChild = resolveOpenApiSchema(childSchema, spec, seenRefs);
            value[key] = generateResolvedSchemaExample(resolvedChild?.schema ?? childSchema, spec, key, resolvedChild?.seenRefs ?? seenRefs);
        }
        return value;
    }
    if (schemaTypes.includes('array')) {
        const resolvedItem = resolveOpenApiSchema(schema.items, spec, seenRefs);
        const itemSchema = resolvedItem?.schema ?? schema.items;
        return [
            itemSchema
                ? generateResolvedSchemaExample(itemSchema, spec, propertyName, resolvedItem?.seenRefs ?? seenRefs)
                : null,
        ];
    }
    if (schemaTypes.includes('string')) {
        if (schema.format === 'date-time') {
            return '2026-01-01T00:00:00.000Z';
        }
        if (schema.format === 'date') {
            return '2026-01-01';
        }
        if (propertyName.toLowerCase().includes('model')) {
            return 'string';
        }
        return 'string';
    }
    if (schemaTypes.includes('integer') || schemaTypes.includes('number')) {
        return 0;
    }
    if (schemaTypes.includes('boolean')) {
        return true;
    }
    if (schema.nullable || schemaTypes.includes('null')) {
        return null;
    }
    return null;
}
function mergeAllOfSchemas(schema, spec, seenRefs) {
    const merged = {
        ...schema,
        allOf: undefined,
        properties: { ...(schema.properties ?? {}) },
        required: [...(schema.required ?? [])],
    };
    let mergedSeenRefs = new Set(seenRefs);
    for (const part of schema.allOf ?? []) {
        const resolved = resolveOpenApiSchema(part, spec, new Set(mergedSeenRefs));
        if (!resolved) {
            continue;
        }
        mergedSeenRefs = new Set([...mergedSeenRefs, ...resolved.seenRefs]);
        merged.type = merged.type || resolved.schema.type;
        merged.description = merged.description || resolved.schema.description;
        merged.additionalProperties = merged.additionalProperties ?? resolved.schema.additionalProperties;
        merged.properties = {
            ...(merged.properties ?? {}),
            ...(resolved.schema.properties ?? {}),
        };
        merged.required = Array.from(new Set([...(merged.required ?? []), ...(resolved.schema.required ?? [])]));
    }
    if (Object.keys(merged.properties ?? {}).length === 0) {
        delete merged.properties;
    }
    if ((merged.required ?? []).length === 0) {
        delete merged.required;
    }
    return {
        schema: merged,
        schemaName: schema.title,
        seenRefs: mergedSeenRefs,
    };
}
function resolveLocalSchemaRef(spec, ref) {
    const schemaName = schemaNameFromRef(ref);
    if (!schemaName) {
        return undefined;
    }
    return spec?.components?.schemas?.[schemaName];
}
function schemaNameFromRef(ref) {
    if (!ref || !ref.startsWith('#/components/schemas/')) {
        return undefined;
    }
    return decodeJsonPointerSegment(ref.slice('#/components/schemas/'.length));
}
function decodeJsonPointerSegment(segment) {
    return segment.replace(/~1/g, '/').replace(/~0/g, '~');
}
function normalizedSchemaTypes(schema) {
    if (Array.isArray(schema.type)) {
        return schema.type;
    }
    if (typeof schema.type === 'string') {
        return [schema.type];
    }
    if (schema.properties || schema.additionalProperties) {
        return ['object'];
    }
    if (schema.items) {
        return ['array'];
    }
    return [];
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
//# sourceMappingURL=openapiSchemaRuntime.js.map