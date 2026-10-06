export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | {
    [key: string]: JsonValue;
};
export type JsonObject = Record<string, JsonValue>;
export declare function normalizeJsonValue(value: unknown, fieldName?: string): JsonValue;
export declare function normalizeJsonObject(value: unknown, fieldName?: string): JsonObject;
export declare function normalizeOptionalJsonObject(value: unknown, fieldName?: string): JsonObject | undefined;
export declare function normalizeJsonObjectArray(value: unknown, fieldName?: string): JsonObject[];
//# sourceMappingURL=json-value.d.ts.map