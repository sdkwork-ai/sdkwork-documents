import type { CatalogCategory } from './catalog-category';
import type { CatalogCounts } from './catalog-counts';
import type { CatalogFacet } from './catalog-facet';
export interface DeveloperCatalogOverview {
    counts: CatalogCounts;
    categories: CatalogCategory[];
    surfaceFacets: CatalogFacet[];
    sdkTypeFacets: CatalogFacet[];
    languageFacets: CatalogFacet[];
    featuredApiSurfaceIds: string[];
    featuredSdkIds: string[];
}
//# sourceMappingURL=developer-catalog-overview.d.ts.map