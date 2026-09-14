// Performance: generate right-sized, quantized icon derivatives from the
// single 1024px master (public/downloads/branify-icon.png — kept full-res for
// the Brand Kit download). Root favicon was 665 KB and was fetched eagerly by
// every visitor as `<link rel="icon">`.
//
//   public/favicon.png            32x32   (browser tab)
//   public/apple-touch-icon.png  180x180  (iOS home screen)
//   public/branify-icon.png      192x192  (in-app <img> logos + SW precache)
//   public/assets/icon-192.png   192x192  (PWA manifest, recompressed)
//   public/assets/icon-512.png   512x512  (PWA manifest, recompressed)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'public');
const MASTER = path.join(ROOT, 'downloads', 'branify-icon.png');

if (!fs.existsSync(MASTER)) {
  console.error('[icons] master not found:', MASTER);
  process.exit(1);
}

const PY = `
import sys
from PIL import Image

master_path, out_specs = sys.argv[1], sys.argv[2]
master = Image.open(master_path).convert("RGBA")

specs = []
for spec in out_specs.split(","):
    out_path, size = spec.split(":")
    specs.append((out_path, int(size)))

for out_path, size in specs:
    im = master.resize((size, size), Image.LANCZOS)
    # Quantize to an adaptive 256-color palette (gold-on-dark logo: visually
    # identical, ~10x smaller) then save fully optimized.
    q = im.quantize(colors=256, method=Image.FASTOCTREE, dither=Image.FLOYDSTEINBERG)
    q.save(out_path, "PNG", optimize=True)
    print("[icons]", out_path, "OK")
`;

const pyFile = path.join(process.cwd(), 'scripts', '_icon_opt.py');
fs.writeFileSync(pyFile, PY);

const jobs = [
  [path.join(ROOT, 'favicon.png'), 32],
  [path.join(ROOT, 'apple-touch-icon.png'), 180],
  [path.join(ROOT, 'branify-icon.png'), 192],
  [path.join(ROOT, 'assets', 'icon-192.png'), 192],
  [path.join(ROOT, 'assets', 'icon-512.png'), 512],
];

const specArg = jobs.map(([p, s]) => `${p}:${s}`).join(',');
execFileSync('python3', [pyFile, MASTER, specArg], { stdio: 'inherit' });
fs.unlinkSync(pyFile);

for (const [p] of jobs) {
  const kb = (fs.statSync(p).size / 1024).toFixed(1);
  console.log(`[icons] ${p.replace(process.cwd() + '/', '')} -> ${kb} KB`);
}
