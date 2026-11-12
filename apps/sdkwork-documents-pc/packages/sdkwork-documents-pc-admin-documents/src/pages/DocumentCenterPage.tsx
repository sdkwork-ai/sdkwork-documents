import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AlertCircle, FileText, Loader2, Plus, RefreshCcw, Search } from 'lucide-react';
import type { DocumentsAdminDocument } from '@sdkwork/documents-pc-commons';
import { useDocumentsAdminRuntime } from '../runtime.tsx';

function statusBadgeClasses(status: string): string {
  switch (status) {
    case 'published':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300';
    case 'archived':
      return 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300';
    default:
      return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300';
  }
}

export function DocumentCenterPage({ basePath }: { basePath?: string }) {
  const { t } = useTranslation();
  const { client, basePath: runtimeBasePath } = useDocumentsAdminRuntime();
  const resolvedBasePath = basePath ?? runtimeBasePath ?? '/admin/documents';
  const [documents, setDocuments] = useState<DocumentsAdminDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setDocuments(await client.list());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return documents;
    }
    return documents.filter((document) =>
      [document.title, document.status, document.id].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [documents, query]);

  const statusLabel = (status: string): string =>
    t(`documentsAdmin.status.${status}`, { defaultValue: status });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 md:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {t('documentsAdmin.list.title', { defaultValue: 'Document Center' })}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            {t('documentsAdmin.list.description', {
              defaultValue:
                'Manage published policies, standards, and product documentation. Changes are live after you save.',
            })}
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          to={`${resolvedBasePath}/new`}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('documentsAdmin.list.create', { defaultValue: 'New document' })}
        </Link>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-sm">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <span className="sr-only">
            {t('documentsAdmin.list.searchPlaceholder', { defaultValue: 'Search documents' })}
          </span>
          <input
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('documentsAdmin.list.searchPlaceholder', {
              defaultValue: 'Search by title, slug, or id',
            })}
            type="search"
            value={query}
          />
        </label>
        <button
          className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
          disabled={loading}
          onClick={() => void load()}
          type="button"
        >
          <RefreshCcw className="h-4 w-4" aria-hidden="true" />
          {t('documentsAdmin.list.retry', { defaultValue: 'Refresh' })}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {t('documentsAdmin.editor.saving', { defaultValue: 'Loading...' })}
        </div>
      ) : error ? (
        <div
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
          role="alert"
        >
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            {t('documentsAdmin.list.error', { defaultValue: 'Could not load documents.' })}
          </span>
          <button className="self-start font-medium underline" onClick={() => void load()} type="button">
            {t('documentsAdmin.list.retry', { defaultValue: 'Retry' })}
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
          <FileText className="mx-auto mb-3 h-6 w-6" aria-hidden="true" />
          {t('documentsAdmin.list.empty', { defaultValue: 'No documents yet.' })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white" scope="col">
                  {t('documentsAdmin.list.columnTitle', { defaultValue: 'Title' })}
                </th>
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white" scope="col">
                  {t('documentsAdmin.list.columnStatus', { defaultValue: 'Status' })}
                </th>
                <th className="hidden px-4 py-3 font-semibold text-slate-900 md:table-cell dark:text-white" scope="col">
                  {t('documentsAdmin.list.columnId', { defaultValue: 'Document ID' })}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {filtered.map((document) => (
                <tr className="bg-white transition-colors hover:bg-slate-50 dark:bg-transparent dark:hover:bg-white/5" key={document.id}>
                  <td className="px-4 py-3">
                    <Link
                      className="font-medium text-slate-900 hover:underline dark:text-white"
                      to={`${resolvedBasePath}/${document.id}`}
                    >
                      {document.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClasses(document.status)}`}>
                      {statusLabel(document.status)}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-slate-500 md:table-cell dark:text-slate-400">
                    {document.id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
