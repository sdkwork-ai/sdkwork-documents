import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CalendarDays, FileCheck2, Mail, Printer } from 'lucide-react';
import { documentsShellLayout } from '@sdkwork/documents-pc-commons';
import {
  getLegalDocument,
  listLegalDocuments,
  type LegalBlock,
  type LegalDocument,
} from '../legal-document.ts';
import type { LegalDocumentId } from '../paths.ts';

export interface LegalDocumentPageProps {
  /**
   * Which authored document to render. Host applications mount one page per
   * route so each policy keeps its own URL and footer link.
   */
  documentId: LegalDocumentId;
  /**
   * BCP 47 tag supplied by the host. Defaults to the react-i18next language so
   * the page follows the application language without extra wiring.
   */
  locale?: string;
  className?: string;
}

const DATE_FORMATTERS: Record<string, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }),
  zh: new Intl.DateTimeFormat('zh-CN', { dateStyle: 'long', timeZone: 'UTC' }),
};

/**
 * Formats the authored ISO calendar date without shifting it across time
 * zones: legal effective dates are calendar facts, not instants.
 */
export function formatLegalDocumentDate(value: string, locale: string): string {
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  const formatter = DATE_FORMATTERS[locale] ?? DATE_FORMATTERS.en;
  return formatter.format(parsed);
}

