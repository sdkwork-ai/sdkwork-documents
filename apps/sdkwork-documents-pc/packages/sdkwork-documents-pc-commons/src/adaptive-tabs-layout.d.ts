export interface AdaptiveTabsLayoutInput {
    itemIds: string[];
    itemWidths: ReadonlyMap<string, number>;
    activeId: string;
    containerWidth: number;
    moreButtonWidth: number;
    gap: number;
}
export declare function calculateAdaptiveTabIds({ itemIds, itemWidths, activeId, containerWidth, moreButtonWidth, gap, }: AdaptiveTabsLayoutInput): string[];
//# sourceMappingURL=adaptive-tabs-layout.d.ts.map