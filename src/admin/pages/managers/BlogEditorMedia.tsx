// =============================================================================
// BRANIFY ADMIN — Blog editor media integration
// -----------------------------------------------------------------------------
// • MediaPickerModal  — pick/upload an image from the EXISTING Media Library
//   (media_assets + Supabase Storage in production). No duplicate storage, no
//   duplicate upload architecture — the same backend layer /admin/media uses.
// • FeaturedImagePanel — cover image preview / replace / remove / alt text.
// =============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Link2, Search, Trash2, UploadCloud } from 'lucide-react';
import { AdminError, listRows, resolveAssetUrl, uploadMedia } from '../../lib/backend';
import type { MediaRow } from '../../lib/types';
import {
  Badge, Btn, Card, EmptyState, ErrorBlock, Field, Input, LoadingBlock, Modal, Tabs, cx, useToast,
} from '../../ui';
import { fmtBytes, truncate } from '../../lib/format';

const PAGE_SIZE = 24;

// ---------------------------------------------------------- upload optimization
// Client-side re-encode for large uploads: cap dimensions at 1920px and convert
// to WebP (~25-35% smaller). Small images and GIF/SVG pass through untouched;
// if the result is somehow bigger, the original file wins. Keeps the media
// library (and article pages) fast without touching the upload backend.
const OPTIMIZE_MAX_DIM = 1920;
const OPTIMIZE_MIN_BYTES = 280 * 1024;

async function optimizeImageFile(file: File): Promise<File> {
  try {
    if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return file;
    if (file.size < OPTIMIZE_MIN_BYTES) return file;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, OPTIMIZE_MAX_DIM / Math.max(bitmap.width, bitmap.height));
    if (scale >= 1 && file.size < 900 * 1024) { bitmap.close(); return file; }
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) { bitmap.close(); return file; }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', 0.82));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, { type: 'image/webp' });
  } catch {
    return file;
  }
}

export interface PickedImage {
  url: string;
  alt: string;
  filename?: string;
}

