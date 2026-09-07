// =============================================================================
// BRANIFY ADMIN — Blog editor document import (ADDITIVE feature)
// -----------------------------------------------------------------------------
// • BlogImportStrip — slim "IMPORT CONTENT" row at the top of the Blog Editor
//   with two buttons: Word .DOCX and PDF. Visible but not intrusive.
// • BlogImportModal — the staged flow: unsaved-content warning → analyze
//   (progress) → preview with detected stats (Words / Images / Headings /
//   Links + image thumbnails) → import (upload progress) → done.
//
// Rules implemented here:
//  • existing editor content is NEVER overwritten silently — a confirm dialog
//    ("Replace & Import") appears whenever the editor already holds content
//  • cancelling at any point before "Import Into Editor" uploads nothing
//    (staged imports — no orphan media)
//  • the first image is never auto-promoted to the featured image
//  • partial failures are non-fatal: "…but N images could not be extracted"
//  • files are validated (extension + MIME + size ≤ IMPORT_MAX_MB) and the
//    parsers never execute document scripts/macros
// =============================================================================
import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, FileText, FileType2, Import, Loader2 } from 'lucide-react';
import {
  Badge, Btn, ConfirmDialog, ErrorBlock, Modal, cx, useToast,
} from '../../ui';
import { fmtBytes } from '../../lib/format';
import {
  IMPORT_MAX_MB, analyzeDocument, finalizeDocumentImport, validateImportFile,
  type ImportAnalysis, type ImportKind, type ImportProgress, type ImportResult,
} from '../../lib/docImport';

export interface BlogImportPayload {
  html: string;
  suggestedTitle: string;
  stats: ImportResult['stats'];
}

type Phase = 'idle' | 'analyzing' | 'preview' | 'importing' | 'error';

const PROGRESS_STEPS: Array<{ phase: ImportProgress['phase']; label: string }> = [
  { phase: 'reading', label: 'Reading document' },
  { phase: 'extracting', label: 'Extracting images' },
  { phase: 'uploading', label: 'Uploading to the media library' },
  { phase: 'processing', label: 'Importing into editor' },
];

const StatTile: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 text-center">
    <p className="font-display text-lg font-extrabold tabular-nums text-[#111827]">{value}</p>
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#64748B]">{label}</p>
  </div>
);

