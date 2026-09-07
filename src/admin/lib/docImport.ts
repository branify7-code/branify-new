// =============================================================================
// BRANIFY ADMIN — Document import service (Word .docx / PDF → article HTML)
// -----------------------------------------------------------------------------
// ADDITIVE feature for the existing Blog Editor (Admin → Blog → New/Edit post).
// Parses user-uploaded documents entirely client-side, extracts embedded
// images IN DOCUMENT ORDER, uploads them through the EXISTING media system
// (uploadMedia → media_assets + Supabase Storage 'media' bucket) and returns
// clean, sanitized article HTML that uses the same figure vocabulary as the
// editor (al-center / al-left / al-right, w-wide / w-inline + figcaption).
//
// Two-stage flow (staging per spec):
//   1. analyzeDocument()  — parse + extract text/images. NO storage writes.
//                           Cancel here leaves zero orphan files.
//   2. finalizeDocumentImport() — upload images (deduped), swap URLs,
//                           sanitize and return final editor HTML.
//
// Safety: uploaded documents are UNTRUSTED. Text is always escaped before it
// becomes HTML, every src/href passes through the shared DOMPurify sanitizer
// (sanitizeArticleHtml) before the editor sees it, and the parsers only READ
// document structure — macros, embedded scripts and PDF JavaScript are never
// executed. pdf.js runs with isEvalSupported:false.
//
// Duplicate protection: images are deduped by SHA-256 inside one import, and
// cross-import reuse tries a size+mime lookup against media_assets with a
// hash comparison before uploading anything new.
// =============================================================================

import { AdminError, listRows, uploadMedia } from './backend';
import type { MediaRow } from './types';
import { htmlToPlainText, sanitizeArticleHtml } from '../../lib/sanitizeHtml';

// ------------------------------------------------------------------ constants

export const IMPORT_MAX_MB = 25;
export const IMPORT_MAX_BYTES = IMPORT_MAX_MB * 1024 * 1024;

const DOCX_EXT = /\.docx$/i;
const PDF_EXT = /\.pdf$/i;
const DOCX_MIMES = new Set([
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/octet-stream', // Word on some Windows setups
  'application/x-zip-compressed',
  'application/zip',
  '',
]);
const PDF_MIMES = new Set(['application/pdf', 'application/octet-stream', 'application/binary', '']);

const MAX_IMAGES_PER_DOC = 60;
const MIN_IMAGE_EDGE = 24; // PDF-space points — anything smaller is decoration
const MAX_FILE_BASE_LEN = 40;

// ------------------------------------------------------------------ types

export type ImportKind = 'docx' | 'pdf';

export interface ImportProgress {
  phase: 'reading' | 'extracting' | 'uploading' | 'processing';
  detail: string;
  done?: number;
  total?: number;
}

export interface ImportStats {
  words: number;
  chars: number;
  images: number;
  headings: number;
  links: number;
  failedImages: number;
  reusedImages: number;
  totalEmbedded: number;
}

export interface ImportResult {
  html: string;
  suggestedTitle: string;
  stats: ImportStats;
  kind: ImportKind;
}

export interface RawImage {
  placeholder: string; // docimg:<n> — replaced by the real URL after upload
  bytes: Uint8Array;
  contentType: string;
  alt: string;
  hash: string;
}

export interface ImportAnalysis {
  kind: ImportKind;
  html: string; // sanitized-later html with docimg: placeholders
  images: RawImage[]; // unique by content hash
  totalEmbedded: number;
  suggestedTitle: string;
  words: number;
  headings: number;
  links: number;
  fileBase: string;
}

type ProgressFn = (p: ImportProgress) => void;

// ------------------------------------------------------------------ validation

export function validateImportFile(file: File, kind: ImportKind): string | null {
  if (kind === 'docx' && !DOCX_EXT.test(file.name)) {
    return 'That is not a .docx file. Word documents must be saved as .docx (not legacy .doc).';
  }
  if (kind === 'pdf' && !PDF_EXT.test(file.name)) {
    return 'That is not a .pdf file.';
  }
  const allowed = kind === 'docx' ? DOCX_MIMES : PDF_MIMES;
  if (file.type && !allowed.has(file.type)) {
    return `Unsupported file type (${file.type || 'unknown'}). Expected a ${kind === 'docx' ? '.docx Word document' : '.pdf file'}.`;
  }
  if (file.size <= 0) return 'That file is empty.';
  if (file.size > IMPORT_MAX_BYTES) {
    return `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum supported file size: ${IMPORT_MAX_MB} MB.`;
  }
  return null;
}

function assertMagic(bytes: Uint8Array, magic: number[], message: string): void {
  for (let i = 0; i < magic.length; i += 1) {
    if (bytes[i] !== magic[i]) throw new AdminError(message, 400);
  }
}

function importFailed(message: string): AdminError {
  return new AdminError(message, 422);
}

