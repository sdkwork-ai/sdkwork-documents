import type { ParamRow } from '../apiPlaygroundRows';
export type { ParamRow } from '../apiPlaygroundRows';
interface ApiPlaygroundParamsTableProps {
    title: string;
    params: ParamRow[];
    errors: Record<string, boolean>;
    onChange: (id: string, field: keyof ParamRow, value: ParamRow[keyof ParamRow]) => void;
    onRemove: (id: string) => void;
    hideEnabled?: boolean;
    hideDescription?: boolean;
    onBulkEdit?: (text: string) => void;
}
export declare function ApiPlaygroundParamsTable({ title, params, errors, onChange, onRemove, hideEnabled, hideDescription, onBulkEdit, }: ApiPlaygroundParamsTableProps): import("react").JSX.Element | null;
//# sourceMappingURL=ApiPlaygroundParamsTable.d.ts.map