// ------------------------------------------------------------------ picker
export const MediaPickerModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onPick: (img: PickedImage) => void;
  title?: string;
}> = ({ open, onClose, onPick, title = 'Select an image' }) => {
  const { push } = useToast();
  const [tab, setTab] = useState('library');
  const [rows, setRows] = useState<MediaRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [selected, setSelected] = useState<MediaRow | null>(null);

  // upload state
  const [uploadAlt, setUploadAlt] = useState('');
  const [uploading, setUploading] = useState(false);
  const uploadInput = useRef<HTMLInputElement>(null);

  // url state
  const [urlValue, setUrlValue] = useState('');
  const [urlAlt, setUrlAlt] = useState('');

  useEffect(() => {
    if (!open) return;
    setSelected(null);
    setTab('library');
  }, [open]);

  const fetchRows = useCallback(async (p: number, q: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await listRows<MediaRow>('media_assets', {
        page: p, pageSize: PAGE_SIZE, search: q || undefined, sort: 'created_at', dir: 'desc',
      });
      setRows(res.rows.filter((r) => !r.mime || r.mime.startsWith('image/')));
      setTotal(res.total);
      setPage(res.page);
    } catch (e) {
      setError({ title: 'Could not load the media library', message: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (open) void fetchRows(page, search); }, [open, fetchRows, page, search]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const pick = (r: MediaRow | PickedImage) => {
    onPick({ url: resolveAssetUrl(r.url), alt: r.alt || '', filename: 'filename' in r ? r.filename : undefined });
    onClose();
  };

  const doUpload = async (file: File) => {
    setUploading(true);
    try {
      const row = await uploadMedia(await optimizeImageFile(file), uploadAlt.trim());
      push('success', `Uploaded ${truncate(row.filename, 30)}`);
      pick(row);
    } catch (e) {
      push('error', `Upload failed: ${e instanceof AdminError ? e.message : (e as Error).message}`);
    } finally {
      setUploading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Modal open={open} onClose={onClose} title={title} width="lg"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn variant="gold" disabled={!selected} onClick={() => selected && pick(selected)}>
            Use selected image
          </Btn>
        </>
      }
    >
      <Tabs
        tabs={[{ id: 'library', label: 'Media Library' }, { id: 'upload', label: 'Upload new' }, { id: 'url', label: 'Paste URL' }]}
        active={tab}
        onChange={setTab}
        className="mb-4 border-[#E2E8F0] bg-black/[0.04]"
      />

      {tab === 'library' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="relative">
              <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search filename or alt text…"
                aria-label="Search media library"
                className="h-8 w-56 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]/80 pl-7 pr-2 text-xs text-[#111827] placeholder-[#5A6472] outline-none focus:border-[#C9A45C]/60"
              />
            </div>
            <Badge tone="gold">{total} asset{total === 1 ? '' : 's'}</Badge>
          </div>

          {error ? (
            <ErrorBlock title={error.title} message={error.message} onRetry={() => void fetchRows(page, search)} />
          ) : loading && rows.length === 0 ? (
            <LoadingBlock label="Loading assets…" />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={ImagePlus}
              title={search ? 'No assets match your search' : 'Media library is empty'}
              hint={search ? 'Try another filename.' : 'Upload your first image from the Upload tab.'}
            />
          ) : (
            <>
              <div className="grid max-h-[46vh] grid-cols-2 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-3">
                {rows.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setSelected(row)}
                    onDoubleClick={() => pick(row)}
                    aria-label={`Select ${row.filename}`}
                    className={cx(
                      'group flex flex-col overflow-hidden rounded-xl border text-left transition-all',
                      selected?.id === row.id
                        ? 'border-[#C9A45C] ring-2 ring-[#C9A45C]/40'
                        : 'border-[#E2E8F0] hover:border-[#C9A45C]/50',
                    )}
                  >
                    <div className="flex h-24 items-center justify-center overflow-hidden bg-black/[0.04]">
                      <img src={resolveAssetUrl(row.url)} alt={row.alt || row.filename} loading="lazy" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex flex-col gap-0.5 px-2 py-1.5">
                      <p className="truncate text-[11px] font-semibold text-[#111827]" title={row.filename}>{row.filename}</p>
                      <p className="truncate text-[10px] text-[#64748B]">{fmtBytes(row.size_bytes)}{row.alt ? ` · ${truncate(row.alt, 22)}` : ' · no alt text'}</p>
                    </div>
                  </button>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-1 text-xs text-[#475569]">
                  <Btn size="sm" variant="ghost" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>Prev</Btn>
                  <span className="tabular-nums">Page {page} / {totalPages}</span>
                  <Btn size="sm" variant="ghost" disabled={page >= totalPages || loading} onClick={() => setPage(page + 1)}>Next</Btn>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'upload' && (
        <div className="flex flex-col gap-3">
          <Field label="Alt text" hint="Applied to this upload — describe what the image shows; don't stuff keywords.">
            <Input value={uploadAlt} onChange={(e) => setUploadAlt(e.target.value)} placeholder="e.g. Dashboard screenshot with traffic graph" />
          </Field>
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload an image — click to browse"
            onClick={() => uploadInput.current?.click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') uploadInput.current?.click(); }}
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E2E8F0] bg-white/[0.03] px-6 py-10 text-center transition-colors hover:border-[#C9A45C]/50"
          >
            <UploadCloud size={26} className="text-[#8F6B2D]" />
            <p className="text-sm font-semibold text-[#111827]">{uploading ? 'Uploading…' : 'Click to choose an image'}</p>
            <p className="text-[11px] text-[#64748B]">Stored in the existing BRANIFY media library (Supabase Storage)</p>
            <input
              ref={uploadInput}
              type="file"
              accept="image/*"
              className="hidden"
              aria-hidden="true"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void doUpload(f); if (e.target.value) e.target.value = ''; }}
            />
          </div>
        </div>
      )}

      {tab === 'url' && (
        <div className="flex flex-col gap-3">
          <Field label="Image URL" hint="External images should be stable and hotlink-friendly.">
            <Input value={urlValue} onChange={(e) => setUrlValue(e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Alt text">
            <Input value={urlAlt} onChange={(e) => setUrlAlt(e.target.value)} placeholder="Describe the image" />
          </Field>
          {urlValue && (
            <div className="flex h-36 items-center justify-center overflow-hidden rounded-xl border border-[#E2E8F0] bg-white/[0.03]">
              <img src={resolveAssetUrl(urlValue)} alt="Preview of pasted URL" className="max-h-full max-w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.25'; }} />
            </div>
          )}
          <div className="flex justify-end">
            <Btn variant="gold" icon={Link2} disabled={!urlValue.trim()} onClick={() => pick({ url: urlValue.trim(), alt: urlAlt.trim() })}>
              Use this URL
            </Btn>
          </div>
        </div>
      )}
    </Modal>
  );
};

// ------------------------------------------------------------------ featured image
export const FeaturedImagePanel: React.FC<{
  coverImage: string;
  coverAlt: string;
  onChange: (patch: { coverImage?: string; coverAlt?: string }) => void;
}> = ({ coverImage, coverAlt, onChange }) => {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <Card title="Featured image" subtitle="Cards, article header and social share fallback">
      <div className="flex flex-col gap-3">
        {coverImage ? (
          <div className="relative overflow-hidden rounded-xl border border-[#E2E8F0]">
            <img src={resolveAssetUrl(coverImage)} alt={coverAlt || 'Featured image preview'} className="aspect-video w-full object-cover" />
            <button
              type="button"
              aria-label="Remove featured image"
              onClick={() => onChange({ coverImage: '', coverAlt: '' })}
              className="absolute right-2 top-2 rounded-lg border border-red-500/30 bg-black/60 p-1.5 text-red-300 backdrop-blur transition-colors hover:bg-red-500/20"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ) : (
          <div className="flex h-28 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#E2E8F0] bg-white/[0.03] text-center">
            <ImagePlus size={20} className="text-[#8F6B2D]/70" />
            <p className="text-[11px] text-[#64748B]">No featured image yet</p>
          </div>
        )}

        <Field label="Featured image alt text" hint="Screen readers + image SEO — describe what the image shows; don't stuff keywords.">
          <Input
            value={coverAlt}
            onChange={(e) => onChange({ coverAlt: e.target.value })}
            placeholder="e.g. Team reviewing the new brand identity boards"
            disabled={!coverImage}
          />
        </Field>

        <div className="flex gap-2">
          <Btn size="sm" variant="gold" icon={ImagePlus} onClick={() => setPickerOpen(true)}>
            {coverImage ? 'Replace' : 'Select image'}
          </Btn>
          {coverImage && (
            <Btn size="sm" variant="ghost" onClick={() => onChange({ coverImage: '', coverAlt: '' })}>Remove</Btn>
          )}
        </div>
      </div>

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(img) => onChange({ coverImage: img.url, coverAlt: img.alt || coverAlt })}
        title="Featured image"
      />
    </Card>
  );
};