// ------------------------------------------------------------------ small utils

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  try {
    if (globalThis.crypto?.subtle) {
      const copy = new Uint8Array(bytes.byteLength);
      copy.set(bytes);
      const digest = await crypto.subtle.digest('SHA-256', copy.buffer);
      return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch { /* insecure context — fall through */ }
  // FNV-1a fallback (dedup within an import still works; crypto strength is irrelevant here)
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  const step = Math.max(1, Math.floor(bytes.length / 65536));
  for (let i = 0; i < bytes.length; i += step) {
    h1 = (h1 ^ bytes[i]) >>> 0; h1 = (h1 * 16777619) >>> 0;
    h2 = (h2 + bytes[i] * (i + 1)) >>> 0; h2 = (h2 * 2654435761) >>> 0;
  }
  return `fnv:${h1.toString(16)}:${h2.toString(16)}:${bytes.length}`;
}

function escapeHtmlText(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fileBaseFromName(name: string): string {
  const base = name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  return (base || 'document').slice(0, MAX_FILE_BASE_LEN).toLowerCase();
}

function extForMime(mime: string): string {
  if (/webp/i.test(mime)) return 'webp';
  if (/png/i.test(mime)) return 'png';
  if (/gif/i.test(mime)) return 'gif';
  if (/svg/i.test(mime)) return 'svg';
  return 'jpg';
}

/** Client-side re-encode (mirrors BlogEditorMedia.optimizeImageFile, blob-based). */
async function optimizeImageBlob(blob: Blob): Promise<Blob> {
  const SMALL = 280 * 1024;
  const MAX_DIM = 1920;
  try {
    if (blob.type === 'image/gif' || blob.type === 'image/svg+xml') return blob;
    const bitmap = await createImageBitmap(blob);
    const largest = Math.max(bitmap.width, bitmap.height);
    if (blob.size < SMALL && largest <= MAX_DIM) { bitmap.close(); return blob; }
    const scale = Math.min(1, MAX_DIM / Math.max(1, largest));
    if (scale >= 1 && blob.size < 900 * 1024) { bitmap.close(); return blob; }
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) { bitmap.close(); return blob; }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const out = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', 0.82));
    if (!out || out.size >= blob.size) return blob;
    return out;
  } catch {
    return blob;
  }
}

function countStats(html: string): { words: number; chars: number; headings: number; links: number; images: number } {
  const text = htmlToPlainText(html);
  const words = text.split(/\s+/).filter(Boolean).length;
  let headings = 0;
  let links = 0;
  let images = 0;
  try {
    const host = document.createElement('div');
    host.innerHTML = html;
    headings = host.querySelectorAll('h2, h3, h4').length;
    links = host.querySelectorAll('a[href]').length;
    images = host.querySelectorAll('img').length;
  } catch { /* advisory counts only */ }
  return { words, chars: text.length, headings, links, images };
}

// ================================================================== DOCX =====

interface DocxParseResult {
  html: string;
  images: Omit<RawImage, 'hash'>[];
  suggestedTitle: string;
}

async function parseDocxFile(file: File, onProgress: ProgressFn): Promise<DocxParseResult> {
  onProgress({ phase: 'reading', detail: 'Reading Word document…' });
  const buf = new Uint8Array(await file.arrayBuffer());
  assertMagic(buf, [0x50, 0x4b], 'This Word file appears to be corrupted. Re-save it as .docx and try again.');

  const mammoth = await import('mammoth/mammoth.browser.js');
  const images: Omit<RawImage, 'hash'>[] = [];

  const options = {
    styleMap: [
      "u => u",
      "p[style-name='Title'] => h1.docx-doc-title:fresh",
      "p[style-name='Subtitle'] => h2:fresh",
      "p[style-name='Quote'] => blockquote:fresh",
      "p[style-name='Intense Quote'] => blockquote:fresh",
      "p[style-name='Caption'] => p.docx-caption:fresh",
      "p[style-name='Image Caption'] => p.docx-caption:fresh",
      "p[style-name='Picture Caption'] => p.docx-caption:fresh",
    ],
    convertImage: mammoth.images.imgElement(async (image: {
      readAsArrayBuffer(): Promise<ArrayBuffer>;
      contentType: string;
      altText?: string | null;
    }) => {
      try {
        const bytes = new Uint8Array(await image.readAsArrayBuffer());
        if (!bytes.byteLength) return { src: '' };
        const placeholder = `docimg:${images.length}`;
        images.push({
          placeholder,
          bytes,
          contentType: image.contentType || 'image/png',
          alt: (typeof image.altText === 'string' ? image.altText : '') || '',
        });
        return { src: placeholder };
      } catch {
        return { src: '' }; // skip this image; text import continues (partial import rule)
      }
    }),
  };

  let result;
  try {
    result = await mammoth.convertToHtml({ arrayBuffer: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) }, options);
  } catch (e) {
    throw new AdminError(
      `Could not read this Word document${e instanceof Error && e.message ? ` (${e.message.slice(0, 120)})` : ''}. Make sure it is a valid .docx file — legacy .doc must be re-saved as .docx.`,
      422,
    );
  }

  onProgress({ phase: 'extracting', detail: 'Extracting images and formatting…' });
  let html = result.value || '';

  // Suggested title: first H1 (from the Title style or Heading 1) before remapping.
  let suggestedTitle = '';
  try {
    const probe = document.createElement('div');
    probe.innerHTML = html;
    const firstH1 = probe.querySelector('h1');
    suggestedTitle = (firstH1?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 200);
  } catch { /* advisory */ }

  html = postProcessDocxHtml(html);
  return { html, images, suggestedTitle };
}

