export function calculateAdaptiveTabIds({ itemIds, itemWidths, activeId, containerWidth, moreButtonWidth, gap, }) {
    if (itemIds.length === 0 || containerWidth <= 0) {
        return [];
    }
    const widthOf = (id) => Math.max(0, itemWidths.get(id) ?? 0);
    const tabsWidth = (ids) => (ids.reduce((total, id) => total + widthOf(id), 0) + Math.max(0, ids.length - 1) * gap);
    const allTabsWidth = tabsWidth(itemIds);
    if (allTabsWidth <= containerWidth) {
        return itemIds;
    }
    const fitsWithMoreButton = (ids) => (tabsWidth(ids) + moreButtonWidth + (ids.length > 0 ? gap : 0) <= containerWidth);
    const visibleIds = [];
    if (itemIds.includes(activeId)) {
        if (!fitsWithMoreButton([activeId])) {
            return [];
        }
        visibleIds.push(activeId);
    }
    for (const id of itemIds) {
        if (id === activeId) {
            continue;
        }
        const candidateIds = [...visibleIds, id].sort((left, right) => (itemIds.indexOf(left) - itemIds.indexOf(right)));
        if (fitsWithMoreButton(candidateIds)) {
            visibleIds.push(id);
        }
    }
    return visibleIds.sort((left, right) => itemIds.indexOf(left) - itemIds.indexOf(right));
}
//# sourceMappingURL=adaptive-tabs-layout.js.map