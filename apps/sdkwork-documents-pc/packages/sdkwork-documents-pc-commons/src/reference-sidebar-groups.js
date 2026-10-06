function normalizeReferenceSidebarGroupPart(value, fallback) {
    const normalized = value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return normalized || fallback;
}
export function createReferenceSidebarGroupKey(systemId, categoryId) {
    const normalizedSystemId = systemId.trim() || 'system';
    const normalizedCategoryId = categoryId.trim() || 'category';
    return `${normalizedSystemId}::${normalizedCategoryId}`;
}
export function createReferenceSidebarGroupElementId(prefix, systemId, categoryId) {
    const normalizedPrefix = normalizeReferenceSidebarGroupPart(prefix, 'reference-sidebar-group');
    const normalizedSystemId = normalizeReferenceSidebarGroupPart(systemId, 'system');
    const normalizedCategoryId = normalizeReferenceSidebarGroupPart(categoryId, 'category');
    return `${normalizedPrefix}-${normalizedSystemId}-${normalizedCategoryId}`;
}
export function isReferenceSidebarGroupCollapsed(collapsedGroups, systemId, categoryId) {
    return collapsedGroups[createReferenceSidebarGroupKey(systemId, categoryId)] === true;
}
export function toggleReferenceSidebarGroup(collapsedGroups, systemId, categoryId) {
    const groupKey = createReferenceSidebarGroupKey(systemId, categoryId);
    if (collapsedGroups[groupKey]) {
        const nextCollapsedGroups = { ...collapsedGroups };
        delete nextCollapsedGroups[groupKey];
        return nextCollapsedGroups;
    }
    return {
        ...collapsedGroups,
        [groupKey]: true,
    };
}
export function filterReferenceSidebarTree(nodes, searchQuery) {
    if (!searchQuery.trim()) {
        return nodes;
    }
    const query = searchQuery.trim().toLowerCase();
    return nodes
        .map((node) => filterReferenceSidebarNode(node, query))
        .filter((node) => node !== null);
}
function filterReferenceSidebarNode(node, query) {
    const matchedEndpoints = node.endpoints.filter((endpoint) => {
        const name = endpoint.name.toLowerCase();
        const path = endpoint.path.toLowerCase();
        const method = endpoint.method.toLowerCase();
        return name.includes(query) || path.includes(query) || method.includes(query);
    });
    const matchedChildren = node.children
        .map((child) => filterReferenceSidebarNode(child, query))
        .filter((child) => child !== null);
    const categoryName = node.name.toLowerCase();
    const categoryFullName = node.fullName.toLowerCase();
    const categoryMatches = categoryName.includes(query) || categoryFullName.includes(query);
    if (matchedEndpoints.length === 0 && matchedChildren.length === 0 && !categoryMatches) {
        return null;
    }
    return {
        ...node,
        endpoints: categoryMatches ? node.endpoints : matchedEndpoints,
        children: matchedChildren,
        totalEndpoints: categoryMatches
            ? node.totalEndpoints
            : matchedEndpoints.length + matchedChildren.reduce((sum, child) => sum + child.totalEndpoints, 0),
    };
}
//# sourceMappingURL=reference-sidebar-groups.js.map