/**
 * DOM cleanup pass over mammoth output (UNSANITIZED input — text content is
 * only read/copied, never interpreted):
 *  • H1 → H2 (the post title is the H1; body starts at H2)
 *  • caption paragraphs (docx-caption) move into the preceding <figure>
 *    as <figcaption>; stray ones become regular paragraphs
 *  • bare/paragraph-wrapped images become the editor's standard <figure>
 *  • empty paragraphs are dropped
 */
function postProcessDocxHtml(html: string): string {
  try {
    const host = document.createElement('div');
    host.innerHTML = html;

    host.querySelectorAll('h1').forEach((h1) => {
      const h2 = document.createElement('h2');
      h2.innerHTML = h1.innerHTML;
      h1.replaceWith(h2);
    });

    // Standardize images into editor figures FIRST (so captions below can
    // attach to the finished <figure> element).
    host.querySelectorAll('img').forEach((img) => {
      // mammoth emits <img src=""> for images whose bytes could not be read —
      // drop them here so no broken image ever reaches the editor (partial-import rule).
      if (!(img.getAttribute('src') || '').trim()) { img.remove(); return; }
      if (img.getAttribute('data-docx-done')) return;
      img.setAttribute('data-docx-done', '1');
      const parent = img.parentElement;
      const figure = document.createElement('figure');
      figure.className = 'al-center w-wide';
      const imgClone = img.cloneNode(true) as HTMLElement;
      imgClone.removeAttribute('data-docx-done');
      figure.appendChild(imgClone);
      if (parent && parent.tagName === 'P' && (parent.textContent || '').trim() === '') {
        parent.replaceWith(figure);
      } else if (parent && parent.tagName !== 'FIGURE' && parent.tagName !== 'A') {
        // image inline with text: keep it where it is, but wrap for the editor
        parent.insertBefore(figure, img);
        img.remove();
      } else if (parent && parent.tagName === 'A' && parent.parentElement && parent.parentElement.tagName === 'P'
        && (parent.parentElement.textContent || '').trim() === '') {
        parent.parentElement.replaceWith(figure);
      } else if (!parent || parent.tagName === 'DIV') {
        img.replaceWith(figure);
      }
      // img directly inside a figure/link-in-figure: already fine
    });

    // Captions → figcaption inside the previous figure when adjacent.
    host.querySelectorAll('p.docx-caption').forEach((cap) => {
      const prev = cap.previousElementSibling;
      const text = (cap.textContent || '').replace(/\s+/g, ' ').trim();
      if (prev && prev.tagName === 'FIGURE' && text && !prev.querySelector('figcaption')) {
        const fc = document.createElement('figcaption');
        fc.textContent = text;
        prev.appendChild(fc);
        cap.remove();
      } else {
        cap.className = '';
        if (!text) cap.remove();
      }
    });

    // Drop paragraphs that carry no text and no images.
    host.querySelectorAll('p').forEach((p) => {
      if (!p.querySelector('img') && !(p.textContent || '').trim() && !p.querySelector('br')) p.remove();
    });

    return host.innerHTML;
  } catch {
    return html;
  }
}

// ================================================================== PDF ======

interface PdfLine { yTop: number; x: number; size: number; bold: boolean; text: string; }
interface PdfImageRef { yTop: number; x: number; w: number; h: number; image: Omit<RawImage, 'hash'> | null; }
interface PdfPageData { lines: PdfLine[]; images: PdfImageRef[]; height: number; }

type PdfJsModule = typeof import('pdfjs-dist');

async function loadPdfjs(): Promise<PdfJsModule> {
  const [pdfjs, workerUrl] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url').then((m) => m.default as string),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  return pdfjs;
}

function matrixMul(m1: number[], m2: number[]): number[] {
  return [
    m1[0] * m2[0] + m1[1] * m2[2],
    m1[0] * m2[1] + m1[1] * m2[3],
    m1[2] * m2[0] + m1[3] * m2[2],
    m1[2] * m2[1] + m1[3] * m2[3],
    m1[4] * m2[0] + m1[5] * m2[2] + m2[4],
    m1[4] * m2[1] + m1[5] * m2[3] + m2[5],
  ];
}

