import { resolveApiRequestUrl, } from '@sdkwork/documents-pc-commons/runtime';
import { generateOpenApiSchemaExample, getDocumentedRequestMediaType, getDocumentedRequestSchema, getDocumentedResponseMediaType, getDocumentedResponseSchema, getOpenApiSchemaName, schemaToApiParameters, schemaToTypeLabel, schemaToTypescriptType, } from '@sdkwork/documents-pc-api-reference/openapiSchemaRuntime';
export function buildSdkEndpointDocumentation(endpoint, sdkData, languageId = 'typescript') {
    const language = normalizeDocumentationLanguage(languageId);
    const surface = resolveSdkOperationSurface(endpoint, language);
    const methodName = surface.methodName;
    const groupName = surface.clientPath.join('.');
    const requestUrl = resolveApiRequestUrl(sdkData.baseUrl, endpoint.path);
    const requestMediaType = getDocumentedRequestMediaType(endpoint.openApiOperation?.requestBody);
    const requestSchema = getDocumentedRequestSchema(endpoint.openApiOperation?.requestBody);
    const responseMediaType = getDocumentedResponseMediaType(getSuccessResponseContent(endpoint));
    const responseSchema = getDocumentedResponseSchema(getSuccessResponseContent(endpoint));
    const bodyType = schemaToSdkType(requestSchema, endpoint, fallbackObjectType(language), language);
    const responseType = schemaToSdkType(responseSchema, endpoint, fallbackVoidType(language), language, responseMediaType?.contentType);
    const hasRequestBody = Boolean(requestSchema);
    const operationParameters = operationToSdkParameters(endpoint, language);
    const pathParameters = operationParameters.filter((parameter) => parameter.location === 'path');
    const queryParameters = operationParameters.filter((parameter) => parameter.location === 'query');
    const bodyParameters = hasRequestBody
        ? schemaToApiParameters(requestSchema, { spec: endpoint.openApiSpec })
        : [];
    const hasSdkParams = queryParameters.length > 0;
    const paramsRequired = queryParameters.some((parameter) => Boolean(parameter.required));
    const paramsType = hasSdkParams
        ? `${surface.classBaseName}${toPascalCase(splitIdentifier(methodName))}Params`
        : '';
    const requestType = hasRequestBody
        ? bodyType
        : hasSdkParams
            ? paramsType
            : fallbackObjectType(language);
    const signature = buildSignature(language, {
        methodName,
        requestType,
        responseType,
        hasRequestBody,
        hasSdkParams,
        paramsRequired,
        paramsType,
        bodyType,
        pathParameters,
    });
    const parameters = [...operationParameters, ...bodyParameters];
    const returns = schemaToApiParameters(responseSchema, { spec: endpoint.openApiSpec });
    const codeDefinition = buildCodeDefinition(endpoint, language, {
        methodName,
        requestType,
        responseType,
        hasRequestBody,
        hasSdkParams,
        paramsRequired,
        paramsType,
        bodyType,
        parameters,
        operationParameters,
        pathParameters,
        queryParameters,
        bodyParameters,
        signature,
        requestContentType: requestMediaType?.contentType,
    });
    const exampleUsage = buildExampleUsage(endpoint, sdkData, language, {
        methodName,
        groupName,
        clientPath: surface.clientPath,
        requestUrl,
        hasRequestBody,
        hasSdkParams,
        requestSchema,
        responseSchema,
        operationParameters,
        pathParameters,
        queryParameters,
        requestContentType: requestMediaType?.contentType,
    });
    return {
        languageLabel: language,
        methodName,
        groupName,
        requestType,
        responseType,
        signature,
        codeDefinition,
        exampleUsage,
        parameters,
        returns,
    };
}
function buildCodeDefinition(endpoint, language, input) {
    if (language === 'python') {
        return buildPythonCodeDefinition(endpoint, input);
    }
    if (language === 'go') {
        return buildGoCodeDefinition(endpoint, input);
    }
    if (language === 'java') {
        return buildJavaCodeDefinition(endpoint, input);
    }
    if (language === 'ruby') {
        return buildRubyCodeDefinition(endpoint, input);
    }
    if (language === 'php') {
        return buildPhpCodeDefinition(endpoint, input);
    }
    if (language === 'csharp') {
        return buildCsharpCodeDefinition(endpoint, input);
    }
    if (language === 'rust') {
        return buildRustCodeDefinition(endpoint, input);
    }
    if (language === 'flutter' || language === 'dart') {
        return buildFlutterCodeDefinition(endpoint, input);
    }
    const lines = [
        '/**',
        ` * ${endpoint.description || endpoint.name}`,
    ];
    for (const parameter of input.pathParameters) {
        lines.push(` * @param ${parameter.sdkName} - OpenAPI path parameter \`${parameter.name}\`. ${parameter.desc || parameter.type}`);
    }
    if (input.hasSdkParams) {
        lines.push(` * @param params - ${input.paramsType} query parameters.`);
        for (const parameter of input.queryParameters) {
            lines.push(` * @param params.${parameter.sdkName} - ${parameter.desc || parameter.type}`);
        }
    }
    if (input.hasRequestBody) {
        lines.push(` * @param body - ${input.bodyType} ${formatRequestContentType(input.requestContentType)} request body.`);
        for (const parameter of input.bodyParameters) {
            lines.push(` * @param body.${parameter.name} - ${parameter.desc || parameter.type}`);
        }
    }
    lines.push(` * @returns ${input.responseType}`);
    lines.push(' */');
    lines.push(input.signature);
    return lines.join('\n');
}
function buildExampleUsage(endpoint, sdkData, language, input) {
    const paramsExample = input.hasSdkParams
        ? buildSdkParamsExample(input.queryParameters)
        : undefined;
    const requestExample = input.hasRequestBody
        ? generateOpenApiSchemaExample(input.requestSchema, { spec: endpoint.openApiSpec }, 'body')
        : undefined;
    const responseExample = generateOpenApiSchemaExample(input.responseSchema, { spec: endpoint.openApiSpec }, 'response');
    if (language === 'python') {
        return buildPythonExampleUsage(sdkData, input, paramsExample, requestExample, responseExample);
    }
    if (language === 'go') {
        return buildGoExampleUsage(sdkData, input, paramsExample, requestExample, responseExample);
    }
    if (language === 'java') {
        return buildJavaExampleUsage(sdkData, input, paramsExample, requestExample, responseExample);
    }
    if (language === 'ruby') {
        return buildRubyExampleUsage(sdkData, input, paramsExample, requestExample, responseExample);
    }
    if (language === 'php') {
        return buildPhpExampleUsage(sdkData, input, paramsExample, requestExample, responseExample);
    }
    if (language === 'csharp') {
        return buildCsharpExampleUsage(sdkData, input, paramsExample, requestExample, responseExample);
    }
    if (language === 'rust') {
        return buildRustExampleUsage(sdkData, input, paramsExample, requestExample, responseExample);
    }
    if (language === 'flutter' || language === 'dart') {
        return buildFlutterExampleUsage(sdkData, input, paramsExample, requestExample, responseExample);
    }
    const methodCall = `client.${input.groupName}.${input.methodName}(${formatTsArguments(input, paramsExample, requestExample, 4)})`;
    const responseComment = formatCommentedJson(responseExample, 4, '// ');
    return `import { ${sdkData.name} } from '${sdkData.packageName}';

const client = new ${sdkData.name}({
  baseUrl: "${input.requestUrl.baseUrl || sdkData.baseUrl}",
  authToken: "YOUR_TOKEN",
});

async function main() {
  try {
    const response = await ${methodCall};
    return response;
    // Example Response:
${responseComment}
  } catch (error) {
    throw error;
  }
}

main();`;
}
function schemaToSdkType(schema, endpoint, fallback = 'Record<string, unknown>', language = 'typescript', contentType) {
    if (!schema) {
        return fallback;
    }
    if (isBinaryResponseSchema(schema, contentType)) {
        return binaryResponseType(language);
    }
    const schemaName = getOpenApiSchemaName(schema);
    if (schemaName && schemaName !== 'JsonObject') {
        return schemaName;
    }
    const typescriptType = schemaToTypescriptType(schema, { spec: endpoint.openApiSpec });
    if (typescriptType === 'Record<string, unknown>') {
        return fallbackObjectType(language);
    }
    if (language === 'typescript') {
        return typescriptType;
    }
    return translatePrimitiveType(typescriptType, language);
}
function isBinaryResponseSchema(schema, contentType) {
    return contentType?.toLowerCase().startsWith('application/octet-stream') === true
        || schema.format?.toLowerCase() === 'binary';
}
function binaryResponseType(language) {
    if (language === 'python')
        return 'bytes';
    if (language === 'go')
        return '[]byte';
    if (language === 'java')
        return 'byte[]';
    if (language === 'ruby')
        return 'String';
    if (language === 'php')
        return 'string';
    if (language === 'csharp')
        return 'byte[]';
    if (language === 'rust')
        return 'Vec<u8>';
    if (language === 'flutter' || language === 'dart')
        return 'Uint8List';
    return 'Blob';
}
function formatRequestContentType(contentType) {
    if (!contentType) {
        return 'JSON';
    }
    if (contentType.toLowerCase().startsWith('application/json')) {
        return 'JSON';
    }
    return contentType;
}
function operationToSdkParameters(endpoint, language) {
    const seen = new Set();
    const parameters = [
        ...(endpoint.openApiPathItem?.parameters ?? []),
        ...(endpoint.openApiOperation?.parameters ?? []),
    ];
    return parameters.flatMap((parameter) => {
        const name = parameter.name?.trim();
        const location = parameter.in?.trim();
        if (!name || !location || (location !== 'path' && location !== 'query')) {
            return [];
        }
        const key = `${location}:${name}`;
        if (seen.has(key)) {
            return [];
        }
        seen.add(key);
        const type = parameter.schema ? schemaToTypeLabel(parameter.schema, { spec: endpoint.openApiSpec }) : 'string';
        return [{
                name,
                sdkName: parameterSdkName(name, language),
                sdkType: sdkParameterType(type, language),
                location,
                type,
                desc: parameter.description || `${location} parameter.`,
                required: parameter.required || location === 'path',
            }];
    });
}
function sdkParameterType(type, language) {
    if (type.startsWith('array<') && type.endsWith('>')) {
        const itemType = sdkParameterType(type.slice(6, -1), language);
        if (language === 'python')
            return `list[${itemType}]`;
        if (language === 'go')
            return `[]${itemType}`;
        if (language === 'rust')
            return `Vec<${itemType}>`;
        return `${itemType}[]`;
    }
    if (type === 'integer') {
        if (language === 'python')
            return 'int';
        if (language === 'go' || language === 'rust')
            return 'int';
        if (language === 'java' || language === 'csharp')
            return 'Integer';
        return 'number';
    }
    if (type === 'string<binary>') {
        return binaryResponseType(language);
    }
    return translatePrimitiveType(type, language);
}
function buildSdkParamsExample(parameters) {
    return Object.fromEntries(parameters.map((parameter) => [
        parameter.sdkName,
        sdkParameterExample(parameter),
    ]));
}
function sdkParameterExample(parameter) {
    const type = parameter.type.toLowerCase();
    if (type.includes('integer') || type.includes('number')) {
        return 0;
    }
    if (type.includes('boolean')) {
        return true;
    }
    if (type.startsWith('array<')) {
        return ['string'];
    }
    if (parameter.name.toLowerCase().includes('order')) {
        return 'asc';
    }
    return parameter.name.toLowerCase().includes('id')
        ? parameter.name
        : 'string';
}
function getSuccessResponseContent(endpoint) {
    const response = endpoint.openApiOperation?.responses?.['200'] || endpoint.openApiOperation?.responses?.['201'];
    return response?.content;
}
function normalizeDocumentationLanguage(languageId) {
    const language = languageId.toLowerCase();
    if (language === 'node' || language === 'javascript') {
        return 'typescript';
    }
    if (language === 'c#') {
        return 'csharp';
    }
    if (language === 'dart') {
        return 'flutter';
    }
    return language;
}
function buildSignature(language, input) {
    const sdkParams = buildSignatureParameters(language, input);
    if (language === 'python') {
        return `def ${input.methodName}(${sdkParams.join(', ')}) -> ${input.responseType}`;
    }
    if (language === 'go') {
        return `func (c *Client) ${input.methodName}(ctx context.Context${sdkParams.length > 0 ? `, ${sdkParams.join(', ')}` : ''}) (${input.responseType}, error)`;
    }
    if (language === 'java') {
        return `public ${input.responseType} ${input.methodName}(${sdkParams.join(', ')})`;
    }
    if (language === 'ruby') {
        return sdkParams.length > 0 ? `def ${input.methodName}(${sdkParams.join(', ')})` : `def ${input.methodName}`;
    }
    if (language === 'php') {
        const responseType = input.responseType === 'void' ? 'void' : input.responseType;
        return `public function ${input.methodName}(${sdkParams.join(', ')}): ${responseType}`;
    }
    if (language === 'csharp') {
        return `Task<${input.responseType}> ${input.methodName}Async(${sdkParams.join(', ')})`;
    }
    if (language === 'rust') {
        return `pub async fn ${input.methodName}(&self${sdkParams.length > 0 ? `, ${sdkParams.join(', ')}` : ''}) -> Result<${input.responseType}, Error>`;
    }
    if (language === 'flutter' || language === 'dart') {
        return `Future<${input.responseType}> ${input.methodName}(${sdkParams.join(', ')})`;
    }
    return `async ${input.methodName}(${sdkParams.join(', ')}): Promise<${input.responseType}>`;
}
function buildSignatureParameters(language, input) {
    const parameters = [];
    for (const parameter of input.pathParameters) {
        const type = parameter.sdkType;
        if (language === 'go') {
            parameters.push(`${parameter.sdkName} ${type}`);
        }
        else if (language === 'java') {
            parameters.push(`${type} ${parameter.sdkName}`);
        }
        else if (language === 'php') {
            parameters.push(`$${parameter.sdkName}`);
        }
        else if (language === 'csharp') {
            parameters.push(`${type} ${parameter.sdkName}`);
        }
        else if (language === 'rust') {
            parameters.push(`${parameter.sdkName}: ${type}`);
        }
        else {
            parameters.push(`${parameter.sdkName}: ${type}`);
        }
    }
    if (input.hasRequestBody) {
        if (language === 'python') {
            parameters.push(`body: ${input.bodyType}`);
        }
        else if (language === 'go') {
            parameters.push(`body ${input.bodyType}`);
        }
        else if (language === 'java') {
            parameters.push(`${input.bodyType} body`);
        }
        else if (language === 'ruby') {
            parameters.push('body');
        }
        else if (language === 'php') {
            parameters.push('array $body');
        }
        else if (language === 'csharp') {
            parameters.push(`${input.bodyType} body`);
        }
        else if (language === 'rust') {
            parameters.push(`body: ${input.bodyType}`);
        }
        else if (language === 'flutter' || language === 'dart') {
            parameters.push(`${input.bodyType} body`);
        }
        else {
            parameters.push(`body: ${input.bodyType}`);
        }
    }
    if (input.hasSdkParams) {
        if (language === 'python') {
            parameters.push(input.paramsRequired ? `params: ${input.paramsType}` : `params: ${input.paramsType} | None = None`);
        }
        else if (language === 'go') {
            parameters.push(`params ${input.paramsType}`);
        }
        else if (language === 'java') {
            parameters.push(`${input.paramsType} params`);
        }
        else if (language === 'ruby') {
            parameters.push(input.paramsRequired ? 'params' : 'params = {}');
        }
        else if (language === 'php') {
            parameters.push(input.paramsRequired ? 'array $requestParams' : 'array $requestParams = []');
        }
        else if (language === 'csharp') {
            parameters.push(input.paramsRequired ? `${input.paramsType} requestParams` : `${input.paramsType}? requestParams = null`);
        }
        else if (language === 'rust') {
            parameters.push(input.paramsRequired ? `params: ${input.paramsType}` : `params: Option<${input.paramsType}>`);
        }
        else if (language === 'flutter' || language === 'dart') {
            parameters.push(input.paramsRequired ? `${input.paramsType} params` : `${input.paramsType}? params`);
        }
        else {
            parameters.push(input.paramsRequired ? `params: ${input.paramsType}` : `params?: ${input.paramsType}`);
        }
    }
    return parameters;
}
function resolveSdkOperationSurface(endpoint, language) {
    const rootProperty = sdkRootPropertyName(endpoint, language);
    const resourcePath = sdkResourcePath(endpoint, rootProperty);
    const clientPath = [
        rootProperty,
        ...resourcePath.slice(1).map((segment) => formatPropertyName(segment, language)),
    ];
    const methodName = sdkResourceMethodName(endpoint, resourcePath, language)
        || toSdkMethodName(endpoint, language);
    const classBaseName = toPascalCase(clientPath.flatMap(splitIdentifier));
    return { clientPath, methodName, classBaseName };
}
function sdkRootPropertyName(endpoint, language) {
    const configuredDomain = configuredPrefixDomain(endpoint);
    if (configuredDomain) {
        return formatPropertyName(openAiStyleResourceName(configuredDomain), language);
    }
    const tag = endpoint.openApiOperation?.tags?.[0]?.trim();
    if (tag) {
        return formatPropertyName(tag, language);
    }
    const firstSegment = relativePathSegments(endpoint).find((segment) => !isPathParameterSegment(segment));
    return formatPropertyName(firstSegment || 'default', language);
}
function configuredPrefixDomain(endpoint) {
    const prefixSegments = ['v1'];
    const pathSegments = normalizedGroupPathSegments(endpoint.path);
    if (!startsWithCanonicalSegments(pathSegments, prefixSegments) || pathSegments.length <= prefixSegments.length) {
        return undefined;
    }
    const domainCandidates = pathSegments.slice(prefixSegments.length);
    return domainCandidates.find((segment) => !isReservedGroupSegmentAfterPrefix(segment))
        || domainCandidates[0];
}
function normalizedGroupPathSegments(path) {
    return rawPathSegments(path)
        .filter((segment) => !isPathParameterSegment(segment))
        .map(normalizeStaticSegment)
        .filter(Boolean)
        .map((segment) => isReservedTagPathSegment(segment) ? segment : singularize(segment))
        .filter(Boolean);
}
function openAiStyleResourceName(rawName) {
    const names = {
        assistant: 'assistants',
        batch: 'batches',
        embedding: 'embeddings',
        file: 'files',
        'fine-tuning': 'fine-tuning',
        image: 'images',
        model: 'models',
        moderation: 'moderations',
        response: 'responses',
        thread: 'threads',
        upload: 'uploads',
        'vector-store': 'vector-stores',
    };
    const key = splitIdentifier(rawName).join('-');
    return names[key] || rawName;
}
function sdkResourcePath(endpoint, fallbackRootSegment) {
    return sdkOperationIdResourcePath(endpoint, fallbackRootSegment)
        || sdkPathResourcePath(endpoint, fallbackRootSegment);
}
function sdkOperationIdResourcePath(endpoint, fallbackRootSegment) {
    const operationId = endpoint.openApiOperation?.operationId;
    if (!operationId?.includes('.')) {
        return undefined;
    }
    const parts = operationId.split('.').map((part) => part.trim()).filter(Boolean);
    if (parts.length < 2) {
        return undefined;
    }
    const resourceParts = parts
        .slice(0, -1)
        .map(normalizeStaticSegment)
        .filter(Boolean);
    if (resourceParts.length === 0) {
        return undefined;
    }
    const root = normalizeStaticSegment(fallbackRootSegment);
    if (!root || canonicalResourcePart(resourceParts[0]) === canonicalResourcePart(root)) {
        return resourceParts;
    }
    return [root, ...resourceParts];
}
function sdkPathResourcePath(endpoint, fallbackRootSegment) {
    const relativeSegments = relativePathSegments(endpoint);
    const tagParts = stripGenericTagSuffix(splitIdentifier(endpoint.openApiOperation?.tags?.[0] || ''));
    const resourceIndex = findResourceSegmentIndex(relativeSegments, tagParts)
        ?? relativeSegments.findIndex((segment) => !isPathParameterSegment(segment));
    const resourceSegments = relativeSegments
        .slice(resourceIndex < 0 ? 0 : resourceIndex)
        .filter((segment) => !isPathParameterSegment(segment))
        .map(normalizeStaticSegment)
        .filter(Boolean);
    if (isTerminalResourceAction(resourceSegments)) {
        resourceSegments.pop();
    }
    if (resourceSegments.length > 0) {
        return resourceSegments;
    }
    const root = normalizeStaticSegment(fallbackRootSegment);
    return root ? [root] : ['default'];
}
function sdkResourceMethodName(endpoint, resourcePath, language) {
    const name = dottedOperationActionName(endpoint, resourcePath)
        || resourceActionName(endpoint, resourcePath);
    return name ? formatPropertyName(name, language) : undefined;
}
function dottedOperationActionName(endpoint, resourcePath) {
    const operationId = endpoint.openApiOperation?.operationId;
    if (!operationId?.includes('.')) {
        return undefined;
    }
    const parts = operationId.split('.').map((part) => part.trim()).filter(Boolean);
    if (parts.length < 2) {
        return undefined;
    }
    const resourceParts = parts.slice(0, -1).map(normalizeStaticSegment).filter(Boolean);
    const canonicalResourcePath = resourcePath.slice(1).map(canonicalResourcePart);
    const comparablePath = canonicalResourcePath.slice(-resourceParts.length);
    if (resourceParts.length > 0 && !sameCanonicalParts(resourceParts, comparablePath)) {
        return undefined;
    }
    return parts.at(-1);
}
function resourceActionName(endpoint, resourcePath) {
    const relativeSegments = relativePathSegments(endpoint);
    const resourceIndex = findResourcePathEndIndex(relativeSegments, resourcePath);
    if (resourceIndex === undefined) {
        return undefined;
    }
    const suffix = relativeSegments.slice(resourceIndex + 1);
    const suffixSegments = suffix
        .filter((segment) => !isPathParameterSegment(segment))
        .map(normalizeStaticSegment)
        .filter(Boolean);
    const hasCurrentPathParams = suffix.some(isPathParameterSegment);
    if (suffixSegments.length === 1 && isActionSegment(suffixSegments[0])) {
        return suffixSegments[0];
    }
    const method = endpoint.method.toLowerCase();
    if (method === 'get' && suffixSegments.length === 1 && isTerminalCollectionAction(resourcePath, suffixSegments[0])) {
        return `list${toPascalCase(splitIdentifier(suffixSegments[0]))}`;
    }
    if (suffixSegments.length === 0) {
        if (method === 'get')
            return hasCurrentPathParams ? 'retrieve' : 'list';
        if (method === 'post')
            return hasCurrentPathParams ? 'update' : 'create';
        if (method === 'put' || method === 'patch')
            return 'update';
        if (method === 'delete')
            return 'delete';
    }
    if (suffixSegments.length > 0) {
        const action = method === 'get'
            ? hasCurrentPathParams ? 'retrieve' : 'list'
            : method === 'post'
                ? 'create'
                : method === 'put' || method === 'patch'
                    ? 'update'
                    : method === 'delete'
                        ? 'delete'
                        : method;
        return `${action}${renderNestedSuffixName(suffixSegments, action)}`;
    }
    return undefined;
}
function renderNestedSuffixName(suffixSegments, action) {
    return suffixSegments
        .map((segment, index) => {
        const normalized = normalizeStaticSegment(segment);
        const displaySegment = action === 'create' && index + 1 === suffixSegments.length
            ? canonicalResourcePart(normalized)
            : normalized;
        return toPascalCase(splitIdentifier(displaySegment));
    })
        .join('');
}
function relativePathSegments(endpoint) {
    const segments = rawPathSegments(endpoint.path);
    for (const prefix of [
        ['app', 'v3', 'api'],
        ['backend', 'v3', 'api'],
        ['v1'],
    ]) {
        if (startsWithCanonicalSegments(segments, prefix)) {
            return segments.slice(prefix.length);
        }
    }
    return segments;
}
function rawPathSegments(path) {
    return path.split('/').map((segment) => segment.trim()).filter(Boolean);
}
function startsWithCanonicalSegments(pathSegments, prefixSegments) {
    if (pathSegments.length < prefixSegments.length) {
        return false;
    }
    return prefixSegments.every((segment, index) => normalizeStaticSegment(pathSegments[index]) === segment);
}
function findResourceSegmentIndex(pathSegments, tagParts) {
    if (pathSegments.length === 0 || tagParts.length === 0) {
        return undefined;
    }
    const normalizedPath = pathSegments.map(normalizeStaticSegment);
    for (let length = Math.min(tagParts.length, normalizedPath.length); length >= 1; length -= 1) {
        const tagSuffix = tagParts.slice(tagParts.length - length);
        for (let index = 0; index <= normalizedPath.length - length; index += 1) {
            if (sameCanonicalParts(normalizedPath.slice(index, index + length), tagSuffix)) {
                return index + length - 1;
            }
        }
    }
    return undefined;
}
function findResourcePathEndIndex(pathSegments, resourcePath) {
    if (pathSegments.length === 0 || resourcePath.length === 0) {
        return undefined;
    }
    let resourceIndex = 0;
    for (let pathIndex = 0; pathIndex < pathSegments.length; pathIndex += 1) {
        const segment = pathSegments[pathIndex];
        if (isPathParameterSegment(segment)) {
            continue;
        }
        if (canonicalResourcePart(normalizeStaticSegment(segment)) !== canonicalResourcePart(resourcePath[resourceIndex])) {
            continue;
        }
        resourceIndex += 1;
        if (resourceIndex === resourcePath.length) {
            return pathIndex;
        }
    }
    return undefined;
}
function sameCanonicalParts(left, right) {
    return left.length === right.length
        && left.every((part, index) => canonicalResourcePart(part) === canonicalResourcePart(right[index]));
}
function canonicalResourcePart(value) {
    const lower = value.toLowerCase();
    if (lower.endsWith('sses') && lower.length > 4) {
        return lower.slice(0, -2);
    }
    if (lower.length > 4
        && (lower.endsWith('ches')
            || lower.endsWith('shes')
            || lower.endsWith('xes')
            || lower.endsWith('zes'))) {
        return lower.slice(0, -2);
    }
    if (lower.endsWith('ies') && lower.length > 3) {
        return `${lower.slice(0, -3)}y`;
    }
    if (lower.length > 3 && lower.endsWith('s') && !lower.endsWith('ss')) {
        return lower.slice(0, -1);
    }
    return lower;
}
function normalizeStaticSegment(value) {
    return splitIdentifier(value).join('_');
}
function singularize(value) {
    const input = value.trim().toLowerCase();
    if (!input || input === 'news' || input.endsWith('news') || input.endsWith('us') || input.endsWith('is')) {
        return input;
    }
    if (input.endsWith('ies') && input.length > 3) {
        return `${input.slice(0, -3)}y`;
    }
    if (input.length > 4
        && (input.endsWith('sses')
            || input.endsWith('ches')
            || input.endsWith('shes')
            || input.endsWith('xes')
            || input.endsWith('zes'))) {
        return input.slice(0, -2);
    }
    if (input.length > 3 && input.endsWith('s') && !input.endsWith('ss')) {
        return input.slice(0, -1);
    }
    return input;
}
function stripGenericTagSuffix(parts) {
    const result = [...parts];
    while (result.length > 1) {
        const last = result.at(-1);
        if (!last || !['management', 'controller', 'module', 'service', 'api'].includes(last)) {
            break;
        }
        result.pop();
    }
    return result;
}
function isPathParameterSegment(value) {
    return value.startsWith('{') && value.endsWith('}');
}
function isTerminalResourceAction(resourceSegments) {
    if (resourceSegments.length <= 1) {
        return false;
    }
    const terminalSegment = resourceSegments.at(-1) || '';
    return isActionSegment(terminalSegment)
        || isTerminalCollectionAction(resourceSegments.slice(0, -1), terminalSegment);
}
function isTerminalCollectionAction(parentResourcePath, segment) {
    const normalizedSegment = normalizeStaticSegment(segment);
    return [
        { parentResourcePath: ['fine_tuning', 'jobs'], segment: 'events' },
        { parentResourcePath: ['vector_stores', 'file_batches'], segment: 'files' },
    ].some((rule) => (canonicalResourcePart(rule.segment) === canonicalResourcePart(normalizedSegment)
        && resourcePathMatches(rule.parentResourcePath, parentResourcePath)));
}
function resourcePathMatches(rulePath, resourcePath) {
    return rulePath.length === resourcePath.length
        && rulePath.every((segment, index) => canonicalResourcePart(segment) === canonicalResourcePart(resourcePath[index]));
}
function isReservedTagPathSegment(segment) {
    return [
        'api',
        'app',
        'ai',
        'backend',
        'openapi',
        'docs',
        'swagger',
        'v1',
        'v2',
        'v3',
        'v4',
        'v5',
    ].includes(segment);
}
function isReservedGroupSegmentAfterPrefix(segment) {
    return ['management', 'manage', 'admin', 'internal'].includes(segment);
}
function isActionSegment(segment) {
    return [
        'cancel',
        'compact',
        'complete',
        'content',
        'pause',
        'resume',
        'search',
        'submit_tool_outputs',
    ].includes(normalizeStaticSegment(segment));
}
function formatPropertyName(value, language) {
    const words = splitIdentifier(value);
    if (language === 'python' || language === 'ruby' || language === 'rust') {
        return toSnakeCase(words);
    }
    if (language === 'go' || language === 'csharp') {
        return toPascalCase(words);
    }
    return toLowerCamel(words);
}
function parameterSdkName(name, language) {
    return formatPropertyName(name, language);
}
function toSdkMethodName(endpoint, language) {
    const baseName = endpoint.openApiOperation?.operationId || `${endpoint.method.toLowerCase()}${endpoint.path
        .replace(/[^a-zA-Z0-9]+(.)/g, upperPathSegment)
        .replace(/[^a-zA-Z0-9]/g, '')}`;
    const words = splitIdentifier(baseName);
    if (language === 'python' || language === 'ruby' || language === 'rust') {
        return toSnakeCase(words);
    }
    if (language === 'go' || language === 'csharp') {
        return toPascalCase(words);
    }
    return toLowerCamel(words);
}
function toSdkGroupName(tag, language) {
    const firstSegment = (tag || 'default').split('/')[0] || 'default';
    const words = splitIdentifier(firstSegment);
    if (words.length === 0) {
        return language === 'go' || language === 'csharp' ? 'Default' : 'default';
    }
    if (language === 'python' || language === 'ruby' || language === 'rust') {
        return toSnakeCase(words);
    }
    if (language === 'go' || language === 'csharp') {
        return toPascalCase(words);
    }
    return toLowerCamel(words);
}
function upperPathSegment(_match, chr) {
    return chr.toUpperCase();
}
function splitIdentifier(value) {
    return value
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .replace(/[^a-zA-Z0-9]+/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word.toLowerCase());
}
function toLowerCamel(words) {
    if (words.length === 0) {
        return 'default';
    }
    const [first, ...rest] = words;
    return [first, ...rest.map(capitalize)].join('');
}
function toPascalCase(words) {
    return words.length > 0 ? words.map(capitalize).join('') : 'Default';
}
function toSnakeCase(words) {
    return words.length > 0 ? words.join('_') : 'default';
}
function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}
function fallbackObjectType(language) {
    if (language === 'python')
        return 'dict[str, object]';
    if (language === 'go')
        return 'map[string]any';
    if (language === 'java')
        return 'Map<String, Object>';
    if (language === 'ruby')
        return 'Hash';
    if (language === 'php')
        return 'array';
    if (language === 'csharp')
        return 'Dictionary<string, object?>';
    if (language === 'rust')
        return 'serde_json::Value';
    if (language === 'flutter' || language === 'dart')
        return 'Map<String, dynamic>';
    return 'Record<string, unknown>';
}
function fallbackVoidType(language) {
    if (language === 'python')
        return 'None';
    if (language === 'go')
        return 'struct{}';
    if (language === 'java')
        return 'Void';
    if (language === 'ruby')
        return 'nil';
    if (language === 'php')
        return 'void';
    if (language === 'csharp')
        return 'Void';
    if (language === 'rust')
        return '()';
    if (language === 'flutter' || language === 'dart')
        return 'void';
    return 'void';
}
function translatePrimitiveType(type, language) {
    if (type === 'string') {
        if (language === 'go')
            return 'string';
        if (language === 'java' || language === 'csharp')
            return 'String';
        if (language === 'rust')
            return 'String';
        return language === 'typescript' ? 'string' : 'str';
    }
    if (type === 'number') {
        if (language === 'python')
            return 'float';
        if (language === 'go' || language === 'java' || language === 'csharp')
            return 'double';
        if (language === 'rust')
            return 'f64';
        if (language === 'flutter' || language === 'dart')
            return 'num';
        return type;
    }
    if (type === 'integer') {
        if (language === 'python')
            return 'int';
        if (language === 'go' || language === 'rust')
            return 'int';
        if (language === 'java' || language === 'csharp')
            return 'Integer';
        if (language === 'flutter' || language === 'dart')
            return 'int';
        return 'number';
    }
    if (type === 'boolean') {
        if (language === 'python')
            return 'bool';
        if (language === 'java')
            return 'Boolean';
        if (language === 'csharp')
            return 'bool';
        if (language === 'rust')
            return 'bool';
        return language === 'typescript' ? 'boolean' : 'bool';
    }
    return type;
}
function buildPythonCodeDefinition(endpoint, input) {
    const lines = [
        `${input.signature}:`,
        '    """',
        `    ${endpoint.description || endpoint.name}`,
    ];
    if (input.pathParameters.length > 0 || input.hasSdkParams || input.hasRequestBody) {
        lines.push('', '    Args:');
    }
    for (const parameter of input.pathParameters) {
        lines.push(`        ${parameter.sdkName}: OpenAPI path parameter \`${parameter.name}\`. ${parameter.desc || parameter.type}`);
    }
    if (input.hasSdkParams) {
        lines.push(`        params: ${input.paramsType} query parameters.`);
        for (const parameter of input.queryParameters) {
            lines.push(`        params.${parameter.sdkName}: ${parameter.desc || parameter.type}`);
        }
    }
    if (input.hasRequestBody) {
        lines.push(`        body: ${input.bodyType} ${formatRequestContentType(input.requestContentType)} request body.`);
        for (const parameter of input.bodyParameters) {
            lines.push(`        body.${parameter.name}: ${parameter.desc || parameter.type}`);
        }
    }
    lines.push('', '    Returns:', `        ${input.responseType}`, '    """');
    return lines.join('\n');
}
function buildGoCodeDefinition(endpoint, input) {
    const lines = [`// ${input.methodName} ${endpoint.description || endpoint.name}.`];
    for (const parameter of input.pathParameters) {
        lines.push(`// ${parameter.sdkName}: OpenAPI path parameter ${parameter.name}. ${parameter.desc || parameter.type}`);
    }
    if (input.hasSdkParams) {
        lines.push(`// params is a ${input.paramsType} value containing query parameters.`);
        for (const parameter of input.queryParameters) {
            lines.push(`// params.${parameter.sdkName}: ${parameter.desc || parameter.type}`);
        }
    }
    if (input.hasRequestBody) {
        lines.push(`// body is a ${input.bodyType} ${formatRequestContentType(input.requestContentType)} request body.`);
        for (const parameter of input.bodyParameters) {
            lines.push(`// body.${parameter.name}: ${parameter.desc || parameter.type}`);
        }
    }
    lines.push(`// It returns ${input.responseType}.`, input.signature);
    return lines.join('\n');
}
function buildJavaCodeDefinition(endpoint, input) {
    const lines = ['/**', ` * ${endpoint.description || endpoint.name}`];
    for (const parameter of input.pathParameters) {
        lines.push(` * @param ${parameter.sdkName} OpenAPI path parameter ${parameter.name}. ${parameter.desc || parameter.type}`);
    }
    if (input.hasSdkParams) {
        lines.push(` * @param params ${input.paramsType} query parameters.`);
        for (const parameter of input.queryParameters) {
            lines.push(` * @param params.${parameter.sdkName} ${parameter.desc || parameter.type}`);
        }
    }
    if (input.hasRequestBody) {
        lines.push(` * @param body ${input.bodyType} ${formatRequestContentType(input.requestContentType)} request body.`);
        for (const parameter of input.bodyParameters) {
            lines.push(` * @param body.${parameter.name} ${parameter.desc || parameter.type}`);
        }
    }
    lines.push(` * @return ${input.responseType}`, ' */', `${input.signature};`);
    return lines.join('\n');
}
function buildRubyCodeDefinition(endpoint, input) {
    const lines = [`# ${endpoint.description || endpoint.name}`];
    for (const parameter of input.pathParameters) {
        lines.push(`# @param ${parameter.sdkName} [${parameter.sdkType}] OpenAPI path parameter ${parameter.name}. ${parameter.desc || parameter.type}`);
    }
    if (input.hasSdkParams) {
        lines.push(`# @param params [${input.paramsType}] query parameters.`);
        for (const parameter of input.queryParameters) {
            lines.push(`# @param params.${parameter.sdkName} [${parameter.sdkType}] ${parameter.desc || parameter.type}`);
        }
    }
    if (input.hasRequestBody) {
        lines.push(`# @param body [${input.bodyType}] ${formatRequestContentType(input.requestContentType)} request body.`);
        for (const parameter of input.bodyParameters) {
            lines.push(`# @param body.${parameter.name} [${parameter.type}] ${parameter.desc || parameter.type}`);
        }
    }
    lines.push(`# @return [${input.responseType}]`, input.signature);
    return lines.join('\n');
}
function buildPhpCodeDefinition(endpoint, input) {
    const lines = ['/**', ` * ${endpoint.description || endpoint.name}`];
    for (const parameter of input.pathParameters) {
        lines.push(` * @param mixed $${parameter.sdkName} OpenAPI path parameter ${parameter.name}. ${parameter.desc || parameter.type}`);
    }
    if (input.hasSdkParams) {
        lines.push(` * @param array $requestParams ${input.paramsType} query parameters.`);
        for (const parameter of input.queryParameters) {
            lines.push(` * @param mixed $requestParams['${parameter.sdkName}'] ${parameter.desc || parameter.type}`);
        }
    }
    if (input.hasRequestBody) {
        lines.push(` * @param array $body ${input.bodyType} ${formatRequestContentType(input.requestContentType)} request body.`);
        for (const parameter of input.bodyParameters) {
            lines.push(` * @param mixed $body['${parameter.name}'] ${parameter.desc || parameter.type}`);
        }
    }
    lines.push(` * @return ${input.responseType}`, ' */', `${input.signature};`);
    return lines.join('\n');
}
function buildCsharpCodeDefinition(endpoint, input) {
    const lines = [
        '/// <summary>',
        `/// ${endpoint.description || endpoint.name}`,
        '/// </summary>',
    ];
    for (const parameter of input.pathParameters) {
        lines.push(`/// <param name="${parameter.sdkName}">OpenAPI path parameter ${parameter.name}. ${parameter.desc || parameter.type}</param>`);
    }
    if (input.hasSdkParams) {
        lines.push(`/// <param name="requestParams">${input.paramsType} query parameters.</param>`);
        for (const parameter of input.queryParameters) {
            lines.push(`/// <param name="requestParams.${parameter.sdkName}">${parameter.desc || parameter.type}</param>`);
        }
    }
    if (input.hasRequestBody) {
        lines.push(`/// <param name="body">${input.bodyType} ${formatRequestContentType(input.requestContentType)} request body.</param>`);
        for (const parameter of input.bodyParameters) {
            lines.push(`/// <param name="body.${parameter.name}">${parameter.desc || parameter.type}</param>`);
        }
    }
    lines.push(`/// <returns>${input.responseType}</returns>`, input.signature);
    return lines.join('\n');
}
function buildRustCodeDefinition(endpoint, input) {
    const lines = [`/// ${endpoint.description || endpoint.name}`];
    for (const parameter of input.pathParameters) {
        lines.push(`/// ${parameter.sdkName}: OpenAPI path parameter ${parameter.name}. ${parameter.desc || parameter.type}`);
    }
    if (input.hasSdkParams) {
        lines.push(`/// params: ${input.paramsType} query parameters.`);
        for (const parameter of input.queryParameters) {
            lines.push(`/// params.${parameter.sdkName}: ${parameter.desc || parameter.type}`);
        }
    }
    if (input.hasRequestBody) {
        lines.push(`/// body: ${input.bodyType} ${formatRequestContentType(input.requestContentType)} request body.`);
        for (const parameter of input.bodyParameters) {
            lines.push(`/// body.${parameter.name}: ${parameter.desc || parameter.type}`);
        }
    }
    lines.push(`/// Returns ${input.responseType}.`, input.signature);
    return lines.join('\n');
}
function buildFlutterCodeDefinition(endpoint, input) {
    const lines = [`/// ${endpoint.description || endpoint.name}`];
    for (const parameter of input.pathParameters) {
        lines.push(`/// [${parameter.sdkName}] is OpenAPI path parameter ${parameter.name}. ${parameter.desc || parameter.type}`);
    }
    if (input.hasSdkParams) {
        lines.push(`/// [params] is a ${input.paramsType} value containing query parameters.`);
        for (const parameter of input.queryParameters) {
            lines.push(`/// params.${parameter.sdkName}: ${parameter.desc || parameter.type}`);
        }
    }
    if (input.hasRequestBody) {
        lines.push(`/// [body] is a ${input.bodyType} ${formatRequestContentType(input.requestContentType)} request body.`);
        for (const parameter of input.bodyParameters) {
            lines.push(`/// body.${parameter.name}: ${parameter.desc || parameter.type}`);
        }
    }
    lines.push(`/// Returns ${input.responseType}.`, `${input.signature};`);
    return lines.join('\n');
}
function buildPythonExampleUsage(sdkData, input, paramsExample, requestExample, responseExample) {
    const packageName = toPythonPackageName(sdkData.packageName);
    const methodCall = `client.${input.groupName}.${input.methodName}(${formatPythonArguments(input, paramsExample, requestExample, 4)})`;
    const responseComment = formatCommentedJson(responseExample, 4, '# ');
    return `from ${packageName} import ${sdkData.name}

client = ${sdkData.name}(
    base_url="${input.requestUrl.baseUrl || sdkData.baseUrl}",
    auth_token="YOUR_TOKEN",
)

response = ${methodCall}
print(response)
# Example Response:
${responseComment}`;
}
function buildGoExampleUsage(sdkData, input, paramsExample, requestExample, responseExample) {
    const paramsValue = formatJsonValue(paramsExample, 2);
    const requestValue = formatJsonValue(requestExample, 2);
    const responseComment = formatCommentedJson(responseExample, 2, '// ');
    const methodCall = `client.${input.groupName}.${input.methodName}(context.Background()${formatNamedCallArguments(input, 'params', 'body', ', ', ', ')})`;
    const pathBlocks = input.pathParameters
        .map((parameter) => `${parameter.sdkName} := ${formatJsonValue(sdkParameterExample(parameter), 2)}\n  `)
        .join('');
    const paramsBlock = input.hasSdkParams ? `params := ${paramsValue}\n  ` : '';
    const bodyBlock = input.hasRequestBody ? `body := ${requestValue}\n` : '';
    return `package main

import (
  "context"
  "fmt"
)

func main() {
  client := ${sdkData.name}.New("${input.requestUrl.baseUrl || sdkData.baseUrl}", "YOUR_TOKEN")
  ${pathBlocks}${paramsBlock}${bodyBlock}response, err := ${methodCall}
  if err != nil {
    panic(err)
  }
  fmt.Println(response)
  // Example Response:
${responseComment}
}`;
}
function buildJavaExampleUsage(sdkData, input, paramsExample, requestExample, responseExample) {
    const methodCall = `client.${input.groupName}().${input.methodName}(${formatNamedCallArguments(input, 'params', 'body', ', ')})`;
    const pathBlocks = input.pathParameters
        .map((parameter) => `Object ${parameter.sdkName} = ${formatJsonValue(sdkParameterExample(parameter), 4)};\n    `)
        .join('');
    const paramsBlock = input.hasSdkParams ? `Object params = ${formatJsonValue(paramsExample, 4)};\n    ` : '';
    const bodyBlock = input.hasRequestBody ? `Object body = ${formatJsonValue(requestExample, 4)};\n    ` : '';
    const responseComment = formatCommentedJson(responseExample, 4, '// ');
    return `import ${sdkData.packageName}.${sdkData.name};

public class Main {
  public static void main(String[] args) {
    ${sdkData.name} client = ${sdkData.name}.builder()
        .baseUrl("${input.requestUrl.baseUrl || sdkData.baseUrl}")
        .authToken("YOUR_TOKEN")
        .build();
    ${pathBlocks}${paramsBlock}${bodyBlock}Object response = ${methodCall};
    System.out.println(response);
    // Example Response:
${responseComment}
  }
}`;
}
function buildRubyExampleUsage(sdkData, input, paramsExample, requestExample, responseExample) {
    const args = formatRubyArguments(input, paramsExample, requestExample, 2);
    const methodCall = args
        ? `client.${input.groupName}.${input.methodName}(${args})`
        : `client.${input.groupName}.${input.methodName}`;
    const responseComment = formatCommentedJson(responseExample, 0, '# ');
    return `require '${sdkData.packageName.replace(/-/g, '_')}'

client = ${sdkData.name}.new(
  base_url: '${input.requestUrl.baseUrl || sdkData.baseUrl}',
  auth_token: 'YOUR_TOKEN'
)

response = ${methodCall}
puts response
# Example Response:
${responseComment}`;
}
function buildPhpExampleUsage(sdkData, input, paramsExample, requestExample, responseExample) {
    const methodCall = `$client->${input.groupName}()->${input.methodName}(${formatPhpArguments(input, paramsExample, requestExample, 2)})`;
    const responseComment = formatCommentedJson(responseExample, 0, '// ');
    return `<?php
require_once 'vendor/autoload.php';

$client = new ${sdkData.name}([
  'base_url' => '${input.requestUrl.baseUrl || sdkData.baseUrl}',
  'auth_token' => 'YOUR_TOKEN',
]);

$response = ${methodCall};
print_r($response);
// Example Response:
${responseComment}`;
}
function buildCsharpExampleUsage(sdkData, input, paramsExample, requestExample, responseExample) {
    const methodCall = `client.${input.groupName}.${input.methodName}Async(${formatNamedCallArguments(input, 'requestParams', 'body', ', ')})`;
    const pathBlocks = input.pathParameters
        .map((parameter) => `var ${parameter.sdkName} = ${formatJsonValue(sdkParameterExample(parameter), 2)};\n`)
        .join('');
    const paramsBlock = input.hasSdkParams ? `var requestParams = ${formatJsonValue(paramsExample, 2)};\n` : '';
    const bodyBlock = input.hasRequestBody ? `var body = ${formatJsonValue(requestExample, 2)};\n` : '';
    const responseComment = formatCommentedJson(responseExample, 0, '// ');
    return `using ${sdkData.packageName};

var client = new ${sdkData.name}("${input.requestUrl.baseUrl || sdkData.baseUrl}", "YOUR_TOKEN");
${pathBlocks}${paramsBlock}${bodyBlock}var response = await ${methodCall};
Console.WriteLine(response);
// Example Response:
${responseComment}`;
}
function buildRustExampleUsage(sdkData, input, paramsExample, requestExample, responseExample) {
    const methodCall = `client.${input.groupName}().${input.methodName}(${formatNamedCallArguments(input, 'params', 'body', ', ')}).await?`;
    const pathBlocks = input.pathParameters
        .map((parameter) => `let ${parameter.sdkName} = ${formatJsonValue(sdkParameterExample(parameter), 2)};\n  `)
        .join('');
    const paramsBlock = input.hasSdkParams ? `let params = serde_json::json!(${formatJsonValue(paramsExample, 2)});\n  ` : '';
    const bodyBlock = input.hasRequestBody ? `let body = serde_json::json!(${formatJsonValue(requestExample, 2)});\n` : '';
    const responseComment = formatCommentedJson(responseExample, 0, '// ');
    return `use ${sdkData.packageName.replace(/-/g, '_')}::${sdkData.name};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
  let client = ${sdkData.name}::new("${input.requestUrl.baseUrl || sdkData.baseUrl}", "YOUR_TOKEN");
  ${pathBlocks}${paramsBlock}${bodyBlock}let response = ${methodCall};
  println!("{:?}", response);
  // Example Response:
${responseComment}
  Ok(())
}`;
}
function buildFlutterExampleUsage(sdkData, input, paramsExample, requestExample, responseExample) {
    const methodCall = `client.${input.groupName}.${input.methodName}(${formatFlutterArguments(input, paramsExample, requestExample, 2)})`;
    const responseComment = formatCommentedJson(responseExample, 0, '// ');
    return `import 'package:${sdkData.packageName}/${sdkData.packageName}.dart';

void main() async {
  final client = ${sdkData.name}(
    baseUrl: '${input.requestUrl.baseUrl || sdkData.baseUrl}',
    authToken: 'YOUR_TOKEN',
  );

  final response = await ${methodCall};
  print(response);
  // Example Response:
${responseComment}
}`;
}
function formatTsValue(value, indent = 2) {
    const json = JSON.stringify(value ?? {}, null, 2);
    const unquotedPropertyJson = json.replace(/^(\s*)"([^"]+)":/gm, '$1$2:');
    if (indent <= 2) {
        return unquotedPropertyJson;
    }
    return unquotedPropertyJson
        .split('\n')
        .map((line, index) => (index === 0 ? line : `${' '.repeat(indent - 2)}${line}`))
        .join('\n');
}
function formatTsArguments(input, paramsExample, requestExample, indent = 2) {
    return [
        ...input.pathParameters.map((parameter) => formatTsPrimitiveArgument(sdkParameterExample(parameter))),
        input.hasRequestBody ? formatTsValue(requestExample, indent) : undefined,
        input.hasSdkParams ? formatTsValue(paramsExample, indent) : undefined,
    ].filter((value) => Boolean(value)).join(', ');
}
function formatPythonArguments(input, paramsExample, requestExample, indent = 2) {
    return [
        ...input.pathParameters.map((parameter) => formatPythonPrimitiveArgument(sdkParameterExample(parameter))),
        input.hasRequestBody ? formatPythonValue(requestExample, indent) : undefined,
        input.hasSdkParams ? formatPythonValue(paramsExample, indent) : undefined,
    ].filter((value) => Boolean(value)).join(', ');
}
function formatRubyArguments(input, paramsExample, requestExample, indent = 2) {
    return [
        ...input.pathParameters.map((parameter) => formatRubyPrimitiveArgument(sdkParameterExample(parameter))),
        input.hasRequestBody ? formatRubyValue(requestExample, indent) : undefined,
        input.hasSdkParams ? formatRubyValue(paramsExample, indent) : undefined,
    ].filter((value) => Boolean(value)).join(', ');
}
function formatPhpArguments(input, paramsExample, requestExample, indent = 2) {
    return [
        ...input.pathParameters.map((parameter) => formatPhpPrimitiveArgument(sdkParameterExample(parameter))),
        input.hasRequestBody ? formatPhpValue(requestExample, indent) : undefined,
        input.hasSdkParams ? formatPhpValue(paramsExample, indent) : undefined,
    ].filter((value) => Boolean(value)).join(', ');
}
function formatFlutterArguments(input, paramsExample, requestExample, indent = 2) {
    return [
        ...input.pathParameters.map((parameter) => formatJsonValue(sdkParameterExample(parameter), indent)),
        input.hasRequestBody ? formatJsonValue(requestExample, indent) : undefined,
        input.hasSdkParams ? formatJsonValue(paramsExample, indent) : undefined,
    ].filter((value) => Boolean(value)).join(', ');
}
function formatNamedCallArguments(input, paramsName, bodyName, separator, prefix = '') {
    const args = [
        ...input.pathParameters.map((parameter) => parameter.sdkName),
        input.hasRequestBody ? bodyName : undefined,
        input.hasSdkParams ? paramsName : undefined,
    ].filter((value) => Boolean(value));
    return args.length > 0 ? `${prefix}${args.join(separator)}` : '';
}
function formatTsPrimitiveArgument(value) {
    return formatTsValue(value);
}
function formatPythonPrimitiveArgument(value) {
    return formatPythonValue(value);
}
function formatRubyPrimitiveArgument(value) {
    return formatRubyValue(value);
}
function formatPhpPrimitiveArgument(value) {
    return formatPhpValue(value);
}
function formatPythonValue(value, indent = 2) {
    return formatJsonValue(value, indent)
        .replace(/\btrue\b/g, 'True')
        .replace(/\bfalse\b/g, 'False')
        .replace(/\bnull\b/g, 'None');
}
function formatRubyValue(value, indent = 2) {
    return formatJsonValue(value, indent)
        .replace(/\btrue\b/g, 'true')
        .replace(/\bfalse\b/g, 'false')
        .replace(/\bnull\b/g, 'nil');
}
function formatPhpValue(value, indent = 2) {
    return formatJsonValue(value, indent);
}
function formatJsonValue(value, indent = 2) {
    return JSON.stringify(value ?? {}, null, 2)
        .split('\n')
        .map((line, index) => (index === 0 ? line : `${' '.repeat(indent)}${line}`))
        .join('\n');
}
function formatCommentedJson(value, indent = 4, prefix = '// ') {
    return JSON.stringify(value ?? null, null, 2)
        .split('\n')
        .map((line) => `${' '.repeat(indent)}${prefix}${line}`)
        .join('\n');
}
function toPythonPackageName(packageName) {
    return packageName
        .replace(/^@/, '')
        .replace(/\//g, '_')
        .replace(/-/g, '_');
}
//# sourceMappingURL=sdkEndpointDocumentation.js.map