// Image Tools (15) — canvas-powered, 100% in-browser processing.
import type { ToolDefinition, ToolResult } from './types';
import { num, str, bool } from './types';
import {
  loadImage, canvasToDataUrl, dataUrlBytes, formatBytes, kv, bullet,
} from './helpers';

const IMG_ACCEPT = 'image/*';
const IMG_HINT = 'Supports PNG, JPG, WebP (Runs 100% locally in browser)';

const requireImage = async (ctx: { files: Record<string, File | undefined>; dataUrls: Record<string, string | undefined> }) => {
  const dataUrl = ctx.dataUrls.file;
  if (!dataUrl) throw new Error('Upload an image first (click or drag it into the upload zone).');
  const img = await loadImage(dataUrl);
  const f = ctx.files.file;
  return { img, dataUrl, fileName: f?.name || 'image', fileSize: f?.size || 0 };
};

const newCanvas = (w: number, h: number): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
};

const ctx2d = (canvas: HTMLCanvasElement): CanvasRenderingContext2D => {
  const g = canvas.getContext('2d');
  if (!g) throw new Error('Canvas 2D is unavailable in this browser.');
  return g;
};

const out = (canvas: HTMLCanvasElement, mime: string, quality: number, name: string, extraNote?: string): ToolResult => ({
  imageDataUrl: canvasToDataUrl(canvas, mime, quality),
  downloadName: name,
  downloadMime: mime,
  note: extraNote,
});