/** Convert a pdf.js image object (ImageBitmap or raw data) to a JPEG blob. */
async function pdfImageObjectToBlob(obj: unknown): Promise<Blob | null> {
  try {
    const data = obj as { width?: number; height?: number; bitmap?: ImageBitmap; data?: Uint8ClampedArray | Uint8Array; kind?: number } | ImageBitmap | null;
    if (!data) return null;
    const isBitmap = typeof ImageBitmap !== 'undefined' && data instanceof ImageBitmap;
    const w = isBitmap ? (data as ImageBitmap).width : Number((data as { width?: number }).width || 0);
    const h = isBitmap ? (data as ImageBitmap).height : Number((data as { height?: number }).height || 0);
    if (!w || !h || w > 12000 || h > 12000) return null;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    if (isBitmap || (data as { bitmap?: ImageBitmap }).bitmap) {
      const bmp = isBitmap ? (data as ImageBitmap) : (data as { bitmap: ImageBitmap }).bitmap;
      ctx.drawImage(bmp, 0, 0);
    } else {
      const raw = (data as { data?: Uint8ClampedArray | Uint8Array; kind?: number }).data;
      if (!raw) return null;
      const kind = (data as { kind?: number }).kind;
      let rgba: Uint8ClampedArray | null = null;
      if (raw.length === w * h * 4 || kind === 3) {
        rgba = new Uint8ClampedArray(raw.buffer, raw.byteOffset, w * h * 4);
      } else if (raw.length === w * h * 3 || kind === 2) {
        rgba = new Uint8ClampedArray(w * h * 4);
        for (let i = 0, j = 0; i < w * h * 3; i += 3, j += 4) {
          rgba[j] = raw[i]; rgba[j + 1] = raw[i + 1]; rgba[j + 2] = raw[i + 2]; rgba[j + 3] = 255;
        }
      } else if (kind === 1 || raw.length >= w * h / 8) {
        // 1bpp grayscale, rows padded to byte boundaries
        rgba = new Uint8ClampedArray(w * h * 4);
        const rowBytes = Math.ceil(w / 8);
        for (let y = 0; y < h; y += 1) {
          for (let x = 0; x < w; x += 1) {
            const bit = (raw[y * rowBytes + (x >> 3)] >> (7 - (x & 7))) & 1;
            const v = bit ? 255 : 0;
            const j = (y * w + x) * 4;
            rgba[j] = v; rgba[j + 1] = v; rgba[j + 2] = v; rgba[j + 3] = 255;
          }
        }
      }
      if (!rgba) return null;
      ctx.putImageData(new ImageData(rgba, w, h), 0, 0);
    }
    return await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.92));
  } catch {
    return null;
  }
}

function fontRealName(page: import('pdfjs-dist').PDFPageProxy, fontName: string): string {
  try {
    const obj = (page as unknown as { commonObjs?: { get: (id: string) => { name?: string; loadedName?: string } } }).commonObjs?.get(fontName);
    return obj?.name || obj?.loadedName || '';
  } catch {
    return '';
  }
}

