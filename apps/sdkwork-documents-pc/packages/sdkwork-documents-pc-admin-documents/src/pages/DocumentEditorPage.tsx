import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  AlertCircle,
  ArrowLeft,
  Bold,
  CheckCircle2,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Redo2,
  Save,
  Strikethrough,
  Trash2,
  Undo2,
} from 'lucide-react';
import { useDocumentsAdminRuntime } from '../runtime.tsx';
import type { DocumentsAdminRevision } from '@sdkwork/documents-pc-commons';

const STATUS_OPTIONS = ['draft', 'published', 'archived'] as const;

function ToolbarButton({
  active = false,
  children,
  disabled = false,
  label,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-40 ${
        active
          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'
      }`}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function EditorToolbar({ editor }: { editor: Editor | null }) {
  const { t } = useTranslation();
  if (!editor) {
    return null;
  }
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 px-2 py-2 dark:border-white/10">
      <ToolbarButton
        active={editor.isActive('bold')}
        label={t('documentsAdmin.toolbar.bold', { defaultValue: 'Bold' })}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('italic')}
        label={t('documentsAdmin.toolbar.italic', { defaultValue: 'Italic' })}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('strike')}
        label={t('documentsAdmin.toolbar.strike', { defaultValue: 'Strikethrough' })}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" aria-hidden="true" />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-white/10" />
      <ToolbarButton
        active={editor.isActive('heading', { level: 1 })}
        label={t('documentsAdmin.toolbar.heading1', { defaultValue: 'Heading 1' })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="h-4 w-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('heading', { level: 2 })}
        label={t('documentsAdmin.toolbar.heading2', { defaultValue: 'Heading 2' })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" aria-hidden="true" />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-white/10" />
      <ToolbarButton
        active={editor.isActive('bulletList')}
        label={t('documentsAdmin.toolbar.bulletList', { defaultValue: 'Bullet list' })}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('orderedList')}
        label={t('documentsAdmin.toolbar.orderedList', { defaultValue: 'Numbered list' })}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('blockquote')}
        label={t('documentsAdmin.toolbar.quote', { defaultValue: 'Quote' })}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" aria-hidden="true" />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-white/10" />
      <ToolbarButton
        disabled={!editor.can().undo()}
        label={t('documentsAdmin.toolbar.undo', { defaultValue: 'Undo' })}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 className="h-4 w-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        disabled={!editor.can().redo()}
        label={t('documentsAdmin.toolbar.redo', { defaultValue: 'Redo' })}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 className="h-4 w-4" aria-hidden="true" />
      </ToolbarButton>
    </div>
  );
}

export interface DocumentEditorPageProps {
  documentId?: string;
  basePath?: string;
}

export function DocumentEditorPage({ documentId, basePath }: DocumentEditorPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { client, basePath: runtimeBasePath } = useDocumentsAdminRuntime();
  const resolvedBasePath = basePath ?? runtimeBasePath ?? '/admin/documents';
  const editorRef = useRef<Editor | null>(null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<string>('draft');
  const [loading, setLoading] = useState(Boolean(documentId));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driveSpaceId, setDriveSpaceId] = useState('');
  const [driveNodeId, setDriveNodeId] = useState('');
  const [driveSaving, setDriveSaving] = useState(false);
  const [driveSaved, setDriveSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [revisions, setRevisions] = useState<DocumentsAdminRevision[]>([]);
  const [revisionRefresh, setRevisionRefresh] = useState(0);
  const [revisionPreview, setRevisionPreview] = useState<{ version: string; body: string } | null>(
    null,
  );
  const [revisionBusy, setRevisionBusy] = useState<string | null>(null);
  const [identityLocale, setIdentityLocale] = useState('');
  const [identitySlug, setIdentitySlug] = useState('');
  const [identitySaving, setIdentitySaving] = useState(false);
  const [identitySaved, setIdentitySaved] = useState(false);

  useEffect(() => {
    if (!documentId) {
      setRevisions([]);
      return;
    }
    let cancelled = false;
    void client
      .listRevisions(documentId)
      .then((items) => {
        if (!cancelled) {
          setRevisions(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRevisions([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [client, documentId, saved, revisionRefresh]);

  useEffect(() => {
    if (!documentId) {
      return;
    }
    let cancelled = false;
    void client
      .getIdentity(documentId)
      .then((identity) => {
        if (!cancelled) {
          setIdentityLocale(identity.locale);
          setIdentitySlug(identity.slug);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIdentityLocale('');
          setIdentitySlug('');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [client, documentId, saved]);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p></p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'sdkwork-doc-editor-content',
      },
    },
    onUpdate: ({ editor: instance }) => {
      setBody(instance.getHTML());
      setDirty(true);
      setSaved(false);
    },
  });
  editorRef.current = editor;

  useEffect(() => {
    if (!documentId) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    client
      .retrieve(documentId)
      .then((document) => {
        if (!active) {
          return;
        }
        setTitle(document.title);
        setBody(document.body ?? '');
        setStatus(document.status || 'draft');
        editorRef.current?.commands.setContent(document.body || '<p></p>', { emitUpdate: false });
        setDirty(false);
      })
      .catch(() => {
        if (active) {
          setError(t('documentsAdmin.list.error', { defaultValue: 'Could not load documents.' }));
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
  }, [client, documentId, t]);

  const handleSave = useCallback(async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError(t('documentsAdmin.editor.titleRequired', { defaultValue: 'A title is required.' }));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (documentId) {
        await client.update(documentId, { title: trimmedTitle, body, status });
      } else {
        const created = await client.create({ title: trimmedTitle, body });
        if (status !== created.status) {
          await client.update(created.id, { status });
        }
        navigate(`${resolvedBasePath}/${created.id}`, { replace: true });
      }
      setDirty(false);
      setSaved(true);
    } catch {
      setError(t('documentsAdmin.editor.error', { defaultValue: 'Save failed.' }));
    } finally {
      setSaving(false);
    }
  }, [body, client, documentId, navigate, resolvedBasePath, status, t, title]);

  const handleBindDrive = useCallback(async () => {
    if (!documentId) {
      return;
    }
    setDriveSaving(true);
    setDriveSaved(false);
    setError(null);
    try {
      await client.bindDrive(documentId, {
        ...(driveSpaceId.trim() ? { driveSpaceId: driveSpaceId.trim() } : {}),
        ...(driveNodeId.trim() ? { driveNodeId: driveNodeId.trim() } : {}),
      });
      setDriveSaved(true);
    } catch {
      setError(t('documentsAdmin.editor.driveError', { defaultValue: 'Could not save the Drive binding.' }));
    } finally {
      setDriveSaving(false);
    }
  }, [client, documentId, driveNodeId, driveSpaceId, t]);

  const handleDelete = useCallback(async () => {
    if (!documentId) {
      return;
    }
    const confirmed = window.confirm(
      t('documentsAdmin.editor.deleteConfirm', {
        defaultValue: 'Delete this document permanently? This cannot be undone.',
      }),
    );
    if (!confirmed) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await client.delete(documentId);
      navigate(resolvedBasePath, { replace: true });
    } catch {
      setError(t('documentsAdmin.editor.deleteError', { defaultValue: 'Could not delete the document.' }));
    } finally {
      setDeleting(false);
    }
  }, [client, documentId, navigate, resolvedBasePath, t]);

  const handleSaveIdentity = useCallback(async () => {
    if (!documentId) {
      return;
    }
    setIdentitySaving(true);
    setIdentitySaved(false);
    setError(null);
    try {
      const identity = await client.updateIdentity(documentId, {
        locale: identityLocale.trim(),
        slug: identitySlug.trim(),
      });
      setIdentityLocale(identity.locale);
      setIdentitySlug(identity.slug);
      setIdentitySaved(true);
    } catch {
      setError(
        t('documentsAdmin.editor.identityError', {
          defaultValue: 'Could not save the public identity.',
        }),
      );
    } finally {
      setIdentitySaving(false);
    }
  }, [client, documentId, identityLocale, identitySlug, t]);

  const handlePreviewRevision = useCallback(
    async (revision: DocumentsAdminRevision) => {
      if (!documentId) {
        return;
      }
      setRevisionBusy(revision.id);
      setError(null);
      try {
        const content = await client.getRevisionContent(documentId, revision.id);
        setRevisionPreview({ version: revision.contentVersion, body: content.body });
      } catch {
        setError(
          t('documentsAdmin.editor.identityError', {
            defaultValue: 'Could not save the public identity.',
          }),
        );
      } finally {
        setRevisionBusy(null);
      }
    },
    [client, documentId, t],
  );

  const handleRestoreRevision = useCallback(
    async (revision: DocumentsAdminRevision) => {
      if (!documentId) {
        return;
      }
      const confirmed = window.confirm(
        t('documentsAdmin.editor.revisionsRestoreConfirm', {
          defaultValue:
            'Restore this revision? It becomes a new published version and keeps the history.',
        }),
      );
      if (!confirmed) {
        return;
      }
      setRevisionBusy(revision.id);
      setError(null);
      try {
        const restored = await client.restoreRevision(documentId, revision.id);
        setBody(restored.body);
        setDirty(true);
        setSaved(false);
        setRevisionRefresh((value) => value + 1);
        setRevisionPreview(null);
      } catch {
        setError(
          t('documentsAdmin.editor.revisionsRestoreError', {
            defaultValue: 'Could not restore the revision.',
          }),
        );
      } finally {
        setRevisionBusy(null);
      }
    },
    [client, documentId, t],
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 md:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            to={resolvedBasePath}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('documentsAdmin.editor.back', { defaultValue: 'Back to documents' })}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {documentId
              ? t('documentsAdmin.editor.editTitle', { defaultValue: 'Edit document' })
              : t('documentsAdmin.editor.newTitle', { defaultValue: 'New document' })}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {saved && !dirty ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {t('documentsAdmin.editor.saved', { defaultValue: 'Saved' })}
            </span>
          ) : null}
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            disabled={saving || loading}
            onClick={() => void handleSave()}
            type="button"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            {saving
              ? t('documentsAdmin.editor.saving', { defaultValue: 'Saving...' })
              : t('documentsAdmin.editor.save', { defaultValue: 'Save' })}
          </button>
          {documentId ? (
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-red-500/25 dark:text-red-300 dark:hover:bg-red-500/10"
              disabled={deleting || saving}
              onClick={() => void handleDelete()}
              type="button"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              )}
              {deleting
                ? t('documentsAdmin.editor.deleting', { defaultValue: 'Deleting...' })
                : t('documentsAdmin.editor.delete', { defaultValue: 'Delete document' })}
            </button>
          ) : null}
        </div>
      </header>

      {error ? (
        <div
          className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
          role="alert"
        >
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {t('documentsAdmin.editor.saving', { defaultValue: 'Loading...' })}
        </div>
      ) : (
        <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem]">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                {t('documentsAdmin.editor.titleLabel', { defaultValue: 'Title' })}
              </span>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white"
                onChange={(event) => {
                  setTitle(event.target.value);
                  setDirty(true);
                  setSaved(false);
                }}
                placeholder={t('documentsAdmin.editor.titlePlaceholder', {
                  defaultValue: 'Document title',
                })}
                value={title}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                {t('documentsAdmin.editor.statusLabel', { defaultValue: 'Status' })}
              </span>
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white"
                onChange={(event) => {
                  setStatus(event.target.value);
                  setDirty(true);
                  setSaved(false);
                }}
                value={status}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {t(`documentsAdmin.status.${option}`, { defaultValue: option })}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t('documentsAdmin.editor.bodyLabel', { defaultValue: 'Content' })}
            </span>
            <div className="sdkwork-doc-editor overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0a0a0a]">
              <EditorToolbar editor={editor} />
              <EditorContent editor={editor} />
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {t('documentsAdmin.editor.publishedHint', {
                defaultValue: 'Published documents are visible to readers immediately.',
              })}
            </p>
          </div>
        </div>
      )}

      {documentId && !loading ? (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {t('documentsAdmin.editor.driveTitle', { defaultValue: 'Drive storage' })}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {t('documentsAdmin.editor.driveDescription', {
                defaultValue: 'Bind the Drive space and node that hold this localized document body.',
              })}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                {t('documentsAdmin.editor.driveSpaceLabel', { defaultValue: 'Drive space ID' })}
              </span>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white"
                onChange={(event) => {
                  setDriveSpaceId(event.target.value);
                  setDriveSaved(false);
                }}
                value={driveSpaceId}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                {t('documentsAdmin.editor.driveNodeLabel', { defaultValue: 'Drive node ID' })}
              </span>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white"
                onChange={(event) => {
                  setDriveNodeId(event.target.value);
                  setDriveSaved(false);
                }}
                value={driveNodeId}
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-white/15 dark:text-slate-100 dark:hover:bg-white/5"
              disabled={driveSaving}
              onClick={() => void handleBindDrive()}
              type="button"
            >
              {driveSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              )}
              {driveSaving
                ? t('documentsAdmin.editor.driveBinding', { defaultValue: 'Binding...' })
                : t('documentsAdmin.editor.driveBind', { defaultValue: 'Save Drive binding' })}
            </button>
            {driveSaved ? (
              <span className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
                {t('documentsAdmin.editor.driveBound', { defaultValue: 'Drive binding saved.' })}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('documentsAdmin.editor.driveHint', {
              defaultValue:
                'Clear the node ID to fall back to the database copy. The body file must follow <space>/<locale>/<slug>.html.',
            })}
          </p>
        </section>
      ) : null}

      {documentId && !loading ? (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {t('documentsAdmin.editor.identityTitle', { defaultValue: 'Public identity' })}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {t('documentsAdmin.editor.identityDescription', {
                defaultValue:
                  'The locale and slug decide the public /docs URL and the Drive folder/file name.',
              })}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                {t('documentsAdmin.editor.identityLocale', { defaultValue: 'Locale' })}
              </span>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white"
                onChange={(event) => {
                  setIdentityLocale(event.target.value);
                  setIdentitySaved(false);
                }}
                value={identityLocale}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                {t('documentsAdmin.editor.identitySlug', { defaultValue: 'Slug' })}
              </span>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white"
                onChange={(event) => {
                  setIdentitySlug(event.target.value);
                  setIdentitySaved(false);
                }}
                value={identitySlug}
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-white/15 dark:text-slate-100 dark:hover:bg-white/5"
              disabled={identitySaving}
              onClick={() => void handleSaveIdentity()}
              type="button"
            >
              {identitySaving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              )}
              {identitySaving
                ? t('documentsAdmin.editor.identitySaving', { defaultValue: 'Saving...' })
                : t('documentsAdmin.editor.identitySave', { defaultValue: 'Save identity' })}
            </button>
            {identitySaved ? (
              <span className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
                {t('documentsAdmin.editor.identitySaved', {
                  defaultValue: 'Public identity saved.',
                })}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('documentsAdmin.editor.identityHint', {
              defaultValue:
                'Slug uses lowercase letters, digits, and hyphens. Republish to move the Drive file.',
            })}
          </p>
        </section>
      ) : null}

      {documentId && !loading ? (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {t('documentsAdmin.editor.revisionsTitle', { defaultValue: 'Version history' })}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {t('documentsAdmin.editor.revisionsHint', {
                defaultValue:
                  'Each publish writes a new immutable body file to Drive and records its node and checksum.',
              })}
            </p>
          </div>
          {revisions.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('documentsAdmin.editor.revisionsEmpty', {
                defaultValue:
                  'No Drive revisions yet. Publish the document to create the first version.',
              })}
            </p>
          ) : (
            <ol className="divide-y divide-slate-100 dark:divide-white/5">
              {revisions.map((revision) => (
                <li
                  className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-sm"
                  key={revision.id}
                >
                  <span className="font-medium text-slate-900 dark:text-white">
                    v{revision.contentVersion}
                    <span className="ml-2 font-normal text-slate-500 dark:text-slate-400">
                      {revision.locale}
                      {revision.slug ? ` · ${revision.slug}` : ''}
                    </span>
                  </span>
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    {revision.createdAt}
                  </span>
                  <code className="w-full truncate font-mono text-xs text-slate-400">
                    {revision.driveNodeId}
                  </code>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
                      disabled={revisionBusy === revision.id}
                      onClick={() => void handlePreviewRevision(revision)}
                      type="button"
                    >
                      {t('documentsAdmin.editor.revisionsPreview', { defaultValue: 'Preview' })}
                    </button>
                    <button
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
                      disabled={revisionBusy === revision.id}
                      onClick={() => void handleRestoreRevision(revision)}
                      type="button"
                    >
                      {revisionBusy === revision.id
                        ? t('documentsAdmin.editor.revisionsRestoring', {
                            defaultValue: 'Restoring...',
                          })
                        : t('documentsAdmin.editor.revisionsRestore', { defaultValue: 'Restore' })}
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {revisionPreview ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-black/30">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {t('documentsAdmin.editor.revisionsPreviewTitle', {
                    defaultValue: 'Revision preview',
                  })}{' '}
                  v{revisionPreview.version}
                </span>
                <button
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 dark:border-white/15 dark:text-slate-200"
                  onClick={() => setRevisionPreview(null)}
                  type="button"
                >
                  {t('documentsAdmin.editor.revisionsClose', { defaultValue: 'Close' })}
                </button>
              </div>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-700 dark:text-slate-300">
                {revisionPreview.body}
              </pre>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
