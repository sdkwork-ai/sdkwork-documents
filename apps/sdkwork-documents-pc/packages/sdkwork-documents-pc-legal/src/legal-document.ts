/**
 * Legal document contract for the SDKWork Documents legal page family.
 *
 * Legal prose is *document data*, not UI copy: the page chrome (titles,
 * metadata labels, navigation) is localized through `@sdkwork/documents-pc-i18n`,
 * while each policy body is authored once per supported document locale here.
 * Keeping the bodies in a typed registry makes every page deterministic,
 * deep-linkable by stable section id, and testable without a backend call.
 *
 * Policy text is product/legal-owned content: changing a body is a legal review
 * change, not a routine refactor. The engineering commitments in the text follow
 * `sdkwork-specs/PRIVACY_SPEC.md` (classification, minimization, retention,
 * export/delete, residency).
 */

import { cookiePolicyContent } from './content/cookie-policy.ts';
import { privacyPolicyContent } from './content/privacy-policy.ts';
import { termsOfServiceContent } from './content/terms-of-service.ts';
import {
  LEGAL_DOCUMENT_IDS,
  LEGAL_DOCUMENT_PATHS,
  type LegalDocumentId,
} from './paths.ts';

export type LegalLocale = 'en' | 'zh';

/** `en` is the authored fallback for every locale the host app may negotiate. */
export const LEGAL_DEFAULT_LOCALE: LegalLocale = 'en';

export const LEGAL_LOCALES: readonly LegalLocale[] = ['en', 'zh'];

export interface LegalParagraphBlock {
  type: 'paragraph';
  text: string;
}

export interface LegalBulletListBlock {
  type: 'bulletList';
  items: string[];
}

export interface LegalNumberedListBlock {
  type: 'numberedList';
  items: string[];
}

export interface LegalTableBlock {
  type: 'table';
  columns: string[];
  rows: string[][];
}

export interface LegalCalloutBlock {
  type: 'callout';
  tone: 'info' | 'important';
  title: string;
  text: string;
}

export interface LegalDefinitionListBlock {
  type: 'definitions';
  items: Array<{ term: string; description: string }>;
}

export type LegalBlock =
  | LegalParagraphBlock
  | LegalBulletListBlock
  | LegalNumberedListBlock
  | LegalTableBlock
  | LegalCalloutBlock
  | LegalDefinitionListBlock;

export interface LegalSection {
  /** Stable, locale-independent anchor id. Never translate this value. */
  id: string;
  heading: string;
  blocks: LegalBlock[];
}

export interface LegalDocument {
  id: LegalDocumentId;
  locale: LegalLocale;
  path: string;
  title: string;
  summary: string;
  version: string;
  /** ISO calendar date (`YYYY-MM-DD`), formatted per locale at render time. */
  effectiveDate: string;
  lastUpdated: string;
  contactEmail: string;
  sections: LegalSection[];
}

/** Locale-independent metadata plus one localized body per supported locale. */
export interface LegalDocumentContent {
  en: Omit<LegalDocument, 'id' | 'locale' | 'path'>;
  zh: Omit<LegalDocument, 'id' | 'locale' | 'path'>;
}

export type LegalDocumentRegistry = Record<
  LegalLocale,
  Record<LegalDocumentId, LegalDocument>
>;

/**
 * Collapses an incoming BCP 47 tag (`zh-CN`, `zh-Hans`, `en-GB`, ...) onto an
 * authored document locale. Every unsupported tag falls back to English so a
 * page never renders an empty body.
 */
export function resolveLegalLocale(locale?: string | null): LegalLocale {
  const normalized = (locale ?? '').trim().toLowerCase();
  if (normalized.startsWith('zh')) {
    return 'zh';
  }
  if (normalized.startsWith('en')) {
    return 'en';
  }
  return LEGAL_DEFAULT_LOCALE;
}

/**
 * Resolves one document for the requested locale and reports whether the body
 * had to fall back, so the page can disclose the substitution instead of
 * silently showing English under a localized label.
 */
export function getLegalDocument(
  id: LegalDocumentId,
  locale?: string | null,
): { document: LegalDocument; requestedLocale: LegalLocale; isFallback: boolean } {
  const requestedLocale = resolveLegalLocale(locale);
  const document = LEGAL_DOCUMENTS[requestedLocale][id];
  // A host may negotiate a locale we have not authored (for example `de-DE`).
  // `resolveLegalLocale` collapses it to `en`, so compare against the requested
  // primary subtag — not against the collapsed value — to disclose the
  // substitution instead of reporting "no fallback" for every tag.
  const primaryRequestedLocale = (locale ?? '').trim().toLowerCase().split('-')[0] ?? '';
  return {
    document,
    requestedLocale,
    isFallback: primaryRequestedLocale.length > 0 && document.locale !== primaryRequestedLocale,
  };
}

/** Document navigation order used by the page footer and the documents home. */
export function listLegalDocuments(locale?: string | null): LegalDocument[] {
  const resolvedLocale = resolveLegalLocale(locale);
  return LEGAL_DOCUMENT_IDS.map((id) => LEGAL_DOCUMENTS[resolvedLocale][id]);
}

function materialize(
  id: LegalDocumentId,
  content: LegalDocumentContent,
): Record<LegalLocale, LegalDocument> {
  return {
    en: { id, locale: 'en', path: LEGAL_DOCUMENT_PATHS[id], ...content.en },
    zh: { id, locale: 'zh', path: LEGAL_DOCUMENT_PATHS[id], ...content.zh },
  };
}

const privacyPolicyDocuments = materialize('privacy-policy', privacyPolicyContent);
const termsOfServiceDocuments = materialize('terms-of-service', termsOfServiceContent);
const cookiePolicyDocuments = materialize('cookie-policy', cookiePolicyContent);

export const LEGAL_DOCUMENTS: LegalDocumentRegistry = {
  en: {
    'privacy-policy': privacyPolicyDocuments.en,
    'terms-of-service': termsOfServiceDocuments.en,
    'cookie-policy': cookiePolicyDocuments.en,
  },
  zh: {
    'privacy-policy': privacyPolicyDocuments.zh,
    'terms-of-service': termsOfServiceDocuments.zh,
    'cookie-policy': cookiePolicyDocuments.zh,
  },
};