export const BlogImportStrip: React.FC<{
  onImported: (payload: BlogImportPayload) => void;
  /** True when the editor already holds content — triggers the replace warning. */
  warnUnsaved: boolean;
}> = ({ onImported, warnUnsaved }) => {
  const { push } = useToast();
  const docxInput = useRef<HTMLInputElement>(null);
  const pdfInput = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>('idle');
  const [confirmUnsaved, setConfirmUnsaved] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<ImportKind>('docx');
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [thumbs, setThumbs] = useState<string[]>([]);

  const busy = phase === 'analyzing' || phase === 'importing';

  // build thumbnail object URLs for the preview (revoked on change/close)
  useEffect(() => {
    if (phase !== 'preview' || !analysis) { setThumbs([]); return; }
    const urls = analysis.images.slice(0, 12).map((img) => {
      try { return URL.createObjectURL(new Blob([img.bytes], { type: img.contentType })); } catch { return ''; }
    }).filter(Boolean);
    setThumbs(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [phase, analysis]);

  const closeAll = () => {
    setPhase('idle');
    setConfirmUnsaved(false);
    setAnalysis(null);
    setProgress(null);
    setResult(null);
    setError(null);
    setFile(null);
  };

  const analyze = async (f: File, k: ImportKind) => {
    setFile(f);
    setKind(k);
    setError(null);
    setResult(null);
    setAnalysis(null);
    setProgress({ phase: 'reading', detail: k === 'docx' ? 'Reading document…' : 'Opening PDF…' });
    setPhase('analyzing');
    try {
      const a = await analyzeDocument(f, k, setProgress);
      setAnalysis(a);
      setPhase('preview');
    } catch (e) {
      setError({
        title: 'Import failed',
        message: e instanceof Error ? e.message : 'The document could not be read.',
      });
      setPhase('error');
    }
  };

  const onFilePicked = (k: ImportKind) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (e.target.value) e.target.value = '';
    if (!f) return;
    const invalid = validateImportFile(f, k);
    if (invalid) { push('error', invalid); return; }
    if (warnUnsaved) {
      setFile(f);
      setKind(k);
      setConfirmUnsaved(true);
      return;
    }
    void analyze(f, k);
  };

  const doImport = async () => {
    if (!analysis || !file) return;
    setPhase('importing');
    setProgress({ phase: 'uploading', detail: 'Preparing images…', done: 0, total: analysis.images.length });
    try {
      const r = await finalizeDocumentImport(analysis, setProgress);
      setResult(r);
      onImported({ html: r.html, suggestedTitle: r.suggestedTitle, stats: r.stats });
      if (r.stats.failedImages > 0) {
        push('info', `Article imported, but ${r.stats.failedImages} image${r.stats.failedImages === 1 ? '' : 's'} could not be extracted.`);
      } else {
        push('success', `Imported ${analysis.images.length} image${analysis.images.length === 1 ? '' : 's'} and ${r.stats.words.toLocaleString()} words from ${file.name}.`);
      }
      closeAll();
    } catch (e) {
      setError({
        title: 'Import failed',
        message: e instanceof Error ? e.message : 'The document could not be imported.',
      });
      setPhase('error');
    }
  };

  const stepIndex = progress ? PROGRESS_STEPS.findIndex((s) => s.phase === progress.phase) : -1;
  const uploadPct = progress && progress.total
    ? Math.round(((progress.done || 0) / progress.total) * 100)
    : null;

  return (
    <>
      {/* ============ slim import strip (spec: visible but not intrusive) ============ */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-[rgba(201,164,92,0.16)] bg-[#F8FAFC]/85 px-4 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#C9A45C]/15 text-[#8F6B2D]">
          <Import size={15} />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8F6B2D]">Import content</p>
          <p className="text-[11px] text-[#64748B]">Import an existing document and continue editing it here.</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Btn variant="outline" size="sm" icon={FileText} disabled={busy} onClick={() => docxInput.current?.click()}>
            Word .DOCX
          </Btn>
          <Btn variant="outline" size="sm" icon={FileType2} disabled={busy} onClick={() => pdfInput.current?.click()}>
            PDF
          </Btn>
          <span className="hidden text-[10.5px] text-[#94A3B8] sm:block">Max {IMPORT_MAX_MB} MB · images join the media library</span>
        </div>
        <input ref={docxInput} type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" aria-hidden="true" onChange={onFilePicked('docx')} />
        <input ref={pdfInput} type="file" accept=".pdf,application/pdf" className="hidden" aria-hidden="true" onChange={onFilePicked('pdf')} />
      </div>

      {/* ============ unsaved content guard (never overwrite silently) ============ */}
      <ConfirmDialog
        open={confirmUnsaved}
        onClose={() => { setConfirmUnsaved(false); setFile(null); }}
        onConfirm={() => { const f = file; const k = kind; setConfirmUnsaved(false); if (f) void analyze(f, k); }}
        title="Replace current article content?"
        message={(
          <div className="text-[13px] leading-relaxed">
            <p>You have unsaved content. Importing this document will replace the current article content.</p>
            <p className="mt-2 text-xs text-[#475569]">Title, excerpt, SEO settings and the featured image are kept — only the article body is replaced.</p>
          </div>
        )}
        confirmLabel="Replace & Import"
        danger
      />

      {/* ============ staged import flow ============ */}
      <Modal
        open={phase !== 'idle'}
        onClose={() => { if (!busy) closeAll(); }}
        title={
          phase === 'analyzing' ? 'Analyzing document'
            : phase === 'preview' ? 'Import document'
              : phase === 'importing' ? 'Importing document'
                : phase === 'error' ? 'Document import'
                  : 'Import document'
        }
        subtitle={file ? <span className="font-mono">{file.name} · {fmtBytes(file.size)}</span> : undefined}
        width="md"
        footer={
          phase === 'preview' ? (
            <>
              <Btn variant="ghost" onClick={closeAll}>Cancel</Btn>
              <Btn variant="gold" icon={Import} onClick={() => void doImport()}>
                Import Into Editor
              </Btn>
            </>
          ) : phase === 'error' ? (
            <>
              <Btn variant="ghost" onClick={closeAll}>Close</Btn>
              <Btn variant="outline" onClick={() => { setError(null); setPhase('idle'); }}>Pick another file</Btn>
            </>
          ) : phase === 'analyzing' || phase === 'importing' ? (
            <Btn variant="ghost" disabled>Working…</Btn>
          ) : undefined
        }
      >
        {/* --- analyzing / importing progress --- */}
        {(phase === 'analyzing' || phase === 'importing') && (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              {PROGRESS_STEPS
                .filter((s) => (phase === 'analyzing' ? s.phase !== 'uploading' : true))
                .map((s, i) => {
                  const idx = PROGRESS_STEPS.indexOf(s);
                  const active = stepIndex === idx;
                  const done = stepIndex > idx || phase === 'importing' && s.phase === 'reading' || phase === 'importing' && s.phase === 'extracting';
                  const shown = phase === 'importing' || (phase === 'analyzing' && s.phase !== 'uploading' && s.phase !== 'processing');
                  if (!shown) return null;
                  return (
                    <div key={s.phase} className={cx('flex items-center gap-2.5 text-sm', active ? 'font-bold text-[#111827]' : done ? 'text-emerald-700' : 'text-[#94A3B8]')}>
                      {active
                        ? <Loader2 size={15} className="animate-spin text-[#8F6B2D]" />
                        : done ? <CheckCircle2 size={15} className="text-emerald-600" /> : <span className="h-[15px] w-[15px] rounded-full border border-[#E2E8F0]" />}
                      {s.label}
                      {active && progress?.detail && <span className="ml-auto text-[11px] font-semibold text-[#64748B]">{progress.detail}</span>}
                    </div>
                  );
                })}
            </div>
            {phase === 'importing' && uploadPct !== null && (
              <div>
                <div className="h-2 overflow-hidden rounded-full bg-black/[0.07]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#E8C97C] to-[#C9A45C] transition-all" style={{ width: `${uploadPct}%` }} />
                </div>
                <p className="mt-1.5 text-center text-[11px] font-semibold text-[#64748B]">
                  {progress?.detail || 'Uploading…'}
                </p>
              </div>
            )}
            <p className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-[11px] leading-relaxed text-[#64748B]">
              Nothing is uploaded to the media library until you press “Import Into Editor”. You can cancel safely at any point.
            </p>
          </div>
        )}

        {/* --- preview: detected content --- */}
        {phase === 'preview' && analysis && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-4 gap-2">
              <StatTile label="Words" value={analysis.words.toLocaleString()} />
              <StatTile label="Images" value={analysis.images.length} />
              <StatTile label="Headings" value={analysis.headings} />
              <StatTile label="Links" value={analysis.links} />
            </div>

            {analysis.images.length > 0 ? (
              <div>
                <p className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#475569]">
                  Extracted images
                  <Badge tone="gold">{analysis.images.length}</Badge>
                  {analysis.totalEmbedded > analysis.images.length && (
                    <span className="font-medium normal-case tracking-normal text-[#64748B]">
                      ({analysis.totalEmbedded - analysis.images.length} duplicate{analysis.totalEmbedded - analysis.images.length === 1 ? '' : 's'} merged)
                    </span>
                  )}
                </p>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {thumbs.map((u, i) => (
                    <div key={u} className="flex h-16 items-center justify-center overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
                      <img src={u} alt={`Extracted image ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
                    </div>
                  ))}
                  {analysis.images.length > 12 && (
                    <div className="flex h-16 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-xs font-bold text-[#64748B]">
                      +{analysis.images.length - 12}
                    </div>
                  )}
                </div>
                <p className="mt-1.5 text-[11px] text-[#64748B]">Images stay in their document positions and are uploaded to the media library on import. Alt text stays empty for you to fill in — the SEO audit will flag missing alt.</p>
              </div>
            ) : (
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/[0.07] px-3 py-2 text-[11px] font-semibold text-amber-700">
                No embedded images were found in this document — only text will be imported.
              </p>
            )}

            {analysis.suggestedTitle && (
              <p className="text-[11px] text-[#64748B]">
                Detected title: <strong className="text-[#334155]">{analysis.suggestedTitle}</strong>
                {' '}— used only if the editor title is empty.
              </p>
            )}
            <p className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-[11px] leading-relaxed text-[#64748B]">
              Importing replaces the article body with the document content. Everything stays fully editable afterwards — visual editor, HTML mode, images and SEO all work normally.
            </p>
          </div>
        )}

        {/* --- error --- */}
        {phase === 'error' && error && (
          <ErrorBlock
            title={error.title}
            message={error.message}
            onRetry={() => { setError(null); setPhase('idle'); }}
          />
        )}
      </Modal>
    </>
  );
};

// re-export for convenience of the editor's type imports
export type { ImportKind };
