// PDF Tools (12) — powered by pdf.js, 100% in-browser. No uploads ever leave the device.
import * as pdfjsLib from 'pdfjs-dist';
import type { ToolDefinition, ToolField, ToolResult } from './types';
import { num, str, bool } from './types';
import { kv, bullet, fmtNum, formatBytes } from './helpers';

// Worker is self-hosted from /public (proxy-safe, no bundler query params needed)
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const PDF_ACCEPT = '.pdf,application/pdf';

type PdfDoc = Awaited<ReturnType<typeof pdfjsLib.getDocument>['promise']>;

const loadPdf = async (ctx: { files: Record<string, File | undefined>; dataUrls: Record<string, string | undefined> }): Promise<PdfDoc> => {
  const dataUrl = ctx.dataUrls.file;
  if (!dataUrl) throw new Error('Upload a PDF file first (click or drag it into the upload zone).');
  const base64 = dataUrl.split(',')[1] || '';
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
  return doc as unknown as PdfDoc;
};

const extractPageText = async (doc: PdfDoc, maxPages = 50): Promise<string> => {
  const parts: string[] = [];
  const limit = Math.min(doc.numPages, maxPages);
  for (let p = 1; p <= limit; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    parts.push(content.items.map((it) => ('str' in it ? it.str : '')).join(' '));
  }
  return parts.join('\n\n').replace(/[ \t]+/g, ' ').trim();
};

const fileMeta = (ctx: { files: Record<string, File | undefined> }): { name: string; size: number } => {
  const f = ctx.files.file;
  return { name: f?.name || 'document.pdf', size: f?.size || 0 };
};

/* ---------------------------------- fields ---------------------------------- */

const pageFields: ToolField[] = [
  { name: 'startPage', label: 'Start Page', type: 'number', default: 1, min: 1, step: 1, hint: 'First page to process' },
  { name: 'endPage', label: 'End Page', type: 'number', default: 0, min: 0, step: 1, hint: '0 = last page' },
];

/* ---------------------------------- tools ----------------------------------- */