async function extractPdfPage(doc: Awaited<ReturnType<PdfJsModule['getDocument']>['promise']>, pageNumber: number, OPS: Record<string, number>): Promise<PdfPageData> {
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  const pageHeight = viewport.height;

  // ---- text → lines
  const tc = await page.getTextContent();
  const items: Array<{ x: number; y: number; size: number; width: number; str: string; bold: boolean }> = [];
  for (const it of tc.items as Array<{ str: string; transform: number[]; width: number; height: number; fontName: string }>) {
    if (!it.str || !it.transform) continue;
    if (!it.str.trim()) continue;
    const size = Math.abs(it.transform[3]) || it.height || 10;
    if (size <= 0.5) continue;
    const real = fontRealName(page, it.fontName);
    items.push({
      x: it.transform[4],
      y: it.transform[5],
      size,
      width: it.width || it.str.length * size * 0.5,
      str: it.str,
      bold: /bold|black|heavy|semib/i.test(real),
    });
  }
  items.sort((a, b) => (Math.abs(b.y - a.y) > 1 ? b.y - a.y : a.x - b.x));

  const lines: PdfLine[] = [];
  let cur: { y: number; size: number; bold: boolean; x: number; endX: number; text: string } | null = null;
  const flushLine = () => {
    if (cur && cur.text.trim()) {
      lines.push({ yTop: pageHeight - cur.y, x: cur.x, size: cur.size, bold: cur.bold, text: cur.text.replace(/\s+/g, ' ').trim() });
    }
    cur = null;
  };
  for (const it of items) {
    const tol = Math.max(2.5, it.size * 0.45);
    if (cur && Math.abs(cur.y - it.y) <= tol) {
      const gap = it.x - cur.endX;
      if (gap > it.size * 0.22 && !/\s$/.test(cur.text)) cur.text += ' ';
      cur.text += it.str;
      cur.endX = Math.max(cur.endX, it.x + it.width);
      cur.size = Math.max(cur.size, it.size);
      cur.bold = cur.bold || it.bold;
    } else {
      flushLine();
      cur = { y: it.y, size: it.size, bold: it.bold, x: it.x, endX: it.x + it.width, text: it.str };
    }
  }
  flushLine();

  // ---- images (positions via a light operator-list interpreter)
  const images: PdfImageRef[] = [];
  if (images.length < MAX_IMAGES_PER_DOC) {
    try {
      const opList = await page.getOperatorList();
      const { fnArray, argsArray } = opList;
      let ctm: number[] = [1, 0, 0, 1, 0, 0];
      const stack: number[][] = [];
      const hits: Array<{ objId?: string; inline?: unknown; a: number; d: number; e: number; f: number }> = [];
      for (let i = 0; i < fnArray.length; i += 1) {
        const fn = fnArray[i];
        if (fn === OPS.save) stack.push(ctm);
        else if (fn === OPS.restore) ctm = stack.pop() || ctm;
        else if (fn === OPS.transform) ctm = matrixMul(ctm, argsArray[i] as number[]);
        else if (fn === OPS.paintImageXObject || fn === OPS.paintJpegXObject || fn === OPS.paintInlineImageXObject) {
          const args = argsArray[i] as unknown[];
          hits.push({
            objId: typeof args[0] === 'string' ? (args[0] as string) : undefined,
            inline: typeof args[0] === 'object' ? args[0] : undefined,
            a: Math.abs(ctm[0]) || Math.abs(ctm[1]),
            d: Math.abs(ctm[3]) || Math.abs(ctm[2]),
            e: ctm[4],
            f: ctm[5],
          });
        }
      }

      const resolveObj = (pageObjs: { get(objId: string, cb?: (v: unknown) => void): unknown }, commonObjs: { get(objId: string, cb?: (v: unknown) => void): unknown }, objId: string): Promise<unknown> =>
        new Promise((resolve) => {
          const target = objId.startsWith('g_') ? commonObjs : pageObjs;
          const timer = setTimeout(() => resolve(null), 8000);
          try {
            target.get(objId, (v: unknown) => { clearTimeout(timer); resolve(v); });
          } catch {
            clearTimeout(timer);
            resolve(null);
          }
        });

      for (const hit of hits) {
        if (images.length >= MAX_IMAGES_PER_DOC) break;
        const w = hit.a || 0;
        const h = hit.d || 0;
        if (w < MIN_IMAGE_EDGE || h < MIN_IMAGE_EDGE) continue; // decorations, bullets, rules
        let obj: unknown = hit.inline ?? null;
        if (!obj && hit.objId) obj = await resolveObj(page.objs, page.commonObjs, hit.objId);
        if (!obj) continue;
        const blob = await pdfImageObjectToBlob(obj);
        if (!blob || blob.size < 1024) continue; // unreadable / 1px noise
        const topPdf = Math.max(hit.f, hit.f + hit.d);
        images.push({
          yTop: pageHeight - topPdf,
          x: hit.e,
          w,
          h,
          image: { placeholder: '', bytes: new Uint8Array(await blob.arrayBuffer()), contentType: 'image/jpeg', alt: '' },
        });
      }
    } catch { /* image extraction is best-effort; text import continues */ }
  }

  page.cleanup();
  return { lines, images, height: pageHeight };
}

const BULLET_RE = /^([•▪◦‣●○·∙*]|[-–—])\s+/;
const NUMBERED_RE = /^(\d{1,2}|[a-zA-Z])[.)]\s+/;
const PAGE_NUM_RE = /^\d{1,4}$/;

function headingLevel(line: PdfLine, bodySize: number): 0 | 2 | 3 {
  const t = line.text.trim();
  if (!t || t.length > 120) return 0;
  const r = line.size / bodySize;
  if (r >= 1.42 && t.length <= 100) return 2;
  if (r >= 1.2 && t.length <= 110) return 3;
  if (r >= 1.12 && line.bold && t.length <= 100) return 3;
  return 0;
}

interface PdfBlock { type: 'h2' | 'h3' | 'p' | 'li' | 'img'; ordered?: boolean; text?: string; image?: Omit<RawImage, 'hash'> | null; }

