/**
 * Route identity for the SDKWork Documents legal page family.
 *
 * This module intentionally has no React or content imports so host
 * applications can mount the routes without pulling the policy bodies into
 * their entry chunk. `@sdkwork/documents-pc-legal` re-exports these values for
 * callers that already load the page renderer.
 */

export type LegalDocumentId = 'privacy-policy' | 'terms-of-service' | 'cookie-policy';

export const LEGAL_DOCUMENT_IDS: readonly LegalDocumentId[] = [
  'privacy-policy',
  'terms-of-service',
  'cookie-policy',
];

/**
 * Canonical route for each document. The ids are shared by the SDKWork
 * Documents reference app and by host applications that embed these pages, so
 * footer links, redirects, and deep links line up across client roots.
 */
export const LEGAL_DOCUMENT_PATHS = {
  'privacy-policy': '/privacy',
  'terms-of-service': '/terms',
  'cookie-policy': '/cookies',
} as const satisfies Record<LegalDocumentId, string>;
