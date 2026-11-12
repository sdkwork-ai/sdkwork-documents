import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Eye,
  FileText,
  FolderCog,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Send,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import type {
  DocumentsAdminCategory,
  DocumentsAdminOverviewItem,
  DocumentsAdminTag,
} from '@sdkwork/documents-pc-commons';
import { useDocumentsAdminRuntime } from '../runtime.tsx';

function statusBadgeClasses(status: string): string {
  switch (status) {
    case 'published':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300';
    case 'archived':
      return 'border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300';
    default:
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300';
  }
}

function statusDotClasses(status: string): string {
  switch (status) {
    case 'published':
      return 'bg-emerald-500';
    case 'archived':
      return 'bg-slate-400';
    default:
      return 'bg-amber-500';
  }
}

export function DocumentCenterPage({ basePath }: { basePath?: string }) {
  const { t } = useTranslation();
  const { client, basePath: runtimeBasePath } = useDocumentsAdminRuntime();
  const resolvedBasePath = basePath ?? runtimeBasePath ?? '/admin/documents';
  const [documents, setDocuments] = useState<DocumentsAdminOverviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [categories, setCategories] = useState<DocumentsAdminCategory[]>([]);
  const [tags, setTags] = useState<DocumentsAdminTag[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [managerOpen, setManagerOpen] = useState(false);
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DocumentsAdminCategory | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [categoryNameEn, setCategoryNameEn] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [overview, categoryList, tagList] = await Promise.all([
        client.overview(),
        client.listCategories(),
        client.listTags(),
      ]);
      setDocuments(overview);
      setCategories(categoryList);
      setTags(tagList);
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
    return documents.filter((document) => {
      if (categoryFilter && document.category !== categoryFilter) {
        return false;
      }
      if (tagFilter && !document.tags.some((tag) => tag.slug === tagFilter)) {
        return false;
      }
      if (!normalized) {
        return true;
      }
      return [
        document.title,
        document.status,
        document.slug,
        document.locale,
        document.id,
        document.category,
        ...document.tags.map((tag) => tag.name),
      ].some((value) => value.toLowerCase().includes(normalized));
    });
  }, [documents, query, categoryFilter, tagFilter]);

  const categoryNameBySlug = useMemo(
    () => new Map(categories.map((category) => [category.slug, category.name])),
    [categories],
  );

  const statusLabel = (status: string): string =>
    t(`documentsAdmin.status.${status}`, { defaultValue: status });

  const runAction = useCallback(
    async (document: DocumentsAdminOverviewItem, action: 'publish' | 'unpublish' | 'delete') => {
      if (action === 'delete') {
        const confirmed = window.confirm(
          t('documentsAdmin.list.deleteConfirm', {
            defaultValue: 'Delete this document and its Drive content? This cannot be undone.',
          }),
        );
        if (!confirmed) {
          return;
        }
      }
      setActionId(document.id);
      setActionError(null);
      setNotice(null);
      try {
        if (action === 'delete') {
          await client.delete(document.id);
          setNotice(
            t('documentsAdmin.list.noticeDeleted', {
              defaultValue: 'Document deleted.',
            }),
          );
        } else {
          await client.update(document.id, {
            status: action === 'publish' ? 'published' : 'archived',
          });
          setNotice(
            action === 'publish'
              ? t('documentsAdmin.list.noticePublished', {
                  defaultValue: 'Document published.',
                })
              : t('documentsAdmin.list.noticeUnpublished', {
                  defaultValue: 'Document taken offline.',
                }),
          );
        }
        await load();
      } catch {
        setActionError(
          t('documentsAdmin.list.actionError', {
            defaultValue: 'The action failed. Refresh and try again.',
          }),
        );
      } finally {
        setActionId(null);
      }
    },
    [client, load, t],
  );

  const resetCategoryForm = (): void => {
    setEditingCategory(null);
    setCategoryName('');
    setCategorySlug('');
    setCategoryNameEn('');
  };

  const editCategory = (category: DocumentsAdminCategory): void => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategorySlug(category.slug);
    setCategoryNameEn(category.nameEn ?? '');
  };

  const submitCategory = useCallback(async () => {
    if (!categoryName.trim() || (!editingCategory && !categorySlug.trim())) {
      return;
    }
    setCategoryBusy(true);
    setActionError(null);
    try {
      if (editingCategory) {
        await client.updateCategory(editingCategory.id, {
          name: categoryName.trim(),
          nameEn: categoryNameEn.trim(),
        });
      } else {
        await client.createCategory({
          slug: categorySlug.trim(),
          name: categoryName.trim(),
          nameEn: categoryNameEn.trim(),
        });
      }
      resetCategoryForm();
      await load();
    } catch {
      setActionError(
        t('documentsAdmin.categories.error', {
          defaultValue: 'Could not save the category.',
        }),
      );
    } finally {
      setCategoryBusy(false);
    }
  }, [categoryName, categoryNameEn, categorySlug, client, editingCategory, load, t]);

  const removeCategory = useCallback(
    async (category: DocumentsAdminCategory) => {
      const confirmed = window.confirm(
        t('documentsAdmin.categories.deleteConfirm', {
          defaultValue: 'Delete this category? Categories still used by documents cannot be deleted.',
        }),
      );
      if (!confirmed) {
        return;
      }
      setCategoryBusy(true);
      setActionError(null);
      try {
        await client.deleteCategory(category.id);
        if (editingCategory?.id === category.id) {
          resetCategoryForm();
        }
        await load();
      } catch {
        setActionError(
          t('documentsAdmin.categories.deleteError', {
            defaultValue: 'Could not delete the category. It may still be in use.',
          }),
        );
      } finally {
        setCategoryBusy(false);
      }
    },
    [client, editingCategory, load, t],
  );

  const previewDocument = (document: DocumentsAdminOverviewItem): void => {
    const reference = document.slug.trim() || document.id;
    window.open(`/docs/${encodeURIComponent(reference)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full max-w-none space-y-6 px-4 py-6 md:px-6 md:py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {t('documentsAdmin.list.title', { defaultValue: 'Document Center' })}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            {t('documentsAdmin.list.description', {
              defaultValue:
                'Manage published policies, standards, and product documentation. Changes are live after you save.',
            })}
          </p>
        </div>
        <Link
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          to={`${resolvedBasePath}/new`}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('documentsAdmin.list.create', { defaultValue: 'New document' })}
        </Link>
      </header>

      {notice ? (
        <div
          className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
          role="status"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {notice}
        </div>
      ) : null}
      {actionError ? (
        <div
          className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
          role="alert"
        >
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {actionError}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-white/[0.03]">
        <label className="relative block w-full sm:max-w-md">
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
              defaultValue: 'Search by title, slug, locale, or id',
            })}
            type="search"
            value={query}
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label={t('documentsAdmin.list.filterCategory', { defaultValue: 'Filter by category' })}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-[#0a0a0a] dark:text-slate-200"
            onChange={(event) => setCategoryFilter(event.target.value)}
            value={categoryFilter}
          >
            <option value="">{t('documentsAdmin.list.allCategories', { defaultValue: 'All categories' })}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            aria-label={t('documentsAdmin.list.filterTag', { defaultValue: 'Filter by tag' })}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-[#0a0a0a] dark:text-slate-200"
            onChange={(event) => setTagFilter(event.target.value)}
            value={tagFilter}
          >
            <option value="">{t('documentsAdmin.list.allTags', { defaultValue: 'All tags' })}</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.slug}>
                {tag.name}
              </option>
            ))}
          </select>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
            onClick={() => setManagerOpen(true)}
            type="button"
          >
            <FolderCog className="h-4 w-4" aria-hidden="true" />
            {t('documentsAdmin.categories.manage', { defaultValue: 'Manage categories' })}
          </button>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {t('documentsAdmin.list.total', {
              defaultValue: '{{count}} documents',
              count: filtered.length,
            })}
          </span>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
            disabled={loading}
            onClick={() => void load()}
            type="button"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            {t('documentsAdmin.list.retry', { defaultValue: 'Refresh' })}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {t('documentsAdmin.list.loading', { defaultValue: 'Loading documents...' })}
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
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
          <FileText className="mx-auto mb-3 h-7 w-7" aria-hidden="true" />
          {t('documentsAdmin.list.empty', { defaultValue: 'No documents yet.' })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur dark:bg-[#14171c]/95">
              <tr className="border-b border-slate-200 dark:border-white/10">
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white" scope="col">
                  {t('documentsAdmin.list.columnTitle', { defaultValue: 'Document' })}
                </th>
                <th className="w-32 px-4 py-3 font-semibold text-slate-900 dark:text-white" scope="col">
                  {t('documentsAdmin.list.columnStatus', { defaultValue: 'Status' })}
                </th>
                <th className="w-44 px-4 py-3 font-semibold text-slate-900 dark:text-white" scope="col">
                  {t('documentsAdmin.list.columnUpdatedAt', { defaultValue: 'Updated' })}
                </th>
                <th className="w-72 px-4 py-3 text-right font-semibold text-slate-900 dark:text-white" scope="col">
                  {t('documentsAdmin.list.columnActions', { defaultValue: 'Actions' })}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filtered.map((document) => {
                const busy = actionId === document.id;
                const published = document.status === 'published';
                return (
                  <tr
                    className="bg-white transition-colors hover:bg-slate-50/80 dark:bg-transparent dark:hover:bg-white/[0.04]"
                    key={document.id}
                  >
                    <td className="px-4 py-3.5 align-top">
                      <div className="flex min-w-0 flex-col gap-1">
                        <Link
                          className="truncate font-medium text-slate-900 hover:underline dark:text-white"
                          to={`${resolvedBasePath}/${document.id}`}
                        >
                          {document.title}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] dark:bg-white/10">
                            {document.slug || document.id}
                          </code>
                          <span className="inline-flex items-center rounded-full border border-slate-200 px-2 py-0.5 text-[11px] dark:border-white/10">
                            {document.locale || 'zh-CN'}
                          </span>
                          {document.category ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                              <FolderCog className="h-3 w-3" aria-hidden="true" />
                              {categoryNameBySlug.get(document.category) ?? document.category}
                            </span>
                          ) : null}
                          {document.tags.map((tag) => (
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                              key={tag.id}
                            >
                              <Tag className="h-3 w-3" aria-hidden="true" />
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadgeClasses(document.status)}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${statusDotClasses(document.status)}`}
                          aria-hidden="true"
                        />
                        {statusLabel(document.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 align-top text-xs text-slate-500 dark:text-slate-400">
                      {document.updatedAt || '—'}
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <button
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                          disabled={!published}
                          onClick={() => previewDocument(document)}
                          title={
                            published
                              ? t('documentsAdmin.list.preview', { defaultValue: 'Preview' })
                              : t('documentsAdmin.list.previewUnavailable', {
                                  defaultValue: 'Publish to preview',
                                })
                          }
                          type="button"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          {t('documentsAdmin.list.preview', { defaultValue: 'Preview' })}
                        </button>
                        <Link
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                          title={t('documentsAdmin.list.edit', { defaultValue: 'Edit' })}
                          to={`${resolvedBasePath}/${document.id}`}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          {t('documentsAdmin.list.edit', { defaultValue: 'Edit' })}
                        </Link>
                        <button
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                          disabled={busy}
                          onClick={() => void runAction(document, published ? 'unpublish' : 'publish')}
                          title={
                            published
                              ? t('documentsAdmin.list.unpublish', { defaultValue: 'Take offline' })
                              : t('documentsAdmin.list.publish', { defaultValue: 'Publish' })
                          }
                          type="button"
                        >
                          {busy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                          ) : published ? (
                            <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <Send className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          {published
                            ? t('documentsAdmin.list.unpublish', { defaultValue: 'Take offline' })
                            : t('documentsAdmin.list.publish', { defaultValue: 'Publish' })}
                        </button>
                        <button
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-500/10"
                          disabled={busy}
                          onClick={() => void runAction(document, 'delete')}
                          title={t('documentsAdmin.list.delete', { defaultValue: 'Delete' })}
                          type="button"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          {t('documentsAdmin.list.delete', { defaultValue: 'Delete' })}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {managerOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm">
          <section
            aria-modal="true"
            className="my-8 w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#14171c]"
            role="dialog"
          >
            <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  {t('documentsAdmin.categories.title', { defaultValue: 'Document categories' })}
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t('documentsAdmin.categories.description', {
                    defaultValue: 'Categories group documents in the public /docs index.',
                  })}
                </p>
              </div>
              <button
                aria-label={t('documentsAdmin.categories.close', { defaultValue: 'Close' })}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                onClick={() => {
                  setManagerOpen(false);
                  resetCategoryForm();
                }}
                type="button"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>

            <div className="space-y-5 px-5 py-4">
              <div className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_1fr_1fr_auto] dark:border-white/10">
                <input
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white"
                  onChange={(event) => setCategoryName(event.target.value)}
                  placeholder={t('documentsAdmin.categories.name', { defaultValue: 'Name' })}
                  value={categoryName}
                />
                <input
                  className="rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm disabled:opacity-60 dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white"
                  disabled={Boolean(editingCategory)}
                  onChange={(event) => setCategorySlug(event.target.value)}
                  placeholder={t('documentsAdmin.categories.slug', { defaultValue: 'slug' })}
                  value={categorySlug}
                />
                <input
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white"
                  onChange={(event) => setCategoryNameEn(event.target.value)}
                  placeholder={t('documentsAdmin.categories.nameEn', { defaultValue: 'English name' })}
                  value={categoryNameEn}
                />
                <button
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-slate-900"
                  disabled={categoryBusy}
                  onClick={() => void submitCategory()}
                  type="button"
                >
                  {editingCategory
                    ? t('documentsAdmin.categories.save', { defaultValue: 'Save' })
                    : t('documentsAdmin.categories.add', { defaultValue: 'Add' })}
                </button>
              </div>

              <ul className="divide-y divide-slate-100 dark:divide-white/5">
                {categories.map((category) => (
                  <li className="flex flex-wrap items-center justify-between gap-2 py-3" key={category.id}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 dark:text-white">{category.name}</span>
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-500 dark:bg-white/10 dark:text-slate-300">
                          {category.slug}
                        </code>
                        {category.status !== 'active' ? (
                          <span className="text-[11px] text-amber-600">{category.status}</span>
                        ) : null}
                      </div>
                      {category.nameEn ? (
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{category.nameEn}</p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                        onClick={() => editCategory(category)}
                        type="button"
                      >
                        {t('documentsAdmin.categories.edit', { defaultValue: 'Edit' })}
                      </button>
                      <button
                        className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-500/10"
                        disabled={categoryBusy}
                        onClick={() => void removeCategory(category)}
                        type="button"
                      >
                        {t('documentsAdmin.categories.delete', { defaultValue: 'Delete' })}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