function LegalBlockView({ block }: { block: LegalBlock }) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p className="text-[15px] leading-7 text-slate-600 dark:text-slate-300">{block.text}</p>
      );
    case 'bulletList':
      return (
        <ul className="list-disc space-y-2.5 pl-5 text-[15px] leading-7 text-slate-600 marker:text-slate-400 dark:text-slate-300 dark:marker:text-slate-500">
          {block.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );
    case 'numberedList':
      return (
        <ol className="list-decimal space-y-2.5 pl-5 text-[15px] leading-7 text-slate-600 marker:text-slate-400 dark:text-slate-300 dark:marker:text-slate-500">
          {block.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ol>
      );
    case 'table':
      return (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/5">
                {block.columns.map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="whitespace-nowrap border-b border-slate-200 px-4 py-3 font-semibold text-slate-900 dark:border-white/10 dark:text-white"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="align-top">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={
                        cellIndex === 0
                          ? 'px-4 py-3 font-medium text-slate-800 dark:text-slate-100'
                          : 'px-4 py-3 text-slate-600 dark:text-slate-300'
                      }
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'callout': {
      const toneClasses =
        block.tone === 'important'
          ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200'
          : 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-200';
      return (
        <div className={`rounded-xl border p-4 ${toneClasses}`}>
          <p className="text-sm font-semibold">{block.title}</p>
          <p className="mt-1 text-sm leading-6 opacity-90">{block.text}</p>
        </div>
      );
    }
    case 'definitions':
      return (
        <dl className="space-y-4">
          {block.items.map((item) => (
            <div key={item.term}>
              <dt className="text-[15px] font-semibold text-slate-900 dark:text-white">{item.term}</dt>
              <dd className="mt-1 text-[15px] leading-7 text-slate-600 dark:text-slate-300">
                {item.description}
              </dd>
            </div>
          ))}
        </dl>
      );
    default: {
      const exhaustive: never = block;
      return exhaustive;
    }
  }
}

function LegalSectionView({ section, index }: { section: LegalDocument['sections'][number]; index: number }) {
  return (
    <section
      id={section.id}
      aria-labelledby={`${section.id}-heading`}
      className="scroll-mt-28 border-t border-slate-200 pt-8 first:border-t-0 first:pt-0 dark:border-white/10"
    >
      <h2
        id={`${section.id}-heading`}
        className="mb-4 text-xl font-semibold tracking-tight text-slate-900 dark:text-white"
      >
        <a className="hover:underline" href={`#${section.id}`}>
          {section.heading}
        </a>
      </h2>
      <div className="space-y-4">
        {section.blocks.map((block, blockIndex) => (
          <LegalBlockView key={`${index}-${blockIndex}`} block={block} />
        ))}
      </div>
    </section>
  );
}

/**
 * Renders one legal document with a stable table of contents, document
 * metadata, related-document navigation, contact details, and print support.
 *
 * The component owns layout only; it never fetches. Legal content ships with
 * the package as versioned document data, so the same page works in the
 * SDKWork Documents reference app and in every host application that embeds it.
 */
export function LegalDocumentPage({ documentId, locale, className }: LegalDocumentPageProps) {
  const { t, i18n } = useTranslation();
  const activeLocale = locale ?? i18n.resolvedLanguage ?? i18n.language;
  const { document, isFallback } = getLegalDocument(documentId, activeLocale);
  const relatedDocuments = listLegalDocuments(document.locale).filter(
    (candidate) => candidate.id !== document.id,
  );

  const handlePrint = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }, []);

  const effectiveDate = formatLegalDocumentDate(document.effectiveDate, document.locale);
  const lastUpdated = formatLegalDocumentDate(document.lastUpdated, document.locale);

  return (
    <div
      className={`${documentsShellLayout.pageRoot} sdkwork-documents-legal-page ${className ?? ''}`.trim()}
      data-legal-document-id={document.id}
    >
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-5 py-12 md:px-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <article lang={document.locale === 'zh' ? 'zh-CN' : 'en'} aria-labelledby="legal-document-title">
          <header className="mb-10">
            <p className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400">
              {t('legal.page.breadcrumb')}
            </p>
            <h1
              id="legal-document-title"
              className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl dark:text-white"
            >
              {document.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
              {document.summary}
            </p>

            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <dt className="text-slate-500 dark:text-slate-400">{t('legal.page.version')}</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{document.version}</dd>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <dt className="text-slate-500 dark:text-slate-400">{t('legal.page.effectiveDate')}</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{effectiveDate}</dd>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <dt className="text-slate-500 dark:text-slate-400">{t('legal.page.lastUpdated')}</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{lastUpdated}</dd>
              </div>
            </dl>

            {isFallback ? (
              <p
                role="status"
                className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              >
                {t('legal.page.fallbackNotice', { locale: activeLocale })}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
              >
                <Printer className="h-4 w-4" aria-hidden="true" />
                {t('legal.page.print')}
              </button>
              <a
                href={`mailto:${document.contactEmail}`}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                {document.contactEmail}
              </a>
            </div>
          </header>

          <div className="space-y-8">
            {document.sections.map((section, index) => (
              <LegalSectionView key={section.id} section={section} index={index} />
            ))}
          </div>

          <footer className="mt-12 border-t border-slate-200 pt-8 dark:border-white/10">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t('legal.page.relatedDocuments')}
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {relatedDocuments.map((related) => (
                <li key={related.id}>
                  <Link
                    to={related.path}
                    className="flex h-full flex-col rounded-xl border border-slate-200 p-4 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:hover:border-white/20 dark:hover:bg-white/5"
                  >
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {related.title}
                    </span>
                    <span className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {related.summary}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {t('legal.page.contactDescription')}{' '}
              <a className="font-medium text-slate-700 underline underline-offset-2 dark:text-slate-200" href={`mailto:${document.contactEmail}`}>
                {document.contactEmail}
              </a>
            </p>
          </footer>
        </article>

        <aside className="hidden lg:block">
          <div className={`${documentsShellLayout.stickySidebar} space-y-8 pr-2`}>
            <nav aria-label={t('legal.page.onThisPage')}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t('legal.page.onThisPage')}
              </h2>
              <ul className="space-y-2 text-[13px]">
                {document.sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="block text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label={t('legal.page.relatedDocuments')}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t('legal.page.relatedDocuments')}
              </h2>
              <ul className="space-y-2 text-[13px]">
                {relatedDocuments.map((related) => (
                  <li key={related.id}>
                    <Link
                      to={related.path}
                      className="block text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                      {related.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function PrivacyPolicyPage(props: Omit<LegalDocumentPageProps, 'documentId'>) {
  return <LegalDocumentPage {...props} documentId="privacy-policy" />;
}

export function TermsOfServicePage(props: Omit<LegalDocumentPageProps, 'documentId'>) {
  return <LegalDocumentPage {...props} documentId="terms-of-service" />;
}

export function CookiePolicyPage(props: Omit<LegalDocumentPageProps, 'documentId'>) {
  return <LegalDocumentPage {...props} documentId="cookie-policy" />;
}
