import { type ReactNode } from 'react';
export interface AdaptiveTabItem {
    id: string;
    label: string;
    content: ReactNode;
    busy?: boolean;
}
export interface AdaptiveTabsProps {
    items: AdaptiveTabItem[];
    activeId: string;
    onSelect: (id: string) => void;
    moreLabel: string;
    ariaLabel: string;
    variant?: 'underline' | 'pill';
}
export declare function AdaptiveTabs({ items, activeId, onSelect, moreLabel, ariaLabel, variant, }: AdaptiveTabsProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=AdaptiveTabs.d.ts.map