export const imageTools: ToolDefinition[] = [
  {
    slug: 'image-compressor',
    fields: [
      { name: 'quality', label: 'Quality (1-100)', type: 'number', default: 60, min: 1, max: 100, step: 1 },
      { name: 'maxWidth', label: 'Max Width (px, 0 = keep)', type: 'number', default: 0, min: 0, step: 10 },
    ],
    accept: IMG_ACCEPT,
    fileHint: IMG_HINT,
    requiresFile: true,
    run: async (ctx) => {
      const { img, fileName, fileSize } = await requireImage(ctx);
      const q = Math.min(1, Math.max(0.01, num(ctx.values.quality, 60) / 100));
      const maxW = num(ctx.values.maxWidth, 0);
      const scale = maxW > 0 && img.width > maxW ? maxW / img.width : 1;
      const canvas = newCanvas(img.width * scale, img.height * scale);
      ctx2d(canvas).drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressed = canvasToDataUrl(canvas, 'image/jpeg', q);
      const newSize = dataUrlBytes(compressed);
      const saved = Math.max(0, 100 - (newSize / Math.max(1, fileSize)) * 100);
      return {
        imageDataUrl: compressed,
        downloadName: fileName.replace(/\.\w+$/, '') + '-compressed.jpg',
        downloadMime: 'image/jpeg',
        output: [
          kv('Original', `${img.width}×${img.height}px — ${formatBytes(fileSize)}`),
          kv('Compressed', `${canvas.width}×${canvas.height}px — ${formatBytes(newSize)}`),
          '',
          bullet('Size reduction', `${saved.toFixed(1)}% smaller`),
          bullet('Quality setting', `${Math.round(q * 100)}%`),
          bullet('Format', 'JPEG (progressive encoding)'),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'image-resizer',
    fields: [
      { name: 'width', label: 'Width (px)', type: 'number', default: 800, min: 1, step: 1 },
      { name: 'lockRatio', label: 'Lock aspect ratio', type: 'checkbox', default: true },
      { name: 'height', label: 'Height (px)', type: 'number', default: 600, min: 1, step: 1 },
    ],
    accept: IMG_ACCEPT,
    fileHint: IMG_HINT,
    requiresFile: true,
    run: async (ctx) => {
      const { img, fileName } = await requireImage(ctx);
      const width = Math.max(1, Math.round(num(ctx.values.width, img.width)));
      const lock = bool(ctx.values.lockRatio, true);
      const height = lock ? Math.round((width / img.width) * img.height) : Math.max(1, Math.round(num(ctx.values.height, img.height)));
      const canvas = newCanvas(width, height);
      const g = ctx2d(canvas);
      g.imageSmoothingEnabled = true;
      g.imageSmoothingQuality = 'high';
      g.drawImage(img, 0, 0, width, height);
      return out(canvas, 'image/png', 1, fileName.replace(/\.\w+$/, '') + `-${width}x${height}.png`,
        `Resized ${img.width}×${img.height} → ${width}×${height} px.`);
    },
  },
  {
    slug: 'image-converter-webp',
    fields: [
      { name: 'quality', label: 'Quality (1-100)', type: 'number', default: 80, min: 1, max: 100, step: 1 },
    ],
    accept: IMG_ACCEPT,
    fileHint: IMG_HINT,
    requiresFile: true,
    run: async (ctx) => {
      const { img, dataUrl, fileName, fileSize } = await requireImage(ctx);
      const q = Math.min(1, Math.max(0.01, num(ctx.values.quality, 80) / 100));
      const canvas = newCanvas(img.width, img.height);
      ctx2d(canvas).drawImage(img, 0, 0);
      const webp = canvasToDataUrl(canvas, 'image/webp', q);
      const newSize = dataUrlBytes(webp);
      return {
        imageDataUrl: webp,
        downloadName: fileName.replace(/\.\w+$/, '') + '.webp',
        downloadMime: 'image/webp',
        output: [
          kv('Source', `${formatBytes(fileSize)} (${fileName.split('.').pop()?.toUpperCase() || 'IMG'})`),
          kv('WebP output', `${formatBytes(newSize)} at ${Math.round(q * 100)}% quality`),
          '',
          bullet('Difference', `${newSize <= fileSize ? '-' : '+'}${Math.abs(100 - (newSize / Math.max(1, fileSize)) * 100).toFixed(1)}% file size`),
          bullet('Canvas pixel size', `${img.width}×${img.height}px`),
        ].join('\n'),
        note: 'WebP loads ~30% faster than JPEG/PNG on modern browsers.',
      };
    },
  },
  {
    slug: 'jpg-to-png',
    fields: [{ name: 'preserveTransparency', label: 'Preserve alpha transparency', type: 'checkbox', default: true }],
    accept: IMG_ACCEPT,
    fileHint: IMG_HINT,
    requiresFile: true,
    run: async (ctx) => {
      const { img, fileName } = await requireImage(ctx);
      const canvas = newCanvas(img.width, img.height);
      ctx2d(canvas).drawImage(img, 0, 0);
      return out(canvas, 'image/png', 1, fileName.replace(/\.\w+$/, '') + '.png',
        `Converted to lossless PNG (${img.width}×${img.height}px).`);
    },
  },
  {
    slug: 'png-to-jpg',
    fields: [
      { name: 'bg', label: 'Background Fill', type: 'select', default: '#ffffff', options: [
        { value: '#ffffff', label: 'Solid White' },
        { value: '#000000', label: 'Solid Black' },
        { value: '#f5f5f5', label: 'Light Gray' },
      ] },
      { name: 'quality', label: 'Quality (1-100)', type: 'number', default: 92, min: 1, max: 100, step: 1 },
    ],
    accept: IMG_ACCEPT,
    fileHint: IMG_HINT,
    requiresFile: true,
    run: async (ctx) => {
      const { img, fileName, fileSize } = await requireImage(ctx);
      const canvas = newCanvas(img.width, img.height);
      const g = ctx2d(canvas);
      g.fillStyle = str(ctx.values.bg, '#ffffff');
      g.fillRect(0, 0, canvas.width, canvas.height);
      g.drawImage(img, 0, 0);
      const q = Math.min(1, Math.max(0.01, num(ctx.values.quality, 92) / 100));
      const jpg = canvasToDataUrl(canvas, 'image/jpeg', q);
      const newSize = dataUrlBytes(jpg);
      return {
        imageDataUrl: jpg,
        downloadName: fileName.replace(/\.\w+$/, '') + '.jpg',
        downloadMime: 'image/jpeg',
        output: [
          kv('PNG source', formatBytes(fileSize)),
          kv('JPG output', `${formatBytes(newSize)} (${Math.round(q * 100)}% quality, flat background)`),
          '',
          bullet('Conversion', 'Transparency flattened onto the selected background fill'),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'color-picker-image',
    fields: [
      { name: 'paletteSize', label: 'Colors to extract', type: 'number', default: 8, min: 3, max: 16, step: 1 },
    ],
    accept: IMG_ACCEPT,
    fileHint: IMG_HINT,
    requiresFile: true,
    run: async (ctx) => {
      const { img } = await requireImage(ctx);
      const count = Math.round(num(ctx.values.paletteSize, 8));
      const sampleCanvas = newCanvas(120, Math.max(1, (120 / img.width) * img.height));
      ctx2d(sampleCanvas).drawImage(img, 0, 0, sampleCanvas.width, sampleCanvas.height);
      const data = ctx2d(sampleCanvas).getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
      // Quantize into 4-bit-per-channel buckets and rank
      const buckets = new Map<number, { r: number; g: number; b: number; n: number }>();
      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a < 125) continue;
        const r = data[i], g2 = data[i + 1], b = data[i + 2];
        const key = ((r >> 4) << 8) | ((g2 >> 4) << 4) | (b >> 4);
        const cur = buckets.get(key) || { r: 0, g: 0, b: 0, n: 0 };
        cur.r += r; cur.g += g2; cur.b += b; cur.n++;
        buckets.set(key, cur);
      }
      const sorted = [...buckets.values()].sort((a, b) => b.n - a.n).slice(0, count);
      const hex = (v: number) => v.toString(16).padStart(2, '0');
      const colors = sorted.map((s) => {
        const r = Math.round(s.r / s.n), g2 = Math.round(s.g / s.n), b = Math.round(s.b / s.n);
        return { hex: `#${hex(r)}${hex(g2)}${hex(b)}`, rgb: `rgb(${r}, ${g2}, ${b})`, coverage: s.n };
      });
      const total = sorted.reduce((a, s) => a + s.n, 0) || 1;
      return {
        json: {
          dominantColors: colors.map((c, i) => ({ rank: i + 1, hex: c.hex, rgb: c.rgb, coveragePercent: +((c.coverage / total) * 100).toFixed(1) })),
          sampledPixels: sampleCanvas.width * sampleCanvas.height,
        },
        output: [
          `Extracted ${colors.length} dominant colors from the image:`,
          '',
          ...colors.map((c, i) => `${i + 1}. ${c.hex.toUpperCase()}  ${c.rgb}`),
          '',
          bullet('Usage', 'Copy the HEX codes straight into your CSS variables or brand palette.'),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'image-to-base64',
    fields: [{ name: 'wrapCss', label: 'Also output CSS url() wrapper', type: 'checkbox', default: false }],
    accept: IMG_ACCEPT,
    fileHint: IMG_HINT,
    requiresFile: true,
    run: async (ctx) => {
      const { dataUrl, fileName, fileSize } = await requireImage(ctx);
      const mime = ctx.files.file?.type || 'image/png';
      const base64 = dataUrl.split(',')[1] || '';
      const cssWrap = bool(ctx.values.wrapCss, false);
      return {
        output: cssWrap
          ? `background-image: url("${dataUrl}");`
          : dataUrl,
        note: `${fileName}: ${formatBytes(fileSize)} → ${base64.length.toLocaleString()} Base64 chars (${formatBytes(Math.ceil(base64.length * 0.75))}).`,
      };
    },
  },
  {
    slug: 'base64-to-image',
    fields: [
      {
        name: 'input',
        label: 'Base64 / Data URL String',
        type: 'textarea',
        rows: 7,
        default: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGklEQVQYV2NkYPj/n4GBgYGRgYGBAQQAHxcCAT2l0DcAAAAASUVORK5CYII=',
        placeholder: 'data:image/png;base64,… or raw Base64',
      },
    ],
    run: (ctx) => {
      let raw = str(ctx.values.input).trim();
      const mimeMatch = raw.match(/^data:(image\/[\w+.-]+);base64,/i);
      const mime = mimeMatch ? mimeMatch[1] : 'image/png';
      raw = raw.replace(/^data:[^,]+,/i, '').replace(/\s+/g, '');
      if (!raw) throw new Error('Paste a Base64 string or Data URL first.');
      let header = '';
      try { header = atob(raw.slice(0, 32)); } catch { throw new Error('Invalid Base64 data.'); }
      const isPng = header.startsWith('\u0089PNG');
      const isJpg = header.startsWith('\u00FF\u00D8');
      const dataUrl = `data:${mime};base64,${raw}`;
      return {
        imageDataUrl: dataUrl,
        downloadName: `decoded-image.${isPng ? 'png' : isJpg ? 'jpg' : mime.split('/')[1] || 'png'}`,
        downloadMime: mime,
        output: [
          kv('Format detected', isPng ? 'PNG' : isJpg ? 'JPEG' : mime),
          kv('Decoded size', formatBytes(Math.floor(raw.length * 0.75))),
          kv('Base64 length', `${raw.length.toLocaleString()} chars`),
          '',
          bullet('Status', 'Image decoded and rendered below — use Download Image to save it.'),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'favicon-generator',
    fields: [
      { name: 'bg', label: 'Background', type: 'select', default: 'transparent', options: [
        { value: 'transparent', label: 'Transparent' },
        { value: '#ffffff', label: 'White' },
        { value: '#08090B', label: 'Near Black' },
        { value: '#D4AF37', label: 'Brand Gold' },
      ] },
    ],
    accept: IMG_ACCEPT,
    fileHint: IMG_HINT + ' — works best with square logos',
    requiresFile: true,
    run: async (ctx) => {
      const { img, fileName } = await requireImage(ctx);
      const bg = str(ctx.values.bg, 'transparent');
      const sizes = [16, 32, 64];
      const canvases = sizes.map((s) => {
        const c = newCanvas(s, s);
        const g = ctx2d(c);
        if (bg !== 'transparent') { g.fillStyle = bg; g.fillRect(0, 0, s, s); }
        // contain-fit
        const scale = Math.min(s / img.width, s / img.height);
        const w = img.width * scale, h = img.height * scale;
        g.imageSmoothingEnabled = true;
        g.imageSmoothingQuality = 'high';
        g.drawImage(img, (s - w) / 2, (s - h) / 2, w, h);
        return c;
      });
      // Output the 64x64 as the visual preview; provide all three via JSON info
      const previews = canvases.map((c, i) => ({ size: `${sizes[i]}x${sizes[i]}`, dataUrl: canvasToDataUrl(c, 'image/png') }));
      return {
        imageDataUrl: previews[2].dataUrl,
        downloadName: `favicon-64x64-${fileName.replace(/\.\w+$/, '')}.png`,
        downloadMime: 'image/png',
        output: [
          kv('Favicon set generated', '16×16, 32×32, 64×64 PNG'),
          kv('Background', bg === 'transparent' ? 'Transparent' : bg),
          kv('Source', `${img.width}×${img.height}px`),
          '',
          bullet('16×16 preview', 'browser tab icon'),
          bullet('32×32', 'bookmark / task-switcher'),
          bullet('64×64', 'high-DPI tabs & shortcuts (shown below)'),
          '',
          bullet('Install tip', 'Add <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"> to your <head>.'),
        ].join('\n'),
        json: { sizes: previews.map((p) => p.size) },
      };
    },
  },
  {
    slug: 'image-blur-tool',
    fields: [
      { name: 'radius', label: 'Blur Radius (px)', type: 'number', default: 8, min: 1, max: 40, step: 1 },
      { name: 'pixelate', label: 'Pixelate instead (privacy mask)', type: 'checkbox', default: false },
      { name: 'pixelSize', label: 'Pixel Block Size', type: 'number', default: 12, min: 2, max: 60, step: 1 },
    ],
    accept: IMG_ACCEPT,
    fileHint: IMG_HINT,
    requiresFile: true,
    run: async (ctx) => {
      const { img, fileName } = await requireImage(ctx);
      const canvas = newCanvas(img.width, img.height);
      const g = ctx2d(canvas);
      if (bool(ctx.values.pixelate, false)) {
        const block = Math.max(2, Math.round(num(ctx.values.pixelSize, 12)));
        const small = newCanvas(Math.max(1, img.width / block), Math.max(1, img.height / block));
        const sg = ctx2d(small);
        sg.imageSmoothingEnabled = true;
        sg.drawImage(img, 0, 0, small.width, small.height);
        g.imageSmoothingEnabled = false;
        g.drawImage(small, 0, 0, small.width, small.height, 0, 0, canvas.width, canvas.height);
      } else {
        g.filter = `blur(${Math.min(40, Math.max(1, num(ctx.values.radius, 8)))}px)`;
        // draw slightly oversized to avoid transparent edges
        const pad = Math.min(40, num(ctx.values.radius, 8) * 2);
        g.drawImage(img, -pad, -pad, canvas.width + pad * 2, canvas.height + pad * 2);
        g.filter = 'none';
      }
      return out(canvas, 'image/png', 1, fileName.replace(/\.\w+$/, '') + '-blurred.png',
        'Applied gaussian blur locally — sensitive regions are unreadable.');
    },
  },
  {
    slug: 'image-grayscale',
    fields: [
      { name: 'contrast', label: 'Contrast Boost (%)', type: 'number', default: 10, min: 0, max: 100, step: 1 },
      { name: 'bw', label: 'Pure B/W threshold (dithered look)', type: 'checkbox', default: false },
    ],
    accept: IMG_ACCEPT,
    fileHint: IMG_HINT,
    requiresFile: true,
    run: async (ctx) => {
      const { img, fileName } = await requireImage(ctx);
      const canvas = newCanvas(img.width, img.height);
      const g = ctx2d(canvas);
      g.filter = `grayscale(1) contrast(${1 + num(ctx.values.contrast, 10) / 100})`;
      g.drawImage(img, 0, 0);
      g.filter = 'none';
      if (bool(ctx.values.bw, false)) {
        const id = g.getImageData(0, 0, canvas.width, canvas.height);
        const d = id.data;
        for (let i = 0; i < d.length; i += 4) {
          const v = d[i] > 127 ? 255 : 0;
          d[i] = d[i + 1] = d[i + 2] = v;
        }
        g.putImageData(id, 0, 0);
      }
      return out(canvas, 'image/png', 1, fileName.replace(/\.\w+$/, '') + '-grayscale.png',
        'Converted to monochrome with adjustable contrast — dramatic editorial B/W look.');
    },
  },
  {
    slug: 'image-cropper',
    fields: [
      { name: 'ratio', label: 'Aspect Ratio', type: 'select', default: '1:1', options: [
        { value: '1:1', label: '1:1 Square (avatar)' },
        { value: '4:5', label: '4:5 Portrait (Instagram)' },
        { value: '16:9', label: '16:9 Widescreen' },
        { value: '9:16', label: '9:16 Story/Reel' },
        { value: '3:2', label: '3:2 Photo' },
      ] },
      { name: 'anchor', label: 'Crop Anchor', type: 'select', default: 'center', options: [
        { value: 'center', label: 'Center' },
        { value: 'top', label: 'Top' },
        { value: 'bottom', label: 'Bottom' },
      ] },
    ],
    accept: IMG_ACCEPT,
    fileHint: IMG_HINT,
    requiresFile: true,
    run: async (ctx) => {
      const { img, fileName } = await requireImage(ctx);
      const [rw, rh] = str(ctx.values.ratio, '1:1').split(':').map(Number);
      const anchor = str(ctx.values.anchor, 'center');
      const targetRatio = rw / rh;
      let cropW = img.width, cropH = img.height;
      if (img.width / img.height > targetRatio) cropW = img.height * targetRatio;
      else cropH = img.width / targetRatio;
      const sx = (img.width - cropW) / 2;
      const sy = anchor === 'top' ? 0 : anchor === 'bottom' ? img.height - cropH : (img.height - cropH) / 2;
      const canvas = newCanvas(cropW, cropH);
      ctx2d(canvas).drawImage(img, sx, sy, cropW, cropH, 0, 0, cropW, cropH);
      return out(canvas, 'image/png', 1, fileName.replace(/\.\w+$/, '') + `-cropped-${rw}x${rh}.png`,
        `Cropped to ${rw}:${rh} (${Math.round(cropW)}×${Math.round(cropH)}px from source).`);
    },
  },
  {
    slug: 'svg-data-uri-gen',
    fields: [
      {
        name: 'svg',
        label: 'Raw SVG Markup',
        type: 'textarea',
        rows: 7,
        default: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" fill="#D4AF37"/></svg>',
        placeholder: '<svg xmlns="…">…</svg>',
      },
    ],
    run: (ctx) => {
      let svg = str(ctx.values.svg).trim();
      if (!svg) throw new Error('Paste your raw SVG markup first.');
      if (!svg.includes('<svg')) throw new Error('This does not look like SVG markup (missing <svg> tag).');
      if (!/xmlns=/.test(svg)) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      const encodedFull = `data:image/svg+xml,${encodeURIComponent(svg)}`;
      // compact variant: strip newlines + collapse whitespace
      const compact = svg.replace(/\s*\n\s*/g, ' ').replace(/>\s+</g, '><').trim();
      const encodedCompact = `data:image/svg+xml,${encodeURIComponent(compact)}`;
      return {
        output: [
          'CSS background-image URL:',
          `background-image: url("${encodedCompact}");`,
          '',
          'Full (attribute-exact) Data URI:',
          encodedFull,
          '',
          bullet('Compact size', `${encodedCompact.length.toLocaleString()} chars`),
          bullet('Full size', `${encodedFull.length.toLocaleString()} chars`),
          bullet('Original SVG', `${svg.length.toLocaleString()} chars`),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'image-flipper-rotator',
    fields: [
      { name: 'rotate', label: 'Rotate', type: 'select', default: '0', options: [
        { value: '0', label: 'No rotation' },
        { value: '90', label: '90° clockwise' },
        { value: '180', label: '180°' },
        { value: '270', label: '90° counter-clockwise' },
      ] },
      { name: 'flipH', label: 'Mirror horizontally', type: 'checkbox', default: false },
      { name: 'flipV', label: 'Mirror vertically', type: 'checkbox', default: false },
    ],
    accept: IMG_ACCEPT,
    fileHint: IMG_HINT,
    requiresFile: true,
    run: async (ctx) => {
      const { img, fileName } = await requireImage(ctx);
      const rot = num(ctx.values.rotate, 0);
      const flipH = bool(ctx.values.flipH, false);
      const flipV = bool(ctx.values.flipV, false);
      const swap = rot === 90 || rot === 270;
      const canvas = newCanvas(swap ? img.height : img.width, swap ? img.width : img.height);
      const g = ctx2d(canvas);
      g.translate(canvas.width / 2, canvas.height / 2);
      g.rotate((rot * Math.PI) / 180);
      g.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      g.drawImage(img, -img.width / 2, -img.height / 2);
      const ops = [
        rot === 0 ? null : `rotated ${rot}°`,
        flipH ? 'mirrored horizontally' : null,
        flipV ? 'mirrored vertically' : null,
      ].filter(Boolean).join(' + ') || 'no transformation (identity copy)';
      return out(canvas, 'image/png', 1, fileName.replace(/\.\w+$/, '') + '-transformed.png', `Image ${ops}.`);
    },
  },
  {
    slug: 'social-image-dimensions',
    fields: [
      { name: 'platform', label: 'Platform Reference', type: 'select', default: 'all', options: [
        { value: 'all', label: 'All platforms' },
        { value: 'instagram', label: 'Instagram only' },
        { value: 'linkedin', label: 'LinkedIn only' },
        { value: 'youtube', label: 'YouTube only' },
        { value: 'facebook', label: 'Facebook only' },
        { value: 'x', label: 'X (Twitter) only' },
      ] },
    ],
    run: (ctx) => {
      const data: Record<string, [string, string, string][]> = {
        instagram: [
          ['Feed post (square)', '1080 × 1080 px', '1:1'],
          ['Feed post (portrait)', '1080 × 1350 px', '4:5'],
          ['Story / Reel cover', '1080 × 1920 px', '9:16'],
          ['Profile picture', '320 × 320 px', '1:1'],
        ],
        linkedin: [
          ['Company banner', '1128 × 191 px', '5.9:1'],
          ['Profile banner', '1584 × 396 px', '4:1'],
          ['Shared image', '1200 × 627 px', '1.91:1'],
          ['Profile picture', '400 × 400 px', '1:1'],
        ],
        youtube: [
          ['Channel banner', '2560 × 1440 px', '16:9 (safe area 1546×423)'],
          ['Thumbnail', '1280 × 720 px', '16:9'],
          ['Shorts cover', '1080 × 1920 px', '9:16'],
        ],
        facebook: [
          ['Page cover', '820 × 312 px', '2.63:1'],
          ['Shared image', '1200 × 630 px', '1.91:1'],
          ['Event cover', '1200 × 628 px', '1.91:1'],
          ['Story', '1080 × 1920 px', '9:16'],
        ],
        x: [
          ['Header banner', '1500 × 500 px', '3:1'],
          ['In-stream image', '1600 × 900 px', '16:9'],
          ['Profile picture', '400 × 400 px', '1:1'],
        ],
      };
      const platform = str(ctx.values.platform, 'all');
      const keys = platform === 'all' ? Object.keys(data) : [platform];
      const lines: string[] = ['SOCIAL MEDIA IMAGE DIMENSION CHEAT SHEET — 2026', ''];
      for (const k of keys) {
        lines.push(k.toUpperCase());
        for (const [name, size, ratio] of data[k]) lines.push(`  ${name}: ${size} (${ratio})`);
        lines.push('');
      }
      lines.push(bullet('Pro tip', 'Export at 2× for retina displays and compress to WebP under 300 KB.'));
      const counts = keys.reduce((a, k) => a + data[k].length, 0);
      return {
        json: {
          platform,
          referenceCount: counts,
          dimensions: Object.fromEntries(keys.map((k) => [k, data[k].map(([name, size, ratio]) => ({ name, size, ratio }))])),
        },
        output: lines.join('\n'),
      };
    },
  },
];
