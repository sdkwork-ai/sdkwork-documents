import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AlertCircle, FileText, Loader2, Search } from 'lucide-react';
import type { PublicDocument } from '../types.ts';
import { usePublicDocumentsRuntime } from '../runtime.tsx';

const CATEGORY_ORDER = ['policy', 'standard'] as const;

function categoryRank(category: string): number {
  const index = (CATEGORY_ORDER as readonly string[]).indexOf(category);
  return index === -1 ? CATEGORY_ORDER.length : index;
}

export function PublicDocumentIndexPage({ basePath }: { basePath?: string }) {
  const { t, i18n } = useTranslation();
  const { client, basePath: runtimeBasePath } = usePublicDocumentsRuntime();
  const resolvedBasePath = basePath ?? runtimeBasePath ?? '/docs';
  const documentLocale = (i18n.resolvedLanguage ?? i18n.language ?? '').toLowerCase().startsWith('zh')
    ? 'zh-CN'
    : 'en-US';
  const [documents, setDocuments] = useState<PublicDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setDocuments(await client.list(documentLocale));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [client, documentLocale]);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = normalized
      ? documents.filter((document) =>
          [
            document.title,
            document.summary,
            document.slug,
            document.categoryName ?? '',
            ...(document.tags ?? []).map((tag) => tag.name),
          ].some((value) => value.toLowerCase().includes(normalized)),
        )
      : documents;
    const groups = new Map<string, typeof filtered>();
    for (const document of filtered) {
      const category = document.category || 'other';
      const items = groups.get(category) ?? [];
      items.push(document);
      groups.set(category, items);
    }
    return [...groups.entries()]
      .map(([category, items]) => ({ category, items }))
      .sort((left, right) => categoryRank(left.category) - categoryRank(right.category));
  }, [documents, query]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t('publicDocs.title', { defaultValue: 'Documentation' })}
        </h1>
        <p className="mt-2 text-base text-slate-600 dark:text-slate-300">
          {t('publicDocs.subtitle', {
            defaultValue: 'Policies, industry standards, and product documentation.',
          })}
        </p>
      </header>

      <label className="relative mb-8 block w-full max-w-sm">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        />
        <span className="sr-only">{t('publicDocs.searchPlaceholder', { defaultValue: 'Search documents' })}</span>
        <input
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('publicDocs.searchPlaceholder', { defaultValue: 'Search documents' })}
          type="search"
          value={query}
        />
      </label>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {t('publicDocs.title', { defaultValue: 'Loading...' })}
        </div>
      ) : error ? (
        <div
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
          role="alert"
        >
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            {t('publicDocs.error', { defaultValue: 'Could not load documents.' })}
          </span>
          <button className="self-start font-medium underline" onClick={() => void load()} type="button">
            {t('publicDocs.retry', { defaultValue: 'Retry' })}
          </button>
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
          <FileText className="mx-auto mb-3 h-6 w-6" aria-hidden="true" />
          {t('publicDocs.empty', { defaultValue: 'No published documents yet.' })}
        </div>
      ) : (
        <div className="space-y-10">
          {grouped.map((group) => (
            <section key={group.category}>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {group.items[0]?.categoryName ||
                  t(`publicDocs.category.${group.category}`, {
                    defaultValue: group.category === 'other' ? 'Other' : group.category,
                  })}
              </h2>
              <ul className="grid gap-4 md:grid-cols-2">
                {group.items.map((document) => (
                  <li key={document.id}>
                    <Link
                      className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20 dark:hover:bg-white/5"
                      to={`${resolvedBasePath}/${document.slug || document.id}`}
                    >
                      <span className="text-base font-semibold text-slate-900 dark:text-white">
                        {document.title}
                      </span>
                      {document.summary ? (
                        <span className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {document.summary}
                        </span>
                      ) : null}
                      {document.tags?.length ? (
                        <span className="mt-3 flex flex-wrap gap-1.5">
                          {document.tags.map((tag) => (
                            <span
                              className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                              key={tag.id}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