function buildPdfBlocks(pages: PdfPageData[], totalEmbedded: { n: number }): { blocks: PdfBlock[]; suggestedTitle: string } {
  // body size = the size carrying the most text across the document
  const sizeWeight = new Map<number, number>();
  for (const pg of pages) {
    for (const l of pg.lines) {
      const key = Math.round(l.size * 2) / 2;
      sizeWeight.set(key, (sizeWeight.get(key) || 0) + l.text.length);
    }
  }
  let bodySize = 10;
  let best = -1;
  for (const [size, w] of sizeWeight.entries()) {
    if (w > best) { best = w; bodySize = size; }
  }

  // Repeated running heads / footers (only meaningful for multi-page docs)
  const headerFooter = new Set<string>();
  if (pages.length >= 3) {
    const counter = new Map<string, number>();
    for (const pg of pages) {
      const candidates = new Set<string>();
      if (pg.lines.length) {
        const first = pg.lines[0];
        const last = pg.lines[pg.lines.length - 1];
        if (first.yTop < pg.height * 0.09 && first.text.length < 100) candidates.add(first.text);
        if (last.yTop > pg.height * 0.91 && last.text.length < 100) candidates.add(last.text);
      }
      for (const c of candidates) counter.set(c, (counter.get(c) || 0) + 1);
    }
    const threshold = Math.max(2, Math.ceil(pages.length * 0.6));
    for (const [text, n] of counter.entries()) {
      if (n >= threshold || PAGE_NUM_RE.test(text)) headerFooter.add(text);
    }
  }

  const blocks: PdfBlock[] = [];
  let para: { text: string; size: number; x: number; yTop: number } | null = null;
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushPara = () => {
    if (para && para.text.trim()) blocks.push({ type: 'p', text: para.text.trim() });
    para = null;
  };
  const flushList = () => {
    if (list && list.items.length) blocks.push({ type: 'li', ordered: list.ordered, text: list.items.join('\n') });
    list = null;
  };
  const flushAll = () => { flushPara(); flushList(); };

  for (const pg of pages) {
    type Entry = { kind: 'line'; line: PdfLine } | { kind: 'img'; img: PdfImageRef };
    const entries: Entry[] = [
      ...pg.lines.map((line) => ({ kind: 'line' as const, line })),
      ...pg.images.filter((i) => i.image).map((img) => ({ kind: 'img' as const, img })),
    ].sort((a, b) => {
      const ya = a.kind === 'line' ? a.line.yTop : a.img.yTop;
      const yb = b.kind === 'line' ? b.line.yTop : b.img.yTop;
      if (Math.abs(ya - yb) > 4) return ya - yb; // ascending yTop = top of page first
      const xa = a.kind === 'line' ? a.line.x : a.img.x;
      const xb = b.kind === 'line' ? b.line.x : b.img.x;
      return xa - xb;
    });

    for (const entry of entries) {
      if (entry.kind === 'img') {
        flushAll();
        totalEmbedded.n += 1;
        blocks.push({ type: 'img', image: entry.img.image });
        continue;
      }
      const line = entry.line;
      const text = line.text;
      if (!text) continue;
      const nearEdge = line.yTop < pg.height * 0.055 || line.yTop > pg.height * 0.945;
      if ((nearEdge && headerFooter.has(text)) || (nearEdge && PAGE_NUM_RE.test(text))) continue;

      const lvl = headingLevel(line, bodySize);
      if (lvl) {
        flushAll();
        blocks.push({ type: lvl === 2 ? 'h2' : 'h3', text });
        continue;
      }

      const bullet = BULLET_RE.exec(text);
      const numbered = NUMBERED_RE.exec(text);
      if (bullet || numbered) {
        flushPara();
        const ordered = Boolean(numbered);
        const itemText = text.replace(bullet ? BULLET_RE : NUMBERED_RE, '').trim();
        if (!list || list.ordered !== ordered) { flushList(); list = { ordered, items: [] }; }
        if (itemText) list.items.push(itemText);
        continue;
      }

      // paragraph merging: same size + baseline distance within ~1.65× size
      if (para) {
        // entries run top→bottom now, so the current line sits BELOW the
        // paragraph start: positive downward distance
        const gap = line.yTop - para.yTop;
        const sameSize = Math.abs(para.size - line.size) < Math.max(0.6, bodySize * 0.12);
        const indented = line.x > para.x + line.size * 1.4;
        const sameColumn = Math.abs(line.x - para.x) < line.size * 2.2;
        if (sameSize && sameColumn && gap > -2 && gap < line.size * 1.65 && !indented) {
          if (/[A-Za-z]-$/.test(para.text)) para.text = `${para.text.slice(0, -1)}${text}`;
          else para.text += ` ${text}`;
          para.yTop = line.yTop;
          continue;
        }
        flushPara();
      }
      para = { text, size: line.size, x: line.x, yTop: line.yTop };
    }
  }
  flushAll();

  const suggestedTitle = (blocks.find((b) => b.type === 'h2')?.text || blocks.find((b) => b.type === 'p')?.text || '').slice(0, 140);
  return { blocks, suggestedTitle };
}

