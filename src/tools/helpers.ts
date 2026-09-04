// Shared client-side helpers for all tool implementations.
import type { ToolField, ToolRunContext, ToolResult } from './types';

/** Build the default values object from a field list. */
export const defaultsFrom = (fields: ToolField[]): Record<string, string | number | boolean> => {
  const out: Record<string, string | number | boolean> = {};
  for (const f of fields) out[f.name] = f.default as string | number | boolean;
  return out;
};

/** Throw a friendly error shown in the output panel. */
export const toolError = (message: string): never => {
  throw new Error(message);
};

/* ---------------- formatting ---------------- */

export const fmtMoney = (n: number, currency = '$'): string =>
  `${currency}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtNum = (n: number, digits = 2): string =>
  n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: digits });

export const kv = (label: string, value: string | number): string => `${label}: ${value}`;
export const bullet = (label: string, value: string | number): string => `• ${label}: ${value}`;

export const section = (title: string, lines: string[]): string =>
  [title, ...lines].join('\n');

export const titleCase = (s: string): string =>
  s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

/* ---------------- text analytics ---------------- */

const STOPWORD_SET = new Set(
  ('a,an,and,are,as,at,be,by,for,from,has,he,in,is,it,its,of,on,that,the,to,was,were,will,with,' +
    'this,these,those,but,or,if,not,you,your,we,our,they,their,i,me,my,so,do,does,did,can,could,' +
    'should,would,about,into,over,after,before,between,than,then,there,here,when,where,which,who,' +
    'what,how,why,all,any,both,each,few,more,most,other,some,such,no,nor,only,own,same,too,very,s,t,just')
    .split(',')
);

export const isStopword = (w: string): boolean => STOPWORD_SET.has(w.toLowerCase());

export const splitSentences = (text: string): string[] =>
  text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

export const countSyllables = (word: string): number => {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const trimmed = w
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    .replace(/^y/, '');
  const m = trimmed.match(/[aeiouy]{1,2}/g);
  return Math.max(1, m ? m.length : 1);
};

export const fleschReadingEase = (text: string): { score: number; grade: string; words: number; sentences: number; syllables: number } => {
  const words = (text.trim().match(/[A-Za-z0-9']+/g) || []).length;
  const sentences = Math.max(1, splitSentences(text).length);
  let syllables = 0;
  for (const w of text.toLowerCase().match(/[a-z']+/g) || []) syllables += countSyllables(w);
  if (words === 0) return { score: 0, grade: 'N/A', words: 0, sentences, syllables: 0 };
  const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  let grade = 'College';
  if (score >= 90) grade = '5th grade';
  else if (score >= 80) grade = '6th grade';
  else if (score >= 70) grade = '7th grade';
  else if (score >= 60) grade = '8th & 9th grade';
  else if (score >= 50) grade = '10th to 12th grade';
  else if (score >= 30) grade = 'College student';
  return { score: Math.round(score * 10) / 10, grade, words, sentences, syllables };
};

/* ---------------- crypto / hashing ---------------- */

/** Compact pure-JS MD5 (for hash tooling where WebCrypto lacks MD5). */
export const md5 = (input: string): string => {
  const rl = (n: number, c: number) => (n << c) | (n >>> (32 - c));
  const au = (x: number, y: number) => {
    const l = (x & 0xffff) + (y & 0xffff);
    return (((x >> 16) + (y >> 16) + (l >> 16)) << 16) | (l & 0xffff);
  };
  const cm = (q: number, a: number, b: number, x: number, s: number, t: number) =>
    au(rl(au(au(a, q), au(x, t)), s), b);
  const ff = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
    cm((b & c) | (~b & d), a, b, x, s, t);
  const gg = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
    cm((b & d) | (c & ~d), a, b, x, s, t);
  const hh = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
    cm(b ^ c ^ d, a, b, x, s, t);
  const ii = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
    cm(c ^ (b | ~d), a, b, x, s, t);

  // Convert string to UTF-8 bytes
  const utf8 = unescape(encodeURIComponent(input));
  const n = utf8.length;
  const words: number[] = [];
  for (let i = 0; i < n; i++) words[i >> 2] = (words[i >> 2] || 0) | (utf8.charCodeAt(i) << ((i % 4) * 8));
  words[n >> 2] = (words[n >> 2] || 0) | (0x80 << ((n % 4) * 8));
  const len = (((n + 8) >> 6) + 1) * 16;
  for (let i = 0; i < len; i++) words[i] = words[i] || 0;
  words[len - 2] = n * 8;

  let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
  for (let i = 0; i < len; i += 16) {
    const [oa, ob, oc, od] = [a, b, c, d];
    a = ff(a, b, c, d, words[i], 7, -680876936);
    d = ff(d, a, b, c, words[i + 1], 12, -389564586);
    c = ff(c, d, a, b, words[i + 2], 17, 606105819);
    b = ff(b, c, d, a, words[i + 3], 22, -1044525330);
    a = ff(a, b, c, d, words[i + 4], 7, -176418897);
    d = ff(d, a, b, c, words[i + 5], 12, 1200080426);
    c = ff(c, d, a, b, words[i + 6], 17, -1473231341);
    b = ff(b, c, d, a, words[i + 7], 22, -45705983);
    a = ff(a, b, c, d, words[i + 8], 7, 1770035416);
    d = ff(d, a, b, c, words[i + 9], 12, -1958414417);
    c = ff(c, d, a, b, words[i + 10], 17, -42063);
    b = ff(b, c, d, a, words[i + 11], 22, -1990404162);
    a = ff(a, b, c, d, words[i + 12], 7, 1804603682);
    d = ff(d, a, b, c, words[i + 13], 12, -40341101);
    c = ff(c, d, a, b, words[i + 14], 17, -1502002290);
    b = ff(b, c, d, a, words[i + 15], 22, 1236535329);
    a = gg(a, b, c, d, words[i + 1], 5, -165796510);
    d = gg(d, a, b, c, words[i + 6], 9, -1069501632);
    c = gg(c, d, a, b, words[i + 11], 14, 643717713);
    b = gg(b, c, d, a, words[i], 20, -373897302);
    a = gg(a, b, c, d, words[i + 5], 5, -701558691);
    d = gg(d, a, b, c, words[i + 10], 9, 38016083);
    c = gg(c, d, a, b, words[i + 15], 14, -660478335);
    b = gg(b, c, d, a, words[i + 4], 20, -405537848);
    a = gg(a, b, c, d, words[i + 9], 5, 568446438);
    d = gg(d, a, b, c, words[i + 14], 9, -1019803690);
    c = gg(c, d, a, b, words[i + 3], 14, -187363961);
    b = gg(b, c, d, a, words[i + 8], 20, 1163531501);
    a = gg(a, b, c, d, words[i + 13], 5, -1444681467);
    d = gg(d, a, b, c, words[i + 2], 9, -51403784);
    c = gg(c, d, a, b, words[i + 7], 14, 1735328473);
    b = gg(b, c, d, a, words[i + 12], 20, -1926607734);
    a = hh(a, b, c, d, words[i + 5], 4, -378558);
    d = hh(d, a, b, c, words[i + 8], 11, -2022574463);
    c = hh(c, d, a, b, words[i + 11], 16, 1839030562);
    b = hh(b, c, d, a, words[i + 14], 23, -35309556);
    a = hh(a, b, c, d, words[i + 1], 4, -1530992060);
    d = hh(d, a, b, c, words[i + 4], 11, 1272893353);
    c = hh(c, d, a, b, words[i + 7], 16, -155497632);
    b = hh(b, c, d, a, words[i + 10], 23, -1094730640);
    a = hh(a, b, c, d, words[i + 13], 4, 681279174);
    d = hh(d, a, b, c, words[i], 11, -358537222);
    c = hh(c, d, a, b, words[i + 3], 16, -722521979);
    b = hh(b, c, d, a, words[i + 6], 23, 76029189);
    a = hh(a, b, c, d, words[i + 9], 4, -640364487);
    d = hh(d, a, b, c, words[i + 12], 11, -421815835);
    c = hh(c, d, a, b, words[i + 15], 16, 530742520);
    b = hh(b, c, d, a, words[i + 2], 23, -995338651);
    a = ii(a, b, c, d, words[i], 6, -198630844);
    d = ii(d, a, b, c, words[i + 7], 10, 1126891415);
    c = ii(c, d, a, b, words[i + 14], 15, -1416354905);
    b = ii(b, c, d, a, words[i + 5], 21, -57434055);
    a = ii(a, b, c, d, words[i + 12], 6, 1700485571);
    d = ii(d, a, b, c, words[i + 3], 10, -1894986606);
    c = ii(c, d, a, b, words[i + 10], 15, -1051523);
    b = ii(b, c, d, a, words[i + 1], 21, -2054922799);
    a = ii(a, b, c, d, words[i + 8], 6, 1873313359);
    d = ii(d, a, b, c, words[i + 15], 10, -30611744);
    c = ii(c, d, a, b, words[i + 6], 15, -1560198380);
    b = ii(b, c, d, a, words[i + 13], 21, 1309151649);
    a = ii(a, b, c, d, words[i + 4], 6, -145523070);
    d = ii(d, a, b, c, words[i + 11], 10, -1120210379);
    c = ii(c, d, a, b, words[i + 2], 15, 718787259);
    b = ii(b, c, d, a, words[i + 9], 21, -343485551);
    a = au(a, oa); b = au(b, ob); c = au(c, oc); d = au(d, od);
  }
  const hex = (num: number) => {
    let s = '';
    for (let j = 0; j < 4; j++) s += ((num >> (j * 8 + 4)) & 0x0f).toString(16) + ((num >> (j * 8)) & 0x0f).toString(16);
    return s;
  };
  return hex(a) + hex(b) + hex(c) + hex(d);
};

export const shaHex = async (algo: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512', input: string): Promise<string> => {
  const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

export const shaBase64 = async (algo: 'SHA-1', input: string): Promise<string> => {
  const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(input));
  let bin = '';
  new Uint8Array(buf).forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
};

/** Cryptographically secure helpers */
export const secureRandomInt = (maxExclusive: number): number => {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % maxExclusive;
};

export const pick = <T,>(arr: T[]): T => arr[secureRandomInt(arr.length)];

export const sample = <T,>(arr: T[], count: number): T[] => {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < count && copy.length) out.push(...copy.splice(secureRandomInt(copy.length), 1));
  return out;
};

/* ---------------- images ---------------- */

export const loadImage = (dataUrl: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode the uploaded image.'));
    img.src = dataUrl;
  });

export const canvasToDataUrl = (canvas: HTMLCanvasElement, mime = 'image/png', quality = 0.92): string =>
  canvas.toDataURL(mime, quality);

/** Approximate byte size of a data URL payload. */
export const dataUrlBytes = (dataUrl: string): number => {
  const base64 = dataUrl.split(',')[1] || '';
  return Math.floor((base64.length * 3) / 4) - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
};

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Could not read the uploaded file.'));
    r.readAsDataURL(file);
  });

export const fileToText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Could not read the uploaded file.'));
    r.readAsText(file);
  });

/* ---------------- output guard ---------------- */

/** Wrap run() bodies so thrown errors become readable ToolResults. */
export const asResult = async (fn: () => Promise<ToolResult> | ToolResult): Promise<ToolResult> => {
  try {
    return await fn();
  } catch (e) {
    return { output: `⚠ ${(e as Error).message || 'Tool execution failed.'}`, note: 'Check your inputs and try again.' };
  }
};

export const okResult = (r: ToolResult): ToolResult => r;