export const pdfTools: ToolDefinition[] = [
  {
    slug: 'pdf-to-text',
    fields: pageFields,
    accept: PDF_ACCEPT,
    fileHint: 'Supports PDF (Runs 100% locally in browser)',
    requiresFile: true,
    run: async (ctx): Promise<ToolResult> => {
      const doc = await loadPdf(ctx);
      const start = Math.max(1, num(ctx.values.startPage, 1));
      const end = Math.min(doc.numPages, num(ctx.values.endPage, 0) || doc.numPages);
      const parts: string[] = [];
      for (let p = start; p <= end; p++) {
        const page = await doc.getPage(p);
        const content = await page.getTextContent();
        const text = content.items.map((it) => ('str' in it ? it.str : '')).join(' ');
        parts.push(`--- Page ${p} ---\n${text.replace(/[ \t]+/g, ' ').trim()}`);
      }
      return {
        output: parts.join('\n\n'),
        note: `Extracted ${end - start + 1} of ${doc.numPages} pages locally — nothing was uploaded to any server.`,
      };
    },
  },
  {
    slug: 'pdf-word-counter',
    fields: pageFields,
    accept: PDF_ACCEPT,
    fileHint: 'Supports PDF (Runs 100% locally in browser)',
    requiresFile: true,
    run: async (ctx) => {
      const doc = await loadPdf(ctx);
      const text = await extractPageText(doc);
      const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
      const chars = text.replace(/\s/g, '').length;
      const sentences = (text.match(/[.!?]+(\s|$)/g) || []).length;
      const readingMinutes = words / 200;
      const speakingMinutes = words / 130;
      const fm = (m: number) => (m < 1 ? `${Math.ceil(m * 60)} sec` : `${Math.round(m)} min`);
      return {
        json: {
          file: fileMeta(ctx).name,
          pages: doc.numPages,
          words,
          characters: chars,
          charactersWithSpaces: text.length,
          sentences,
          estimatedReadingTime: fm(readingMinutes),
          estimatedSpeakingTime: fm(speakingMinutes),
        },
      };
    },
  },
  {
    slug: 'pdf-metadata-viewer',
    fields: [],
    accept: PDF_ACCEPT,
    fileHint: 'Supports PDF (Runs 100% locally in browser)',
    requiresFile: true,
    run: async (ctx) => {
      const doc = await loadPdf(ctx);
      const meta = await doc.getMetadata();
      const info = (meta.info || {}) as Record<string, unknown>;
      const f = fileMeta(ctx);
      return {
        json: {
          file: f.name,
          fileSize: formatBytes(f.size),
          pages: doc.numPages,
          title: info.Title || '—',
          author: info.Author || '—',
          subject: info.Subject || '—',
          keywords: info.Keywords || '—',
          creator: info.Creator || '—',
          producer: info.Producer || '—',
          creationDate: info.CreationDate instanceof Date ? info.CreationDate.toISOString() : String(info.CreationDate || '—'),
          modificationDate: info.ModDate instanceof Date ? info.ModDate.toISOString() : String(info.ModDate || '—'),
          pdfVersion: info.PDFFormatVersion || '—',
          encrypted: !!(meta as { encryption?: unknown }).encryption,
        },
      };
    },
  },
  {
    slug: 'pdf-page-counter',
    fields: [],
    accept: PDF_ACCEPT,
    fileHint: 'Supports PDF (Runs 100% locally in browser)',
    requiresFile: true,
    run: async (ctx) => {
      const doc = await loadPdf(ctx);
      const dims = await doc.getPage(1).then((p) => p.getViewport({ scale: 1 }));
      const pageSizes: string[] = [];
      for (let p = 1; p <= Math.min(doc.numPages, 10); p++) {
        const vp = await doc.getPage(p).then((pg) => pg.getViewport({ scale: 1 }));
        pageSizes.push(`p${p}: ${Math.round(vp.width)}×${Math.round(vp.height)}pt (${(vp.width / 72).toFixed(1)}″×${(vp.height / 72).toFixed(1)}″)`);
      }
      return {
        json: {
          file: fileMeta(ctx).name,
          totalPages: doc.numPages,
          aspectRatio: (dims.width / dims.height).toFixed(3),
          firstPageDimensions: `${Math.round(dims.width)}×${Math.round(dims.height)} pt`,
          isA4Portrait: Math.abs(dims.width - 595) < 3 && Math.abs(dims.height - 842) < 3,
          isLetterPortrait: Math.abs(dims.width - 612) < 3 && Math.abs(dims.height - 792) < 3,
          pageSizesSample: pageSizes,
        },
      };
    },
  },
  {
    slug: 'pdf-text-cleaner',
    fields: [
      { name: 'input', label: 'Messy PDF-copied Text', type: 'textarea', rows: 8, default: 'This is a sen-\ntence copied from a PDF  with   weird\n\n\n\nspacing and hy-\nphenation everywhere.\nIt also has soft line breaks\nmid sentence.', placeholder: 'Paste text copied from a PDF…' },
      { name: 'fixHyphens', label: 'Join hyphenated words', type: 'checkbox', default: true },
      { name: 'fixLineBreaks', label: 'Merge broken line breaks', type: 'checkbox', default: true },
      { name: 'collapseSpaces', label: 'Collapse repeated spaces', type: 'checkbox', default: true },
      { name: 'keepParagraphs', label: 'Keep paragraph breaks', type: 'checkbox', default: true },
    ],
    run: (ctx) => {
      let text = str(ctx.values.input);
      const original = text;
      if (bool(ctx.values.fixHyphens)) text = text.replace(/(\w)-\n(\w)/g, '$1$2');
      if (bool(ctx.values.fixLineBreaks)) text = bool(ctx.values.keepParagraphs)
        ? text.replace(/([^\n])\n(?!\n)([^\n])/g, '$1 $2')
        : text.replace(/\n+/g, ' ');
      if (bool(ctx.values.collapseSpaces)) text = text.replace(/[ \t]{2,}/g, ' ').replace(/ +([.,!?;:])/g, '$1');
      text = text.replace(/\n{3,}/g, '\n\n').trim();
      return {
        output: text,
        note: `Cleaned ${original.length} → ${text.length} characters (removed ${original.length - text.length}).`,
      };
    },
  },
  {
    slug: 'pdf-merge-planner',
    fields: [],
    accept: PDF_ACCEPT,
    fileHint: 'Supports PDF (Runs 100% locally in browser)',
    requiresFile: true,
    run: async (ctx) => {
      const doc = await loadPdf(ctx);
      const f = fileMeta(ctx);
      const first = await doc.getPage(1).then((p) => p.getViewport({ scale: 1 }));
      const est = (f.size / Math.max(1, doc.numPages)) * doc.numPages;
      return {
        json: {
          file: f.name,
          fileSize: formatBytes(f.size),
          pages: doc.numPages,
          mergeOrder: 1,
          uniformPageSize: `${Math.round(first.width)}×${Math.round(first.height)} pt`,
          estimatedCombinedSize: formatBytes(Math.round(est)),
          readyForMerge: doc.numPages > 0,
          checklist: [
            'Pages are inspected locally — use this data to order files in your PDF merger.',
            'Keep files under ~25 MB for most online/desktop mergers.',
            'Match page orientation across files for a clean combined document.',
          ],
        },
      };
    },
  },
  {
    slug: 'pdf-page-number-gen',
    fields: [
      { name: 'totalPages', label: 'Total Pages', type: 'number', default: 12, min: 1, step: 1 },
      { name: 'position', label: 'Position', type: 'select', default: 'bottom-center', options: [
        { value: 'bottom-center', label: 'Bottom Center' },
        { value: 'bottom-right', label: 'Bottom Right' },
        { value: 'bottom-left', label: 'Bottom Left' },
        { value: 'top-center', label: 'Top Center' },
        { value: 'top-right', label: 'Top Right' },
      ] },
      { name: 'format', label: 'Number Format', type: 'select', default: 'n', options: [
        { value: 'n', label: '1, 2, 3' },
        { value: 'page-n', label: 'Page 1, Page 2' },
        { value: 'n-of-total', label: '1 of 12' },
        { value: 'page-n-of-total', label: 'Page 1 of 12' },
        { value: 'roman', label: 'I, II, III (Roman)' },
      ] },
      { name: 'startAt', label: 'Start Numbering At', type: 'number', default: 1, min: 0, step: 1 },
      { name: 'skipFirst', label: 'Skip first page (cover)', type: 'checkbox', default: false },
    ],
    run: (ctx) => {
      const total = Math.max(1, Math.round(num(ctx.values.totalPages, 12)));
      const pos = str(ctx.values.position, 'bottom-center');
      const format = str(ctx.values.format, 'n');
      const startAt = Math.round(num(ctx.values.startAt, 1));
      const skipFirst = bool(ctx.values.skipFirst);
      const roman = (n: number): string => {
        const table: [number, string][] = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
        let out = '';
        let v = n;
        for (const [val, sym] of table) while (v >= val) { out += sym; v -= val; }
        return out || '0';
      };
      const labelFor = (n: number, t: number): string => {
        switch (format) {
          case 'page-n': return `Page ${n}`;
          case 'n-of-total': return `${n} of ${t}`;
          case 'page-n-of-total': return `Page ${n} of ${t}`;
          case 'roman': return roman(n);
          default: return String(n);
        }
      };
      const lines: string[] = [];
      for (let p = 1; p <= total; p++) {
        if (skipFirst && p === 1) { lines.push(`Page 1: (no number — cover)`); continue; }
        const n = startAt + p - 1;
        lines.push(`Page ${p}: ${labelFor(n, total - (skipFirst ? 1 : 0))}  →  ${pos.replace('-', ' ')}`);
      }
      return {
        output: `Page Numbering Plan — ${total} pages\nPosition: ${pos}\n\n${lines.join('\n')}`,
        note: 'Apply these rules in your PDF editor or print dialog; numbering is computed locally.',
      };
    },
  },
  {
    slug: 'pdf-size-estimator',
    fields: [
      { name: 'targetKB', label: 'Target Size (KB)', type: 'number', default: 500, min: 10, step: 10, hint: 'e.g. 500 KB for email attachments' },
      { name: 'quality', label: 'Assumed JPEG Quality', type: 'select', default: '0.6', options: [
        { value: '0.8', label: 'High (0.8)' },
        { value: '0.6', label: 'Balanced (0.6)' },
        { value: '0.4', label: 'Aggressive (0.4)' },
      ] },
    ],
    accept: PDF_ACCEPT,
    fileHint: 'Supports PDF (Runs 100% locally in browser)',
    requiresFile: true,
    run: async (ctx) => {
      const doc = await loadPdf(ctx);
      const f = fileMeta(ctx);
      const targetKB = num(ctx.values.targetKB, 500);
      const quality = parseFloat(str(ctx.values.quality, '0.6'));
      const bytesPerPage = f.size / Math.max(1, doc.numPages);
      const scannedAssumption = doc.numPages * 180 * 1024 * (quality / 0.6);
      const currentKB = f.size / 1024;
      const ratio = currentKB / targetKB;
      const estQuality = Math.max(0.2, Math.min(0.92, quality / Math.max(1, ratio * 0.85)));
      return {
        json: {
          file: f.name,
          currentSize: formatBytes(f.size),
          pages: doc.numPages,
          averageBytesPerPage: formatBytes(Math.round(bytesPerPage)),
          targetSizeKB: targetKB,
          estimatedReductionNeeded: `${fmtNum(Math.max(0, (1 - targetKB / Math.max(currentKB, 1)) * 100), 1)}%`,
          recommendedQualitySetting: fmtNum(estQuality, 2),
          estimatedScannedPdfSize: formatBytes(Math.round(scannedAssumption)),
          fitsTarget: currentKB <= targetKB,
          advice: currentKB <= targetKB
            ? 'File already fits the target size — no compression needed.'
            : `Re-save at ~${fmtNum(estQuality, 2)} JPEG quality or rasterize pages at 120 DPI to reach ~${targetKB} KB.`,
        },
      };
    },
  },
  {
    slug: 'pdf-unlock-checker',
    fields: [],
    accept: PDF_ACCEPT,
    fileHint: 'Supports PDF (Runs 100% locally in browser)',
    requiresFile: true,
    run: async (ctx) => {
      const f = fileMeta(ctx);
      let encrypted = false;
      let permissions: Record<string, unknown> = {};
      let pages = 0;
      let openedWithoutPassword = false;
      try {
        const dataUrl = ctx.dataUrls.file!;
        const bin = atob(dataUrl.split(',')[1] || '');
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
        pages = doc.numPages;
        const meta = await doc.getMetadata();
        encrypted = !!(meta as { encryption?: unknown }).encryption;
        // pdf.js exposes permission flags on the document when encrypted
        const perms = (doc as unknown as { _pdfInfo?: { encrypted?: boolean } })._pdfInfo;
        if (encrypted) {
          const p = (meta.info as { P?: number })?.P;
          if (typeof p === 'number') {
            permissions = {
              printing: !(p & 4) || (p & 4) !== 0 ? (p & 4) !== 0 : false,
              copying: (p & 16) !== 0,
              modifying: (p & 8) !== 0,
              annotating: (p & 32) !== 0,
            };
          }
        }
        openedWithoutPassword = true;
        void perms;
      } catch (err) {
        const msg = (err as Error).name || (err as Error).message || '';
        if (/password/i.test(msg)) {
          return {
            json: {
              file: f.name,
              encrypted: true,
              passwordProtected: true,
              openedWithoutPassword: false,
              verdict: 'PASSWORD PROTECTED — an open password is required before any processing.',
            },
          };
        }
        throw err;
      }
      return {
        json: {
          file: f.name,
          encrypted,
          passwordProtected: false,
          openedWithoutPassword,
          pages,
          permissions,
          verdict: encrypted
            ? 'OWNER-LEVEL ENCRYPTION — document opens freely but carries permission restrictions.'
            : 'NO ENCRYPTION — this PDF is fully accessible for editing, printing, and copying.',
        },
      };
    },
  },
  {
    slug: 'pdf-watermark-generator',
    fields: [
      { name: 'text', label: 'Watermark Text', type: 'text', default: 'CONFIDENTIAL — BRANIFY DRAFT' },
      { name: 'style', label: 'Style Preset', type: 'select', default: 'draft', options: [
        { value: 'draft', label: 'Draft (gray, 45° diagonal)' },
        { value: 'confidential', label: 'Confidential (red, bold)' },
        { value: 'sample', label: 'Sample (light diagonal)' },
        { value: 'custom', label: 'Custom' },
      ] },
      { name: 'opacity', label: 'Opacity (0-100)', type: 'number', default: 18, min: 5, max: 100, step: 1 },
      { name: 'fontSize', label: 'Font Size (pt)', type: 'number', default: 48, min: 8, max: 120, step: 1 },
      { name: 'pages', label: 'Apply To', type: 'select', default: 'all', options: [
        { value: 'all', label: 'All pages' },
        { value: 'odd', label: 'Odd pages only' },
        { value: 'even', label: 'Even pages only' },
      ] },
    ],
    run: (ctx) => {
      const text = str(ctx.values.text, 'CONFIDENTIAL');
      const style = str(ctx.values.style, 'draft');
      const opacity = num(ctx.values.opacity, 18) / 100;
      const fontSize = num(ctx.values.fontSize, 48);
      const pages = str(ctx.values.pages, 'all');
      const color = style === 'confidential' ? 'rgb(200,30,30)' : 'rgb(120,120,120)';
      const rule = `text: "${text}" | color: ${color} | opacity: ${opacity} | font: Helvetica ${fontSize}pt | rotation: 45° diagonal | layer: over content | pages: ${pages}`;
      return {
        output: [
          'Watermark Specification (generated locally)',
          '',
          kv('Text', text),
          kv('Style preset', style),
          kv('Color', color),
          kv('Opacity', `${(opacity * 100).toFixed(0)}%`),
          kv('Font size', `${fontSize} pt`),
          kv('Placement', 'Centered, rotated 45° across the page diagonal'),
          kv('Pages', pages === 'all' ? 'All pages' : pages === 'odd' ? 'Odd pages (1,3,5…)' : 'Even pages (2,4,6…)'),
          '',
          'Stamper rule string:',
          rule,
          '',
          'Usage: paste this rule into your PDF editor (Acrobat, Preview, pdftk) or use it as the spec for automated stamping scripts.',
        ].join('\n'),
        note: 'This generator produces the exact stamp specification — no document is uploaded.',
      };
    },
  },
  {
    slug: 'pdf-to-base64',
    fields: [],
    accept: PDF_ACCEPT,
    fileHint: 'Supports PDF (Runs 100% locally in browser)',
    requiresFile: true,
    run: async (ctx) => {
      const f = fileMeta(ctx);
      const dataUrl = ctx.dataUrls.file!;
      const base64 = dataUrl.split(',')[1] || '';
      const preview = base64.length > 48000 ? base64.slice(0, 48000) + `\n… [truncated preview — full ${base64.length} chars included in COPY / DOWNLOAD]` : base64;
      return {
        output: `data:application/pdf;base64,${base64}`,
        note: `Encoded ${formatBytes(f.size)} PDF → ${base64.length.toLocaleString()} Base64 characters. Use the Data URI or the raw string in code/APIs.`,
        downloadName: f.name.replace(/\.pdf$/i, '') + '-base64.txt',
        downloadMime: 'text/plain',
        json: { file: f.name, sizeBytes: f.size, base64Length: base64.length, preview: preview.substring(0, 120) + '…' },
      };
    },
  },
  {
    slug: 'base64-to-pdf',
    fields: [
      {
        name: 'input',
        label: 'Base64 / Data URI String',
        type: 'textarea',
        rows: 8,
        default: 'JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL01lZGlhQm94WzAgMCA1OTUgODQyXT4+CmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+Pgo=',
        placeholder: 'Paste Base64 or data:application/pdf;base64,…',
      },
    ],
    run: (ctx) => {
      let raw = str(ctx.values.input).trim();
      raw = raw.replace(/^data:application\/pdf;base64,/i, '').replace(/^data:;base64,/i, '').replace(/\s+/g, '');
      if (!raw) throw new Error('Paste a Base64 string or a data:application/pdf Data URI first.');
      // Minimal PDF sanity check: %PDF- header after decode
      let header = '';
      try {
        header = atob(raw.slice(0, 24));
      } catch {
        throw new Error('This does not look like valid Base64 data.');
      }
      if (!header.startsWith('%PDF-')) throw new Error('Decoded data is not a PDF (missing %PDF- signature). Check that you copied the full Base64 string.');
      return {
        output: `Valid PDF signature detected (%PDF-${header.substring(5, 10).trim()}).\nDecoded size: ${(raw.length * 0.75 / 1024).toFixed(1)} KB\nUse the Download PDF button to save the decoded document.`,
        downloadDataUrl: `data:application/pdf;base64,${raw}`,
        downloadName: 'decoded-document.pdf',
        downloadMime: 'application/pdf',
        json: { base64Length: raw.length, estimatedBytes: Math.floor(raw.length * 0.75), signature: header.substring(0, 10) },
      };
    },
  },
];
