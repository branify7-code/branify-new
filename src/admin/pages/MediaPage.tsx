// =============================================================================
// BRANIFY ADMIN — MEDIA LIBRARY (/admin/media)
// -----------------------------------------------------------------------------
// Real uploads through the admin data layer (Supabase Storage in production,
// local preview API in the sandbox), asset grid with previews, copy-URL,
// alt-text editing and guarded deletes.
// =============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Copy, File as FileIcon, ImagePlus, Pencil, Search, Trash2, UploadCloud,
} from 'lucide-react';
import type { AdminPageProps } from '../lib/auth';
import { AdminError, deleteRow, listRows, resolveAssetUrl, updateRow, uploadMedia } from '../lib/backend';
import type { MediaRow } from '../lib/types';
import {
  Badge, Btn, Card, ConfirmDialog, EmptyState, ErrorBlock, Field, Input, LoadingBlock,
  Modal, cx, useToast,
} from '../ui';
import { fmtBytes, timeAgo, truncate } from '../lib/format';

const PAGE_SIZE = 24;

const isImage = (mime: string): boolean => mime.startsWith('image/');

export const MediaPage: React.FC<AdminPageProps> = () => {
  const { push } = useToast();
  const [rows, setRows] = useState<MediaRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);

  // upload state
  const [alt, setAlt] = useState('');
  const [uploading, setUploading] = useState<{ name: string; done: number; total: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // edit-alt modal
  const [editRow, setEditRow] = useState<MediaRow | null>(null);
  const [editAlt, setEditAlt] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // delete
  const [confirmDelete, setConfirmDelete] = useState<MediaRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRows = useCallback(async (p: number, q: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await listRows<MediaRow>('media_assets', { page: p, pageSize: PAGE_SIZE, search: q || undefined, sort: 'created_at', dir: 'desc' });
      setRows(res.rows);
      setTotal(res.total);
      setPage(res.page);
    } catch (e) {
      setError({ title: 'Could not load media assets', message: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchRows(page, search); }, [fetchRows, page, search]);

  // debounce the search box
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    for (let i = 0; i < list.length; i++) {
      setUploading({ name: list[i].name, done: i, total: list.length });
      try {
        await uploadMedia(list[i], alt.trim());
        push('success', `Uploaded ${truncate(list[i].name, 32)}`);
      } catch (e) {
        const msg = e instanceof AdminError ? e.message : (e as Error).message;
        push('error', `Upload failed for ${truncate(list[i].name, 26)}: ${msg}`);
      }
    }
    setUploading(null);
    setAlt('');
    if (fileInput.current) fileInput.current.value = '';
    await fetchRows(1, search);
  };

  const copyUrl = async (row: MediaRow) => {
    const url = resolveAssetUrl(row.url);
    try {
      await navigator.clipboard.writeText(url);
      push('success', `URL copied: ${truncate(url, 48)}`);
    } catch {
      push('error', 'Clipboard unavailable in this browser context.');
    }
  };

  const saveAlt = async () => {
    if (!editRow) return;
    setEditSaving(true);
    try {
      await updateRow<MediaRow>('media_assets', editRow.id, { alt: editAlt.trim() });
      push('success', 'Alt text updated');
      setEditRow(null);
      await fetchRows(page, search);
    } catch (e) {
      push('error', `Update failed: ${(e as Error).message}`);
    } finally {
      setEditSaving(false);
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteRow('media_assets', confirmDelete.id);
      push('success', `Deleted ${truncate(confirmDelete.filename, 30)}`);
      setConfirmDelete(null);
      await fetchRows(page, search);
    } catch (e) {
      push('error', `Delete failed: ${(e as Error).message}`);
      setConfirmDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold text-[#F5F6F2]">Media Library</h1>
          <p className="text-xs text-[#A7AFBA]">Images and files used across the site — uploads are real, not mocked</p>
        </div>
        <Badge tone="gold">{total} asset{total === 1 ? '' : 's'}</Badge>
      </div>

      {/* Upload zone */}
      <Card title="Upload" subtitle="Alt text is applied to every file in this upload batch">
        <div className="flex flex-col gap-3">
          <Field label="Alt text" hint="Describe the image for accessibility and SEO (leave empty for non-image files).">
            <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="e.g. BRANIFY gold logo on dark background" />
          </Field>
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload files — drop files here or click to browse"
            onClick={() => fileInput.current?.click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInput.current?.click(); }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files?.length) void uploadFiles(e.dataTransfer.files);
            }}
            className={cx(
              'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-9 text-center transition-colors',
              dragOver ? 'border-[#C9A45C]/70 bg-[#C9A45C]/[0.08]' : 'border-white/12 bg-white/[0.02] hover:border-[#C9A45C]/40',
            )}
          >
            <UploadCloud size={26} className="text-[#C9A45C]" />
            <p className="text-sm font-semibold text-[#F5F6F2]">Drop files here or click to browse</p>
            <p className="text-[11px] text-[#6B7280]">
              {uploading
                ? `Uploading ${uploading.done + 1}/${uploading.total}: ${truncate(uploading.name, 34)}…`
                : 'Multiple files upload sequentially · alt text above is applied to each'}
            </p>
            <Btn variant="gold" size="sm" icon={ImagePlus} loading={Boolean(uploading)} className="mt-1 pointer-events-none" tabIndex={-1}>
              {uploading ? 'Uploading…' : 'Choose files'}
            </Btn>
            <input
              ref={fileInput}
              type="file"
              multiple
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
              onChange={(e) => { if (e.target.files?.length) void uploadFiles(e.target.files); }}
            />
          </div>
        </div>
      </Card>

      {/* Search + grid */}
      <Card
        title="Assets"
        subtitle="Newest first"
        actions={
          <div className="relative">
            <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#566072]" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search filename, alt, mime…"
              aria-label="Search media assets"
              className="h-8 w-44 rounded-lg border border-white/10 bg-[#04070C]/80 pl-7 pr-2 text-xs text-[#F5F6F2] placeholder-[#5A6472] outline-none focus:border-[#C9A45C]/60"
            />
          </div>
        }
      >
        {error ? (
          <ErrorBlock title={error.title} message={error.message} onRetry={() => void fetchRows(page, search)} />
        ) : loading && rows.length === 0 ? (
          <LoadingBlock label="Loading assets…" />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={ImagePlus}
            title={search ? 'No assets match your search' : 'No media yet'}
            hint={search ? 'Try a different filename or clear the search.' : 'Upload your first image or file with the zone above — it is stored in the admin media collection.'}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {rows.map((row) => (
                <div key={row.id} className="group flex flex-col overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02]">
                  <div className="flex h-28 items-center justify-center overflow-hidden border-b border-white/[0.06] bg-black/30">
                    {isImage(row.mime) ? (
                      <img
                        src={resolveAssetUrl(row.url)}
                        alt={row.alt || row.filename}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <FileIcon size={26} className="text-[#C9A45C]/70" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-2.5">
                    <p className="truncate text-xs font-semibold text-[#F5F6F2]" title={row.filename}>{row.filename}</p>
                    <p className="truncate text-[10px] text-[#6B7280]" title={row.alt || 'No alt text'}>{row.alt || 'No alt text'}</p>
                    <div className="flex flex-wrap items-center gap-1">
                      <Badge tone="steel" className="max-w-full"><span className="truncate normal-case tracking-normal">{row.mime || 'file'}</span></Badge>
                    </div>
                    <p className="text-[10px] text-[#566072]">{fmtBytes(row.size_bytes)} · {timeAgo(row.created_at)}</p>
                    <div className="mt-auto flex items-center gap-1 pt-1.5">
                      <Btn size="sm" variant="ghost" icon={Copy} onClick={() => void copyUrl(row)} aria-label={`Copy URL of ${row.filename}`} />
                      <Btn size="sm" variant="ghost" icon={Pencil} onClick={() => { setEditRow(row); setEditAlt(row.alt || ''); }} aria-label={`Edit alt text of ${row.filename}`} />
                      <Btn size="sm" variant="ghost" icon={Trash2} onClick={() => setConfirmDelete(row)} aria-label={`Delete ${row.filename}`} className="ml-auto text-red-300/80 hover:text-red-200" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[#A7AFBA]">
              <span className="tabular-nums">{total === 0 ? '0 assets' : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(total, page * PAGE_SIZE)} of ${total}`}</span>
              <div className="flex items-center gap-1.5">
                <Btn size="sm" variant="ghost" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)} aria-label="Previous page">Prev</Btn>
                <span className="tabular-nums">Page {page} / {totalPages}</span>
                <Btn size="sm" variant="ghost" disabled={page >= totalPages || loading} onClick={() => setPage(page + 1)} aria-label="Next page">Next</Btn>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Edit alt modal */}
      <Modal
        open={Boolean(editRow)}
        onClose={() => setEditRow(null)}
        title="Edit alt text"
        subtitle={editRow?.filename}
        width="sm"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setEditRow(null)} disabled={editSaving}>Cancel</Btn>
            <Btn variant="gold" onClick={() => void saveAlt()} loading={editSaving}>Save alt text</Btn>
          </>
        }
      >
        <Field label="Alt text" hint="Screen readers + image SEO.">
          <Input value={editAlt} onChange={(e) => setEditAlt(e.target.value)} placeholder="Describe this asset" autoFocus />
        </Field>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => void remove()}
        title="Delete asset?"
        message={confirmDelete ? (
          <>
            Delete <span className="font-mono text-[#E8C97C]">{confirmDelete.filename}</span>?
            <span className="mt-2 block text-xs text-amber-300">Check this asset isn&apos;t used in content before deleting — pages or overrides referencing it will show broken media.</span>
          </>
        ) : ''}
        confirmLabel="Delete asset"
        danger
        loading={deleting}
      />
    </div>
  );
};
