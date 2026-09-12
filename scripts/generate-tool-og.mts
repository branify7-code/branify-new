// =============================================================================
// BRANIFY — generate per-tool OG images for the AI Tools directory
// -----------------------------------------------------------------------------
// Renders one 1200×630 branded PNG per AI tool (public/og/ai-tools/<slug>.png)
// from the REAL registry data (tool name + category only — no invented stats).
// Used as the og:image fallback on /ai-tools/<slug> detail pages.
//
// Usage:  npx tsx scripts/generate-tool-og.mts
// Deps:   @resvg/resvg-js (already used by render-logo.mjs)
// =============================================================================
import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { aiToolsDirectory } from '../src/data/aiToolsDirectory';

const OUT_DIR = path.join(process.cwd(), 'public', 'og', 'ai-tools');
fs.mkdirSync(OUT_DIR, { recursive: true });

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/** Greedy word wrap at ~30 chars/line, max 3 lines (tool names are short). */
function wrap(name: string, max = 30, maxLines = 3): string[] {
  const words = name.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if (!line.length) line = w;
    else if ((line + ' ' + w).length <= max) line += ' ' + w;
    else { lines.push(line); line = w; }
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  // truncate ellipsis if overflow
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '…');
  }
  return lines;
}

const nameLines = (name: string): string[] => wrap(name, name.length > 36 ? 24 : 30);
// First-line baseline shifts up when the headline wraps to 2–3 lines
// (keeps the block clear of the category pill at y≈160–194)
const nameTop = (n: number): number => 346 - (n - 1) * 48;

function ogSvg(name: string, category: string): string {
  const lines = nameLines(name.toUpperCase());
  return `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F3D27A"/>
      <stop offset="55%" stop-color="#D4AF37"/>
      <stop offset="100%" stop-color="#8F6B2D"/>
    </linearGradient>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B1220"/>
      <stop offset="60%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#111C33"/>
    </linearGradient>
    <radialGradient id="glow" cx="82%" cy="12%" r="70%">
      <stop offset="0%" stop-color="#D4AF37" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#D4AF37" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect x="0" y="0" width="1200" height="6" fill="url(#gold)"/>
  <rect x="0" y="624" width="1200" height="6" fill="url(#gold)" opacity="0.55"/>

  <!-- brand mark -->
  <g transform="translate(70,64)">
    <rect x="0" y="0" width="64" height="64" rx="16" fill="url(#gold)"/>
    <text x="32" y="45" font-family="DejaVu Sans" font-size="38" font-weight="bold"
      fill="#0F172A" text-anchor="middle">B</text>
    <text x="82" y="42" font-family="DejaVu Sans" font-size="26" font-weight="bold"
      fill="#F3E7C8" letter-spacing="6">BRANIFY</text>
  </g>

  <!-- eyebrow -->
  <g transform="translate(70,184)">
    <rect x="0" y="-26" width="${44 + esc(category).length * 14.5 + esc(' · AI TOOL GUIDE').length * 14.5}" height="36" rx="18" fill="none" stroke="#D4AF37" stroke-opacity="0.45"/>
    <text x="22" y="0" font-family="DejaVu Sans" font-size="17" font-weight="bold"
      fill="#E5C76B" letter-spacing="4">${esc(category.toUpperCase())} · AI TOOL GUIDE</text>
  </g>

  <!-- tool name -->
  ${lines
    .map(
      (l, i) =>
        `<text x="70" y="${nameTop(lines.length) + i * 74}" font-family="DejaVu Sans" font-size="66" font-weight="bold" fill="#FFFFFF">${esc(l)}</text>`,
    )
    .join('\n  ')}

  <!-- guide CTA strip -->
  <g transform="translate(70,486)">
    <rect x="0" y="0" width="${Math.max(400, 64 + ('How to use ' + (name.length > 24 ? 'this tool' : name)).length * 14)}" height="58" rx="29" fill="#D4AF37" fill-opacity="0.14" stroke="#D4AF37" stroke-opacity="0.5"/>
    <text x="32" y="38" font-family="DejaVu Sans" font-size="21" font-weight="bold"
      fill="#F3D27A" letter-spacing="1">How to use ${esc(name.length > 24 ? 'this tool' : name)}</text>
  </g>
  <text x="70" y="580" font-family="DejaVu Sans" font-size="20" fill="#94A3B8" letter-spacing="2">branify.store/ai-tools</text>
</svg>`;
}

let written = 0;
for (const t of aiToolsDirectory) {
  const file = path.join(OUT_DIR, `${t.slug}.png`);
  const svg = ogSvg(t.name, t.category);
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: { loadSystemFonts: true, defaultFontFamily: 'DejaVu Sans' },
  });
  fs.writeFileSync(file, resvg.render().asPng());
  written += 1;
}
console.log(`WROTE ${written} OG images -> ${OUT_DIR}`);
