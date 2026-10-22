import type { CatalogSdkFamily } from './catalog-sdk-family';
import type { CatalogSdkRelease } from './catalog-sdk-release';

export interface CatalogSdkFamilyDetail {
  sdk: CatalogSdkFamily;
  repositoryUrl?: string;
  docsUrl?: string;
  licenseCode?: string;
  supportLevel?: string;
  pricingTier?: string;
  releases: CatalogSdkRelease[];
}