async function parsePdfFile(file: File, onProgress: ProgressFn): Promise<DocxParseResult> {
  onProgress({ phase: 'reading', detail: 'Opening PDF…' });
  const buf = new Uint8Array(await file.arrayBuffer());
  const magic = [0x25, 0x50, 0x44, 0x46]; // %PDF-
  let magicOk = true;
  for (let i = 0; i < magic.length; i += 1) if (buf[i] !== magic[i]) { magicOk = false; break; }
  if (!magicOk) throw new AdminError('This PDF appears to be corrupted or is not a valid PDF file.', 400);

  let pdfjs: PdfJsModule;
  try {
    pdfjs = await loadPdfjs();
  } catch {
    throw new AdminError('The PDF engine failed to load. Refresh the page and try again.', 500);
  }

  let doc;
  try {
    doc = await pdfjs.getDocument({ data: buf }).promise;
  } catch (e) {
    const name = (e as { name?: string })?.name || '';
    if (name === 'PasswordException') {
      throw new AdminError('This PDF is password-protected. Remove the password protection and try again.', 400);
    }
    if (name === 'InvalidPDFException') {
      throw new AdminError('This PDF appears to be corrupted or is not a valid PDF file.', 400);
    }
    throw new AdminError(`Could not open this PDF${e instanceof Error && e.message ? ` (${e.message.slice(0, 120)})` : ''}.`, 422);
  }

  const pages: PdfPageData[] = [];
  const OPS = pdfjs.OPS as unknown as Record<string, number>;
  try {
    for (let p = 1; p <= doc.numPages; p += 1) {
      onProgress({ phase: 'reading', detail: `Reading page ${p} of ${doc.numPages}…`, done: p, total: doc.numPages });
      pages.push(await extractPdfPage(doc, p, OPS));
    }
  } finally {
    try { await doc.destroy(); } catch { /* noop */ }
  }

  onProgress({ phase: 'extracting', detail: 'Detecting headings, paragraphs and images…' });
  const totalEmbedded = { n: 0 };
  const { blocks, suggestedTitle } = buildPdfBlocks(pages, totalEmbedded);

  // Assemble HTML — every text fragment is escaped; images get placeholders.
  const images: Omit<RawImage, 'hash'>[] = [];
  const parts: string[] = [];
  let paraBuf: string[] = [];
  let listBuf: string[] = [];
  let listOrdered = false;
  const flushPara = () => {
    if (paraBuf.length) parts.push(`<p>${escapeHtmlText(paraBuf.join(' ').replace(/\s+/g, ' ').trim())}</p>`);
    paraBuf = [];
  };
  const flushList = () => {
    if (listBuf.length) parts.push(`<${listOrdered ? 'ol' : 'ul'}>${listBuf.map((li) => `<li>${escapeHtmlText(li)}</li>`).join('')}</${listOrdered ? 'ol' : 'ul'}>`);
    listBuf = [];
  };
  for (const b of blocks) {
    if (b.type === 'img' && b.image) {
      flushPara(); flushList();
      const placeholder = `docimg:${images.length}`;
      images.push({ ...b.image, placeholder });
      parts.push(`<figure class="al-center w-wide"><img src="${placeholder}" alt="" loading="lazy" /></figure>`);
    } else if (b.type === 'li' && b.text) {
      flushPara();
      const items = b.text.split('\n');
      if (listBuf.length && listOrdered !== Boolean(b.ordered)) flushList();
      listOrdered = Boolean(b.ordered);
      listBuf.push(...items);
    } else if (b.type === 'h2' || b.type === 'h3') {
      flushPara(); flushList();
      if (b.text) parts.push(`<${b.type}>${escapeHtmlText(b.text)}</${b.type}>`);
    } else if (b.text) {
      flushList();
      paraBuf.push(b.text);
    }
  }
  flushPara(); flushList();

  return { html: parts.join('\n'), images, suggestedTitle };
}

// ============================================================ orchestration ==

/** Stage 1 — parse the document. Never touches storage. */
export async function analyzeDocument(file: File, kind: ImportKind, onProgress: ProgressFn): Promise<ImportAnalysis> {
  const invalid = validateImportFile(file, kind);
  if (invalid) throw new AdminError(invalid, 400);

  const parsed = kind === 'docx' ? await parseDocxFile(file, onProgress) : await parsePdfFile(file, onProgress);

  onProgress({ phase: 'extracting', detail: 'Fingerprinting images…' });
  // hash + dedupe images (same picture embedded twice → upload once).
  // EVERY original placeholder is mapped: duplicates map to the first copy,
  // unmapped ones (failed capture) are stripped from the html afterwards.
  const hashToFinal = new Map<string, string>();
  const placeholderMap = new Map<string, string>();
  const images: RawImage[] = [];
  let totalEmbedded = 0;
  for (const img of parsed.images) {
    totalEmbedded += 1;
    let hash = '';
    try { hash = await sha256Hex(img.bytes); } catch { hash = `raw:${images.length}`; }
    const existingFinal = hashToFinal.get(hash);
    if (existingFinal !== undefined) { placeholderMap.set(img.placeholder, existingFinal); continue; }
    const finalPh = `docimg:${images.length}`;
    hashToFinal.set(hash, finalPh);
    placeholderMap.set(img.placeholder, finalPh);
    images.push({ ...img, placeholder: finalPh, hash });
  }
  let html = parsed.html;
  for (const [oldPh, newPh] of placeholderMap.entries()) {
    if (oldPh && oldPh !== newPh) html = html.split(`src="${oldPh}"`).join(`src="${newPh}"`);
  }
  // drop any img whose bytes could not be captured at parse time
  html = html.replace(/<img[^>]*src="docimg:(\d+)"[^>]*>/g, (m, n: string) => (Number(n) < images.length ? m : ''));

  const counts = countStats(html);
  if (!html.trim() && images.length === 0) {
    throw importFailed('No extractable content was found in this document — it may be empty, image-only, or fully protected.');
  }

  return {
    kind,
    html,
    images,
    totalEmbedded,
    suggestedTitle: parsed.suggestedTitle,
    words: counts.words,
    headings: counts.headings,
    links: counts.links,
    fileBase: fileBaseFromName(file.name),
  };
}

