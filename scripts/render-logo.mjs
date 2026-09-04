import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

const publicDir = path.join(process.cwd(), 'public');
const brandDir = path.join(publicDir, 'brand');

if (!fs.existsSync(brandDir)) {
  fs.mkdirSync(brandDir, { recursive: true });
}

// 1. Horizontal Header Logo (Height 120, Width 480) with 3D Gold B Monogram and Wordmark
const horizontalSvg = `
<svg width="480" height="120" viewBox="0 0 480 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- 3D Metallic Gold Gradients -->
    <linearGradient id="gold-bright" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF5DC" />
      <stop offset="25%" stop-color="#F3D27A" />
      <stop offset="65%" stop-color="#D4AF37" />
      <stop offset="100%" stop-color="#997A15" />
    </linearGradient>

    <linearGradient id="gold-bevel" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#544112" />
      <stop offset="50%" stop-color="#8F6B2D" />
      <stop offset="100%" stop-color="#D4AF37" />
    </linearGradient>

    <linearGradient id="gold-deep" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#241B08" />
      <stop offset="100%" stop-color="#08090B" />
    </linearGradient>

    <linearGradient id="gold-rim" x1="0%" y1="0%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9" />
      <stop offset="40%" stop-color="#F3D27A" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#C9A45C" stop-opacity="0.4" />
    </linearGradient>

    <linearGradient id="text-gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F3D27A" />
      <stop offset="50%" stop-color="#D4AF37" />
      <stop offset="100%" stop-color="#C9A45C" />
    </linearGradient>

    <filter id="subtle-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Left Monogram Icon (3D Metallic B Emblem) scaled to 90x90 -->
  <g transform="translate(15, 15) scale(0.75)">
    <!-- Ambient Glint Glow -->
    <ellipse cx="60" cy="60" rx="55" ry="45" fill="#D4AF37" opacity="0.12" filter="url(#subtle-glow)" />

    <!-- Deep Bevel Shadow & Extrusion Base -->
    <path
      d="M 16 38 L 42 12 H 82 C 102 12 115 24 115 42 C 115 56 103 66 86 70 L 42 42 L 16 38 Z"
      fill="url(#gold-bevel)"
    />
    <path
      d="M 12 80 L 52 52 H 86 C 106 52 118 64 118 82 C 118 102 101 110 76 110 H 30 C 18 110 14 100 26 100 L 74 100 C 88 100 96 93 96 82 C 96 70 88 64 71 64 L 40 83 L 12 80 Z"
      fill="url(#gold-deep)"
    />

    <!-- Upper Loop Body - 3D Front Face -->
    <path
      d="M 18 36 L 42 14 H 80 C 98 14 110 25 110 41 C 110 54 99 63 83 67 L 40 40 L 18 36 Z"
      fill="url(#gold-bright)"
      filter="url(#subtle-glow)"
    />

    <!-- Upper Inner Cutout -->
    <path
      d="M 48 26 H 75 C 83 26 89 30 89 37 C 89 44 83 48 73 48 L 41 28 L 48 26 Z"
      fill="#05070A"
    />

    <!-- Diagonal Dynamic Separation Slice -->
    <path
      d="M 38 41 L 83 67 L 76 72 L 30 46 Z"
      fill="#020407"
    />

    <!-- Lower Loop Body - 3D Front Face with Sharp Parallel Tail -->
    <path
      d="M 14 78 L 52 53 H 84 C 102 53 114 64 114 80 C 114 98 98 106 74 106 H 32 C 22 106 18 98 28 98 L 72 98 C 86 98 94 91 94 80 C 94 69 86 63 70 63 L 40 81 L 14 78 Z"
      fill="url(#gold-bright)"
    />

    <!-- Specular Highlight Line on Upper Wing -->
    <path
      d="M 22 35 L 43 16 H 78 C 94 16 104 25 106 37"
      stroke="url(#gold-rim)"
      stroke-width="2"
      stroke-linecap="round"
      fill="none"
    />

    <!-- Specular Highlight on Lower Wing Outer Edge -->
    <path
      d="M 17 76 L 53 55 H 82 C 98 55 108 64 110 78"
      stroke="url(#gold-rim)"
      stroke-width="1.8"
      stroke-linecap="round"
      fill="none"
    />
  </g>

  <!-- Wordmark "BRANIFY" (Bold High-Contrast Geometric Typography) -->
  <g transform="translate(118, 0)">
    <!-- Main Headline Text -->
    <text x="0" y="68" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="44" letter-spacing="3.5">
      <tspan fill="#FFFFFF">BRAN</tspan>
      <tspan fill="url(#text-gold)">IFY</tspan>
    </text>

    <!-- Tagline "BUILD. BRAND. GROW." -->
    <text x="2" y="94" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="11" letter-spacing="4.2">
      <tspan fill="#E4E5E1">BUILD.</tspan>
      <tspan fill="url(#text-gold)" dx="6">BRAND.</tspan>
      <tspan fill="#E4E5E1" dx="6">GROW.</tspan>
    </text>
  </g>
</svg>
`;

fs.writeFileSync(path.join(brandDir, 'branify-logo.svg'), horizontalSvg);
fs.writeFileSync(path.join(publicDir, 'branify-logo.svg'), horizontalSvg);

const resvg = new Resvg(horizontalSvg, {
  fitTo: {
    mode: 'width',
    value: 960, // 2x high DPI render for crystal clear rendering on retina screens
  },
});
const pngData = resvg.render();
const pngBuffer = pngData.asPng();

fs.writeFileSync(path.join(brandDir, 'branify-logo.png'), pngBuffer);
fs.writeFileSync(path.join(publicDir, 'branify-logo.png'), pngBuffer);
fs.writeFileSync(path.join(publicDir, 'branify-logo-dark.png'), pngBuffer);

console.log('Brand logo generated successfully. Size:', pngBuffer.length, 'bytes');
