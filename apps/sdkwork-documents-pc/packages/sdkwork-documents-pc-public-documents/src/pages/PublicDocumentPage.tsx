import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import type { PublicDocument } from '../types.ts';
import { usePublicDocumentsRuntime } from '../runtime.tsx';
import { sanitizeDocumentHtml } from '../sanitize.ts';

export interface PublicDocumentPageProps {
  documentRef?: string;
  basePath?: string;
}

export function PublicDocumentPage({ documentRef, basePath }: PublicDocumentPageProps) {
  const { t, i18n } = useTranslation();
  const { client, basePath: runtimeBasePath } = usePublicDocumentsRuntime();
  const resolvedBasePath = basePath ?? runtimeBasePath ?? '/docs';
  const documentLocale = (i18n.resolvedLanguage ?? i18n.language ?? '').toLowerCase().startsWith('zh')
    ? 'zh-CN'
    : 'en-US';
  const [document, setDocument] = useState<PublicDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!documentRef) {
      setLoading(false);
      setError(true);
      return;
    }
    let active = true;
    setLoading(true);
    setError(false);
    client
      .retrieve(documentRef, documentLocale)
      .then((result) => {
        if (active) {
          setDocument(result);
        }
      })
      .catch(() => {
        if (active) {
          setError(true);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [client, documentLocale, documentRef]);

  const sanitizedBody = useMemo(
    () => (document ? sanitizeDocumentHtml(document.body) : ''),
    [document],
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 md:px-6">
      <Link
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        to={resolvedBasePath}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('publicDocs.back', { defaultValue: 'All documents' })}
      </Link>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {t('publicDocs.title', { defaultValue: 'Loading...' })}
        </div>
      ) : error || !document ? (
        <div
          className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
          role="alert"
        >
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {t('publicDocs.notFound', { defaultValue: 'This document does not exist or is not published.' })}
        </div>
      ) : (
        <article>
          <header className="mb-8 border-b border-slate-200 pb-6 dark:border-white/10">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl dark:text-white">
              {document.title}
            </h1>
            {document.summary ? (
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
                {document.summary}
              </p>
            ) : null}
            {document.locale && document.locale !== documentLocale ? (
              <p
                className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                role="status"
              >
                {t('publicDocs.localeFallback', {
                  locale: documentLocale,
                  servedLocale: document.locale,
                  defaultValue:
                    'This document is not available in the requested language; a fallback version is shown.',
                })}
              </p>
            ) : null}
            <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex gap-1.5">
                <dt>{t('publicDocs.updated', { defaultValue: 'Published' })}</dt>
                <dd className="font-medium text-slate-700 dark:text-slate-200">
                  {document.publishedAt || document.locale}
                </dd>
              </div>
              <div className="flex gap-1.5">
                <dt>ID</dt>
                <dd className="font-mono">{document.id}</dd>
              </div>
            </dl>
            {document.categoryName || document.category ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                  {document.categoryName || document.category}
                </span>
                {(document.tags ?? []).map((tag) => (
                  <span
                    className="rounded-full bg-violet-50 px-2.5 py-1 font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                    key={tag.id}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            ) : null}
          </header>
          <div
            className="sdkwork-public-document-content"
            dangerouslySetInnerHTML={{ __html: sanitizedBody }}
          />
        </article>
      )}
    </div>
  );
}