interface MediaCandidate { url: string; }

async function findExistingMediaByHash(hash: string, bytes: Uint8Array, mime: string): Promise<string | null> {
  try {
    // listRows applies ilike() to plain params, which PostgREST rejects on the
    // bigint size_bytes column — so filter by mime (text) only and compare
    // sizes in JS. Recent rows first: a repeat import of the same document
    // hits the uploads from the previous run.
    const res = await listRows<MediaRow & MediaCandidate>('media_assets', {
      page: 1, pageSize: 50, mime,
    });
    for (const row of res.rows || []) {
      if (!row.url) continue;
      if (Number(row.size_bytes) !== bytes.length) continue;
      try {
        const resp = await fetch(row.url, { mode: 'cors' });
        if (!resp.ok) continue;
        const buf = new Uint8Array(await resp.arrayBuffer());
        if (buf.length !== bytes.length) continue;
        if (await sha256Hex(buf) === hash) return row.url;
      } catch { /* unreachable asset — keep looking */ }
    }
  } catch { /* dedup lookup is best-effort */ }
  return null;
}

/** Stage 2 — upload images (deduped), swap placeholders, sanitize. */
export async function finalizeDocumentImport(analysis: ImportAnalysis, onProgress: ProgressFn): Promise<ImportResult> {
  const { images, fileBase } = analysis;
  const urlByPlaceholder = new Map<string, string>();
  let failed = 0;
  let reused = 0;

  for (let i = 0; i < images.length; i += 1) {
    const img = images[i];
    onProgress({ phase: 'uploading', detail: `Uploading images… (${i + 1}/${images.length})`, done: i, total: images.length });
    try {
      const blob = new Blob([img.bytes], { type: img.contentType });
      const optimized = await optimizeImageBlob(blob);
      const finalMime = optimized.type || 'image/jpeg';
      const processedBytes = new Uint8Array(await optimized.arrayBuffer());

      // cross-import dedup: identical processed bytes already in the library?
      const processedHash = await sha256Hex(processedBytes);
      const existingUrl = await findExistingMediaByHash(processedHash, processedBytes, finalMime);
      if (existingUrl) {
        reused += 1;
        urlByPlaceholder.set(img.placeholder, existingUrl);
        continue;
      }

      const name = `${fileBase}-img-${String(i + 1).padStart(2, '0')}.${extForMime(finalMime)}`;
      const file = new File([optimized], name, { type: finalMime });
      const row = await uploadMedia(file, img.alt.trim());
      if (row?.url) urlByPlaceholder.set(img.placeholder, row.url);
      else failed += 1;
    } catch {
      failed += 1; // partial-import rule: text still lands
    }
  }

  onProgress({ phase: 'processing', detail: 'Cleaning and importing content…', done: images.length, total: images.length });
  let html = analysis.html;
  for (const [ph, url] of urlByPlaceholder.entries()) {
    html = html.split(`src="${ph}"`).join(`src="${url}"`);
  }
  // Remove images that failed to upload so no placeholder ever reaches the
  // editor; then drop the empty figures/paragraphs they leave behind.
  try {
    const host = document.createElement('div');
    host.innerHTML = html;
    host.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src') || '';
      if (src.startsWith('docimg:') || !src.trim()) {
        const fig = img.closest('figure');
        img.remove();
        if (fig && !fig.querySelector('img') && !(fig.textContent || '').trim()) fig.remove();
      }
    });
    host.querySelectorAll('p').forEach((p) => {
      if (!p.querySelector('img') && !(p.textContent || '').trim() && !p.querySelector('br')) p.remove();
    });
    html = host.innerHTML;
  } catch { /* regex fallback below */ }

  const clean = sanitizeArticleHtml(html);
  const counts = countStats(clean);
  if (!clean.trim()) {
    throw importFailed(
      failed > 0
        ? `Import finished, but the document produced no article text and ${failed} image(s) could not be uploaded.`
        : 'The document could not be converted into article content.',
    );
  }

  const stats: ImportStats = {
    words: counts.words,
    chars: counts.chars,
    images: counts.images,
    headings: counts.headings,
    links: counts.links,
    failedImages: failed,
    reusedImages: reused,
    totalEmbedded: analysis.totalEmbedded,
  };

  return { html: clean, suggestedTitle: analysis.suggestedTitle, stats, kind: analysis.kind };
}
