import { DigitalTool } from '../types';

export const digitalToolsData: DigitalTool[] = [
  {
    id: 'password-gen',
    name: 'Entropy Password Generator',
    tagline: 'Cryptographic security generator with custom character constraints and entropy scoring.',
    description: 'Generate high-entropy, breach-resistant credentials locally in your browser with zero data transmission.',
    category: 'security',
    iconName: 'ShieldCheck',
    isPopular: true,
    status: 'active',
    features: ['High-Entropy Calculation', 'Custom Symbol Sets', 'Zero-Server Processing', 'One-Click Secure Copy']
  },
  {
    id: 'qr-gen',
    name: 'Vector QR Generator',
    tagline: 'High-resolution QR codes with customizable brand palettes and SVG export.',
    description: 'Create clean vector QR codes for websites, Wi-Fi keys, vCards, and digital wallets without watermarks.',
    category: 'utility',
    iconName: 'QrCode',
    isPopular: true,
    status: 'active',
    features: ['SVG / PNG Vector Export', 'Custom Accent Colors', 'Error Correction Control', 'No Expiration Limits']
  },
  {
    id: 'color-converter',
    name: 'Harmonic Color Converter',
    tagline: 'Seamless conversion between HEX, RGB, HSL, OKLCH and WCAG contrast check.',
    description: 'Test accessible contrast ratios and convert luxury palette codes with instant mathematical validation.',
    category: 'design',
    iconName: 'Palette',
    isPopular: false,
    status: 'active',
    features: ['HEX / RGB / HSL / OKLCH', 'WCAG AA/AAA Ratio Check', 'Color Palette Generator', 'CSS Variable Code Output']
  },
  {
    id: 'json-formatter',
    name: 'JSON Tree Formatter & Validator',
    tagline: 'Clean syntax highlighter, error pinpointing, and minification engine.',
    description: 'Format, validate, repair, and explore deeply nested JSON payloads with lightning speed.',
    category: 'developer',
    iconName: 'FileJson',
    isPopular: true,
    status: 'active',
    features: ['Instant Syntax Validation', 'Collapsible Node Trees', 'Minify / Beautify', 'TypeScript Interface Generator']
  },
  {
    id: 'meta-generator',
    name: 'Social Meta Tag Generator',
    tagline: 'Open Graph and Twitter Card tags builder with live social preview simulation.',
    description: 'Generate production-ready HTML meta tags for Google search results, iMessage, Slack, and Twitter.',
    category: 'developer',
    iconName: 'Code',
    isPopular: false,
    status: 'active',
    features: ['Google SERP Live Preview', 'OpenGraph / Twitter Tags', 'One-Click HTML Snippet', 'Image Dimension Checks']
  },
  {
    id: 'word-counter',
    name: 'Editorial Word & Reading Metrics',
    tagline: 'Precise character count, speaking time, and readability score analyzer.',
    description: 'Analyze copy length, syllable density, estimated reading duration, and keyword frequencies in real-time.',
    category: 'utility',
    iconName: 'Type',
    isPopular: false,
    status: 'active',
    features: ['Reading & Speaking Time', 'Character & Syllable Count', 'Flesch Reading Ease', 'Keyword Density Matrix']
  },
  {
    id: 'image-compressor',
    name: 'Lossless Image Compressor',
    tagline: 'In-browser image optimization with WebP conversion and target size limits.',
    description: 'Shrink JPEG, PNG, and WebP assets by up to 80% with lossless clarity directly on your GPU.',
    category: 'utility',
    iconName: 'Image',
    isPopular: true,
    status: 'active',
    features: ['WebP Conversion', '100% Client-Side Privacy', 'Batch File Handling', 'Quality vs Size Slider']
  },
  {
    id: 'text-formatter',
    name: 'Text Case & Format Studio',
    tagline: 'Transform casing, strip unwanted characters, slugify URLs, and clean markup.',
    description: 'Transform title cases, camelCase, kebab-case, snake_case, encode URIs, and deduplicate linebreaks.',
    category: 'utility',
    iconName: 'AlignLeft',
    isPopular: false,
    status: 'active',
    features: ['camelCase / kebab-case / Title', 'URL Slugifier', 'HTML Strip / Entity Decode', 'Whitespace Normalizer']
  },
  {
    id: 'pdf-tools',
    name: 'PDF Utility Suite',
    tagline: 'Fast browser-based page extraction, merge preview, and metadata inspect.',
    description: 'Inspect page counts, compress digital documents, and combine multi-page files securely.',
    category: 'utility',
    iconName: 'FileText',
    isPopular: false,
    status: 'beta',
    features: ['Page Split & Merge', 'Client-Side Encryption', 'Metadata Sanitization', 'High DPI Output']
  }
];
