export type ReferenceSidebarCollapsedGroups = Record<string, true>;
export declare function createReferenceSidebarGroupKey(systemId: string, categoryId: string): string;
export declare function createReferenceSidebarGroupElementId(prefix: string, systemId: string, categoryId: string): string;
export declare function isReferenceSidebarGroupCollapsed(collapsedGroups: ReferenceSidebarCollapsedGroups, systemId: string, categoryId: string): boolean;
export declare function toggleReferenceSidebarGroup(collapsedGroups: ReferenceSidebarCollapsedGroups, systemId: string, categoryId: string): ReferenceSidebarCollapsedGroups;
export interface ReferenceSidebarSearchNode {
    id: string;
    name: string;
    fullName: string;
    endpoints: {
        id: string;
        name: string;
        method: string;
        path: string;
    }[];
    children: ReferenceSidebarSearchNode[];
    totalEndpoints: number;
}
export declare function filterReferenceSidebarTree<T extends ReferenceSidebarSearchNode>(nodes: T[], searchQuery: string): T[];
//# sourceMappingURL=reference-sidebar-groups.d.ts.map