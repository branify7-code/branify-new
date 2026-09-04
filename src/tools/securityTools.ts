// ─────────────────────────────────────────────────────────────────────────────
// Security & Utility Tools — 14 fully client-side tool definitions.
//
// Every tool runs 100% in the browser: no network calls, no server round-trips.
// The only external package used is the site's existing `qrcode` dependency
// (for the QR generator). Everything else is framework-local: ./types + ./helpers.
// ─────────────────────────────────────────────────────────────────────────────

import QRCode from 'qrcode';
import { num, str, bool } from './types';
import type { ToolDefinition, ToolField, ToolResult } from './types';
import {
  secureRandomInt,
  pick,
  fmtNum,
  kv,
  bullet,
  md5,
  shaBase64,
  formatBytes,
} from './helpers';

/* ───────────────────────────── shared local helpers ──────────────────────── */

/** Compact factory for select fields (keeps the tool definitions tidy). */
const selectField = (
  name: string,
  label: string,
  options: { value: string; label: string }[],
  defaultValue: string,
  hint?: string,
): ToolField =>
  hint
    ? { name, label, type: 'select', default: defaultValue, options, hint }
    : { name, label, type: 'select', default: defaultValue, options };

/** Build select options from [value, label] tuples. */
const opts = (...pairs: [string, string][]): { value: string; label: string }[] =>
  pairs.map(([value, label]) => ({ value, label }));

/** Humanize a duration in seconds: "instantly" → "seconds" → "trillion years". */
const humanizeSeconds = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return 'effectively forever';
  if (seconds < 1) return 'instantly';
  if (seconds < 60) return `${fmtNum(seconds, 1)} seconds`;
  const minutes = seconds / 60;
  if (minutes < 60) return `${fmtNum(minutes, 1)} minutes`;
  const hours = minutes / 60;
  if (hours < 24) return `${fmtNum(hours, 1)} hours`;
  const days = hours / 24;
  if (days < 365) return `${fmtNum(days, 1)} days`;
  const years = days / 365.25;
  if (years < 1e6) return `${fmtNum(years, 1)} years`;
  if (years < 1e9) return `${fmtNum(years / 1e6, 1)} million years`;
  if (years < 1e12) return `${fmtNum(years / 1e9, 1)} billion years`;
  if (years < 1e15) return `${fmtNum(years / 1e12, 1)} trillion years`;
  return `${fmtNum(years / 1e15, 1)} quadrillion years`;
};

/** Average crack time for an entropy estimate, assuming 10 billion guesses/sec. */
const crackTimeAt1e10 = (entropyBits: number): string =>
  humanizeSeconds(Math.pow(2, Math.min(Math.max(entropyBits, 0), 1023) - 1) / 1e10);

/** Entropy-based strength verdict used by both password tools. */
const strengthVerdict = (bits: number): string =>
  bits >= 100 ? 'EXCELLENT' : bits >= 70 ? 'STRONG' : bits >= 50 ? 'MODERATE' : 'WEAK';

/* Character pools for the password / random-string generators. */
const CHARSET = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>?/~',
};
const AMBIGUOUS = 'Il1O0';

const SECRET_POOLS: Record<string, string> = {
  alnum: CHARSET.uppercase + CHARSET.lowercase + CHARSET.digits,
  hex: CHARSET.digits + 'abcdef',
  alnumSymbols: CHARSET.uppercase + CHARSET.lowercase + CHARSET.digits + '!@#$%^&*-_=+',
  digits: CHARSET.digits,
};

/* Common passwords (small local breach-list sample for the strength checker). */
const COMMON_PASSWORDS = new Set([
  'password', '123456', '123456789', '12345678', '12345', 'qwerty', 'abc123',
  'password1', 'iloveyou', 'admin', 'welcome', 'monkey', 'dragon', 'letmein',
  'football', '111111', '123123', 'sunshine', 'princess', 'qwerty123',
  'password123', '000000',
]);

/* Keyboard / alphabet runs that massively reduce effective entropy. */
const SEQUENTIAL_PATTERNS = [
  'abcd', 'bcde', 'cdef', '1234', '2345', '3456', '4567', '5678', '6789',
  'qwer', 'wert', 'asdf', 'zxcv', 'hjkl',
];

/* Unit conversion table (base: meter / kilogram / byte, 1024-based for data). */
const UNITS: Record<string, { category: string; factor: number; full: string }> = {
  // Length — base: meter
  m: { category: 'Length', factor: 1, full: 'meters' },
  km: { category: 'Length', factor: 1000, full: 'kilometers' },
  cm: { category: 'Length', factor: 0.01, full: 'centimeters' },
  mm: { category: 'Length', factor: 0.001, full: 'millimeters' },
  ft: { category: 'Length', factor: 0.3048, full: 'feet' },
  in: { category: 'Length', factor: 0.0254, full: 'inches' },
  mi: { category: 'Length', factor: 1609.344, full: 'miles' },
  // Weight — base: kilogram
  kg: { category: 'Weight', factor: 1, full: 'kilograms' },
  g: { category: 'Weight', factor: 0.001, full: 'grams' },
  lb: { category: 'Weight', factor: 0.45359237, full: 'pounds' },
  oz: { category: 'Weight', factor: 0.028349523125, full: 'ounces' },
  t: { category: 'Weight', factor: 1000, full: 'metric tons' },
  // Data — base: byte (binary, 1024-based)
  B: { category: 'Data', factor: 1, full: 'bytes' },
  KB: { category: 'Data', factor: 1024, full: 'kilobytes' },
  MB: { category: 'Data', factor: 1024 ** 2, full: 'megabytes' },
  GB: { category: 'Data', factor: 1024 ** 3, full: 'gigabytes' },
  TB: { category: 'Data', factor: 1024 ** 4, full: 'terabytes' },
};

/** Select options for every unit, in table order. */
const unitOptions = (): { value: string; label: string }[] =>
  Object.keys(UNITS).map((code) => ({
    value: code,
    label: `${code} — ${UNITS[code].full} (${UNITS[code].category})`,
  }));

/* ────────────────────────────────── tools ────────────────────────────────── */

export const securityTools: ToolDefinition[] = [
  /* ── 1. password-generator ─────────────────────────────────────────────── */
  {
    slug: 'password-generator',
    fields: [
      { name: 'length', label: 'Password length', type: 'number', default: 18, min: 8, max: 64, step: 1, hint: '8–64 characters' },
      { name: 'uppercase', label: 'Uppercase letters (A-Z)', type: 'checkbox', default: true },
      { name: 'lowercase', label: 'Lowercase letters (a-z)', type: 'checkbox', default: true },
      { name: 'numbers', label: 'Numbers (0-9)', type: 'checkbox', default: true },
      { name: 'symbols', label: 'Symbols (!@#$…)', type: 'checkbox', default: true },
      { name: 'avoidAmbiguous', label: 'Avoid ambiguous characters (I l 1 O 0)', type: 'checkbox', default: false, hint: 'Useful when passwords are read aloud or copied by hand' },
    ],
    run: ({ values }) => {
      const length = Math.min(64, Math.max(8, Math.round(num(values.length, 18))));
      const avoided = bool(values.avoidAmbiguous, false);

      let pool = '';
      if (bool(values.uppercase, true)) pool += CHARSET.uppercase;
      if (bool(values.lowercase, true)) pool += CHARSET.lowercase;
      if (bool(values.numbers, true)) pool += CHARSET.digits;
      if (bool(values.symbols, true)) pool += CHARSET.symbols;
      if (avoided) pool = [...pool].filter((c) => !AMBIGUOUS.includes(c)).join('');
      if (!pool) throw new Error('Select at least one character set');

      const chars = [...pool];
      let password = '';
      for (let i = 0; i < length; i++) password += pick(chars);

      const poolSize = chars.length;
      const entropy = length * Math.log2(poolSize);

      return {
        output: [
          kv('Generated Password', password),
          '',
          bullet('Length', `${length} characters`),
          bullet('Character pool size', `${poolSize} unique characters`),
          bullet('Entropy', `${fmtNum(entropy, 1)} bits`),
          bullet('Strength verdict', strengthVerdict(entropy)),
          bullet('Estimated crack time', `${crackTimeAt1e10(entropy)} (at 10 billion guesses/sec)`),
          bullet('Ambiguous characters (Il1O0)', avoided ? 'excluded' : 'included'),
        ].join('\n'),
        note: 'Generated locally with crypto.getRandomValues — the password never leaves your browser.',
      };
    },
  },

  /* ── 2. password-strength-checker ──────────────────────────────────────── */
  {
    slug: 'password-strength-checker',
    fields: [
      { name: 'password', label: 'Password to test', type: 'text', default: 'Tr0ub4dor&3', placeholder: 'Enter password to test security entropy...' },
    ],
    run: ({ values }) => {
      const password = str(values.password, '');
      if (!password) throw new Error('Enter a password to analyze');

      const sets = [
        { label: 'Lowercase letters (a-z)', ok: /[a-z]/.test(password), size: 26 },
        { label: 'Uppercase letters (A-Z)', ok: /[A-Z]/.test(password), size: 26 },
        { label: 'Numbers (0-9)', ok: /[0-9]/.test(password), size: 10 },
        { label: 'Symbols (!@#$…)', ok: /[^A-Za-z0-9]/.test(password), size: 33 },
      ];
      const poolSize = sets.reduce((sum, s) => sum + (s.ok ? s.size : 0), 0);
      const lower = password.toLowerCase();
      const hasCommon = COMMON_PASSWORDS.has(lower);
      const hasSequential = SEQUENTIAL_PATTERNS.some((p) => lower.includes(p));
      const hasRepeated = /(.)\1{2,}/.test(password);
      const entropy = password.length * Math.log2(Math.max(2, poolSize));

      let score = 0;
      if (password.length >= 8) score++;
      if (password.length >= 12) score++;
      if (sets[0].ok && sets[1].ok) score++;
      if (sets[2].ok && sets[3].ok) score++;
      if (entropy >= 70) score++;
      if (hasCommon) score = 0;
      if (hasSequential) score = Math.max(0, score - 2);
      if (hasRepeated) score = Math.max(0, score - 1);
      score = Math.min(4, score);
      const verdicts = ['VERY WEAK', 'WEAK', 'FAIR', 'STRONG', 'EXCELLENT'];

      return {
        output: [
          kv('Analyzing password', `${password.length} characters`),
          '',
          bullet('Length', `${password.length} characters`),
          ...sets.map((s) => bullet(s.label, s.ok ? 'present' : 'missing')),
          bullet('Character pool size', `${poolSize} characters`),
          bullet('Raw entropy', `${fmtNum(entropy, 1)} bits`),
          bullet('Common password match', hasCommon ? 'YES — found in breach lists' : 'none'),
          bullet('Sequential patterns', hasSequential ? 'detected (e.g. abcd / 1234 / qwer)' : 'none'),
          bullet('Repeated characters', hasRepeated ? 'detected (3+ identical in a row)' : 'none'),
          bullet('Overall score', `${score}/4 — ${verdicts[score]}`),
          bullet('Estimated crack time', `${crackTimeAt1e10(hasCommon ? 0 : entropy)} (at 10 billion guesses/sec)`),
        ].join('\n'),
        note: 'Analyzed entirely in your browser — the password is never transmitted or stored.',
      };
    },
  },

  /* ── 3. qr-code-generator ──────────────────────────────────────────────── */
  {
    slug: 'qr-code-generator',
    fields: [
      { name: 'content', label: 'Text or URL to encode', type: 'text', default: 'https://branify.store', placeholder: 'https://branify.store' },
      { name: 'size', label: 'Image size (px)', type: 'number', default: 250, min: 100, max: 1000, step: 10 },
      selectField('errorCorrection', 'Error correction level', opts(
        ['L', 'L — 7% recoverable'],
        ['M', 'M — 15% recoverable'],
        ['Q', 'Q — 25% recoverable'],
        ['H', 'H — 30% recoverable'],
      ), 'M'),
      { name: 'fillColor', label: 'Fill color (dark modules)', type: 'text', default: '#000000', placeholder: '#000000' },
      { name: 'bgColor', label: 'Background color', type: 'text', default: '#ffffff', placeholder: '#ffffff' },
    ],
    run: async ({ values }) => {
      const content = str(values.content, '').trim();
      if (!content) throw new Error('Enter text or a URL to encode');
      const size = Math.min(1000, Math.max(100, Math.round(num(values.size, 250))));
      const ecRaw = str(values.errorCorrection, 'M').toUpperCase();
      const ec = (['L', 'M', 'Q', 'H'].includes(ecRaw) ? ecRaw : 'M') as 'L' | 'M' | 'Q' | 'H';
      const fill = str(values.fillColor, '#000000');
      const bg = str(values.bgColor, '#ffffff');

      try {
        const dataUrl = await QRCode.toDataURL(content, {
          width: size,
          margin: 2,
          errorCorrectionLevel: ec,
          color: { dark: fill, light: bg },
        });
        return {
          output: [
            kv('QR Code generated for payload:', content),
            '',
            bullet('Payload length', `${content.length} characters`),
            bullet('Image size', `${size} × ${size} px`),
            bullet('Error correction', `${ec} level`),
          ].join('\n'),
          imageDataUrl: dataUrl,
          downloadName: 'branify-qr.png',
          downloadMime: 'image/png',
        };
      } catch (e) {
        return {
          output: `⚠ QR generation failed: ${(e as Error).message || 'unknown error'}`,
          note: 'Check the colors (hex like #000000) or try a shorter payload.',
        };
      }
    },
  },

  /* ── 4. random-number-generator ────────────────────────────────────────── */
  {
    slug: 'random-number-generator',
    fields: [
      { name: 'min', label: 'Minimum value', type: 'number', default: 1 },
      { name: 'max', label: 'Maximum value', type: 'number', default: 100 },
      { name: 'quantity', label: 'How many numbers', type: 'number', default: 5, min: 1, max: 1000, step: 1 },
      { name: 'allowDuplicates', label: 'Allow duplicates', type: 'checkbox', default: true },
      selectField('sort', 'Sort order', opts(
        ['none', 'None (draw order)'],
        ['asc', 'Ascending'],
        ['desc', 'Descending'],
      ), 'none'),
    ],
    run: ({ values }) => {
      const min = Math.round(num(values.min, 1));
      const max = Math.round(num(values.max, 100));
      const quantity = Math.min(1000, Math.max(1, Math.round(num(values.quantity, 5))));
      if (max <= min) throw new Error('Maximum must be greater than minimum');
      const sort = str(values.sort, 'none');

      let numbers: number[] = [];
      if (bool(values.allowDuplicates, true)) {
        for (let i = 0; i < quantity; i++) numbers.push(secureRandomInt(max - min + 1) + min);
      } else {
        const range = max - min + 1;
        if (quantity > range) {
          throw new Error(`Cannot draw ${quantity} unique numbers from a range of only ${range}`);
        }
        const used = new Set<number>();
        while (used.size < quantity) used.add(secureRandomInt(range) + min);
        numbers = [...used];
      }
      if (sort === 'asc') numbers.sort((a, b) => a - b);
      else if (sort === 'desc') numbers.sort((a, b) => b - a);

      const sum = numbers.reduce((acc, n) => acc + n, 0);

      return {
        output: [
          kv(`Generated Numbers (${numbers.length})`, numbers.join(', ')),
          '',
          bullet('Sum', fmtNum(sum)),
          bullet('Average', fmtNum(sum / numbers.length, 2)),
          bullet('Min', Math.min(...numbers)),
          bullet('Max', Math.max(...numbers)),
        ].join('\n'),
        note: 'Drawn uniformly with crypto.getRandomValues — no bias, no seeding.',
      };
    },
  },

  /* ── 5. random-string-generator ────────────────────────────────────────── */
  {
    slug: 'random-string-generator',
    fields: [
      { name: 'length', label: 'Key length (characters)', type: 'number', default: 32, min: 4, max: 256, step: 1 },
      { name: 'quantity', label: 'How many keys', type: 'number', default: 3, min: 1, max: 20, step: 1 },
      selectField('charset', 'Character set', opts(
        ['alnum', 'Alphanumeric (A-Z, a-z, 0-9)'],
        ['hex', 'Hexadecimal (0-9, a-f)'],
        ['alnumSymbols', 'Alphanumeric + Symbols'],
        ['digits', 'Digits only (0-9)'],
      ), 'alnum'),
    ],
    run: ({ values }) => {
      const length = Math.min(256, Math.max(4, Math.round(num(values.length, 32))));
      const quantity = Math.min(20, Math.max(1, Math.round(num(values.quantity, 3))));
      const charset = str(values.charset, 'alnum');
      const pool = SECRET_POOLS[charset] ?? SECRET_POOLS.alnum;
      const chars = [...pool];

      const lines: string[] = [];
      for (let i = 0; i < quantity; i++) {
        let secret = '';
        for (let j = 0; j < length; j++) secret += pick(chars);
        lines.push(`${i + 1}. ${secret}`);
      }

      return {
        output: [
          kv('Generated secrets', `${quantity} × ${length} characters`),
          '',
          ...lines,
          '',
          bullet('Entropy per key', `${fmtNum(length * Math.log2(pool.length), 1)} bits`),
          bullet('Pool size', `${pool.length} characters`),
        ].join('\n'),
        note: 'Suitable for API secrets, session tokens and webhook signing keys — store them safely.',
      };
    },
  },

  /* ── 6. unix-timestamp-converter ───────────────────────────────────────── */
  {
    slug: 'unix-timestamp-converter',
    fields: [
      selectField('mode', 'Input mode', opts(
        ['now', 'Now (current moment)'],
        ['timestamp', 'From Unix timestamp'],
        ['date', 'From date string'],
      ), 'timestamp'),
      { name: 'timestamp', label: 'Unix timestamp (seconds)', type: 'number', default: 1767225600, hint: 'Seconds since 1970-01-01 UTC (ms values are auto-detected)' },
      { name: 'date', label: 'Date string', type: 'text', default: '2026-01-01 12:00', placeholder: '2026-01-01 12:00', hint: 'Any value new Date() understands, e.g. 2026-01-01 12:00' },
    ],
    run: ({ values }) => {
      const mode = str(values.mode, 'timestamp');
      let ms: number;
      let sourceLabel: string;

      if (mode === 'now') {
        ms = Date.now();
        sourceLabel = 'now';
      } else if (mode === 'date') {
        const raw = str(values.date, '').trim();
        const parsed = new Date(raw);
        if (Number.isNaN(parsed.getTime())) {
          throw new Error('Invalid date string — use e.g. 2026-01-01 12:00');
        }
        ms = parsed.getTime();
        sourceLabel = raw;
      } else {
        const ts = num(values.timestamp, 0);
        // Accept both seconds and milliseconds inputs.
        ms = Math.abs(ts) >= 1e12 ? ts : ts * 1000;
        sourceLabel = String(ts);
      }

      const d = new Date(ms);
      const diffSec = Math.round((ms - Date.now()) / 1000);
      const relative =
        Math.abs(diffSec) < 60
          ? 'just now'
          : diffSec > 0
            ? `in ${humanizeSeconds(Math.abs(diffSec))}`
            : `${humanizeSeconds(Math.abs(diffSec))} ago`;

      return {
        output: [
          kv('Converting', sourceLabel),
          '',
          bullet('Unix seconds', Math.floor(ms / 1000)),
          bullet('Unix milliseconds', Math.round(ms)),
          bullet('ISO 8601 (UTC)', d.toISOString()),
          bullet('UTC string', d.toUTCString()),
          bullet('Local time', d.toLocaleString()),
          bullet('Relative', relative),
        ].join('\n'),
        note: 'All conversions are computed from UTC — your browser timezone is only used for the local line.',
      };
    },
  },

  /* ── 7. time-zone-converter-quick ──────────────────────────────────────── */
  {
    slug: 'time-zone-converter-quick',
    fields: [
      { name: 'datetime', label: 'Date & time', type: 'text', default: '2026-01-15 14:30', placeholder: 'YYYY-MM-DD HH:mm' },
      selectField('fromZone', 'From time zone', opts(
        ['UTC', 'UTC (Coordinated Universal Time)'],
        ['EST', 'EST (New York, UTC-5)'],
        ['PST', 'PST (Los Angeles, UTC-8)'],
        ['GMT', 'GMT (London, UTC+0)'],
        ['PKT', 'PKT (Karachi, UTC+5)'],
        ['GST', 'GST (Dubai, UTC+4)'],
        ['Local', 'Local (this device)'],
      ), 'UTC'),
      selectField('toZone', 'To time zone', opts(
        ['PKT', 'PKT (Karachi, UTC+5)'],
        ['UTC', 'UTC (Coordinated Universal Time)'],
        ['EST', 'EST (New York, UTC-5)'],
        ['PST', 'PST (Los Angeles, UTC-8)'],
        ['GMT', 'GMT (London, UTC+0)'],
        ['GST', 'GST (Dubai, UTC+4)'],
      ), 'PKT'),
    ],
    run: ({ values }) => {
      const ZONE_OFFSETS: Record<string, number> = { UTC: 0, GMT: 0, EST: -5, PST: -8, PKT: 5, GST: 4 };
      const localOffset = -new Date().getTimezoneOffset() / 60;

      const raw = str(values.datetime, '').trim();
      const m = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[T ](\d{1,2}):(\d{2})$/);
      if (!m) throw new Error('Use format YYYY-MM-DD HH:mm');
      const [, y, mo, d, h, mi] = m;
      const month = Number(mo);
      const day = Number(d);
      const hour = Number(h);
      const minute = Number(mi);
      if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
        throw new Error('Use format YYYY-MM-DD HH:mm');
      }

      const fromZone = str(values.fromZone, 'UTC');
      const toZone = str(values.toZone, 'PKT');
      const fromOff = fromZone === 'Local' ? localOffset : (ZONE_OFFSETS[fromZone] ?? 0);
      const toOff = toZone === 'Local' ? localOffset : (ZONE_OFFSETS[toZone] ?? 0);

      const pad = (n: number): string => String(n).padStart(2, '0');
      const fmtWall = (ms: number): string => {
        const dt = new Date(ms);
        return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())} ${pad(dt.getUTCHours())}:${pad(dt.getUTCMinutes())}`;
      };
      const zoneLabel = (zone: string, off: number): string =>
        `${zone} (UTC${off < 0 ? '-' : '+'}${fmtNum(Math.abs(off), 2)})`;

      const wallMs = Date.UTC(Number(y), month - 1, day, hour, minute);
      const utcMs = wallMs - fromOff * 3600000;
      const toWallMs = utcMs + toOff * 3600000;
      const diff = toOff - fromOff;

      return {
        output: [
          kv('Meeting time', `${fmtWall(wallMs)} ${zoneLabel(fromZone, fromOff)}`),
          '',
          bullet('Original', `${fmtWall(wallMs)} ${zoneLabel(fromZone, fromOff)}`),
          bullet('Converted', `${fmtWall(toWallMs)} ${zoneLabel(toZone, toOff)}`),
          bullet('Offset shift', diff === 0 ? 'same time (0 hours)' : `${diff > 0 ? '+' : ''}${fmtNum(diff, 2)} hours`),
          bullet('UTC reference', `${fmtWall(utcMs)} UTC`),
        ].join('\n'),
        note: 'Fixed standard offsets (no daylight-saving rules) — double-check around DST transitions.',
      };
    },
  },

  /* ── 8. unit-converter-length-weight ───────────────────────────────────── */
  {
    slug: 'unit-converter-length-weight',
    fields: [
      { name: 'value', label: 'Value to convert', type: 'number', default: 10 },
      selectField('category', 'Category', opts(
        ['Length', 'Length (m, km, ft, mi…)'],
        ['Weight', 'Weight (kg, lb, oz, t…)'],
        ['Data', 'Data (B, KB, MB, GB…)'],
      ), 'Length'),
      selectField('fromUnit', 'From unit', unitOptions(), 'm'),
      selectField('toUnit', 'To unit', unitOptions(), 'ft'),
    ],
    run: ({ values }) => {
      const value = num(values.value, 10);
      const from = str(values.fromUnit, 'm');
      const to = str(values.toUnit, 'ft');
      const f = UNITS[from];
      const t = UNITS[to];
      if (!f || !t) throw new Error('Unknown unit selected');
      if (f.category !== t.category) {
        throw new Error(`Cannot convert ${f.category} → ${t.category} — pick two units from the same category`);
      }

      const converted = (value * f.factor) / t.factor;

      return {
        output: [
          kv('Unit conversion', `${fmtNum(value, 6)} ${from} = ${fmtNum(converted, 8)} ${to}`),
          '',
          bullet('Conversion factor', `1 ${from} (${f.full}) = ${fmtNum(f.factor / t.factor, 8)} ${to}`),
          bullet('Reverse conversion', `1 ${to} (${t.full}) = ${fmtNum(t.factor / f.factor, 8)} ${from}`),
          bullet('Category', f.category),
        ].join('\n'),
        note: 'Data units use binary factors (1 KB = 1024 B), matching how operating systems report sizes.',
      };
    },
  },

  /* ── 9. ip-lookup-client-info ──────────────────────────────────────────── */
  {
    slug: 'ip-lookup-client-info',
    fields: [],
    run: (): ToolResult => {
      const nav = navigator as Navigator & {
        userAgentData?: { platform?: string };
        connection?: { effectiveType?: string; downlink?: number };
      };

      let timeZone = 'unknown';
      try {
        timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';
      } catch {
        /* Intl resolution unavailable — keep fallback */
      }

      let connection = 'unavailable';
      try {
        const c = nav.connection;
        if (c && c.effectiveType) {
          connection = c.downlink ? `${c.effectiveType} (~${c.downlink} Mbps downlink)` : c.effectiveType;
        }
      } catch {
        /* Network Information API unavailable — keep fallback */
      }

      const platform = nav.userAgentData?.platform || nav.platform || 'unknown';
      const languages =
        (nav.languages && nav.languages.length ? nav.languages.join(', ') : nav.language) || 'unknown';

      return {
        output: [
          kv('Client environment report', new Date().toLocaleString()),
          '',
          bullet('Public IP', '(visible via your network — not fetched for privacy)'),
          bullet('User agent', nav.userAgent),
          bullet('Languages', languages),
          bullet('Platform', platform),
          bullet('Cookies enabled', nav.cookieEnabled ? 'yes' : 'no'),
          bullet('Online status', nav.onLine ? 'online' : 'offline'),
          bullet('Screen resolution', `${screen.width} × ${screen.height} px (${screen.colorDepth}-bit color)`),
          bullet('Browser viewport', `${window.innerWidth} × ${window.innerHeight} px`),
          bullet('Device pixel ratio', String(window.devicePixelRatio || 1)),
          bullet('Time zone', timeZone),
          bullet('Connection', connection),
        ].join('\n'),
        note: 'Privacy-first: everything above is read locally in your browser — no external IP lookup APIs are called.',
      };
    },
  },

  /* ── 10. htpasswd-generator ────────────────────────────────────────────── */
  {
    slug: 'htpasswd-generator',
    fields: [
      { name: 'username', label: 'Username', type: 'text', default: 'admin', placeholder: 'admin' },
      { name: 'password', label: 'Password', type: 'text', default: 'S3cur3P@ss!', placeholder: 'Choose a strong password' },
      selectField('scheme', 'Hash scheme', opts(
        ['sha', '{SHA} SHA-1 Base64 (recommended)'],
        ['md5', 'crypt/MD5 (plain MD5)'],
        ['plain', 'Plain text (dev only)'],
      ), 'sha'),
    ],
    run: async ({ values }) => {
      const username = str(values.username, 'admin').trim() || 'admin';
      const password = str(values.password, '');
      if (!password) throw new Error('Enter a password');
      const scheme = str(values.scheme, 'sha');

      let line: string;
      let schemeLabel: string;
      let schemeNote: string;
      if (scheme === 'md5') {
        line = `${username}:${md5(password)}`;
        schemeLabel = 'crypt/MD5 (plain MD5 digest)';
        schemeNote = 'This emits a plain MD5 digest — Apache apr1 (htpasswd -m) is preferred in production.';
      } else if (scheme === 'plain') {
        line = `${username}:${password}`;
        schemeLabel = 'Plain text';
        schemeNote = 'Plain text is INSECURE — use only for throwaway local development.';
      } else {
        line = `${username}:{SHA}${await shaBase64('SHA-1', password)}`;
        schemeLabel = '{SHA} (SHA-1 digest, Base64)';
        schemeNote = 'Supported by Apache out of the box; works with Nginx basic-auth files too.';
      }

      return {
        output: [
          kv('Generating .htpasswd entry for user', username),
          '',
          line,
          '',
          bullet('Scheme', schemeLabel),
          bullet('Apache setup', 'AuthType Basic / AuthUserFile /path/to/.htpasswd / Require valid-user'),
          bullet('Storage tip', 'Store the file as .htpasswd outside the public web root'),
        ].join('\n'),
        note: schemeNote,
      };
    },
  },

  /* ── 11. sub-net-cidr-calculator ───────────────────────────────────────── */
  {
    slug: 'sub-net-cidr-calculator',
    fields: [
      { name: 'cidr', label: 'IPv4 CIDR', type: 'text', default: '192.168.1.0/24', placeholder: '192.168.1.0/24' },
    ],
    run: ({ values }) => {
      const raw = str(values.cidr, '').trim();
      const [ipStr, prefixStr] = raw.split('/');
      if (!ipStr || prefixStr === undefined || prefixStr === '') {
        throw new Error('Enter a CIDR like 192.168.1.0/24');
      }
      const prefix = Number(prefixStr);
      if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
        throw new Error('Prefix length must be an integer between 0 and 32');
      }

      const octets = ipStr.split('.');
      if (octets.length !== 4) throw new Error('IP must have 4 octets, e.g. 192.168.1.0/24');
      let ipInt = 0;
      for (const o of octets) {
        const v = Number(o);
        if (!/^\d{1,3}$/.test(o) || !Number.isInteger(v) || v < 0 || v > 255) {
          throw new Error(`Invalid octet "${o}" — each must be 0-255`);
        }
        ipInt = ((ipInt << 8) | v) >>> 0;
      }

      const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
      const wildcard = (~mask) >>> 0;
      const network = (ipInt & mask) >>> 0;
      const broadcast = (network | wildcard) >>> 0;
      const total = Math.pow(2, 32 - prefix);
      const usable = prefix === 32 ? 1 : prefix === 31 ? 2 : Math.max(0, total - 2);
      const firstHost = prefix >= 31 ? network : network + 1;
      const lastHost = prefix >= 31 ? broadcast : broadcast - 1;

      const intToIp = (i: number): string =>
        `${i >>> 24}.${(i >>> 16) & 255}.${(i >>> 8) & 255}.${i & 255}`;
      const toBinary = (i: number): string =>
        [24, 16, 8, 0].map((shift) => ((i >>> shift) & 255).toString(2).padStart(8, '0')).join('.');

      const oct1 = ipInt >>> 24;
      const secondOctet = (ipInt >>> 16) & 255;
      let ipClass: string;
      if (oct1 === 127) ipClass = 'A — loopback';
      else if (oct1 < 128) ipClass = 'A';
      else if (oct1 < 192) ipClass = 'B';
      else if (oct1 < 224) ipClass = 'C';
      else if (oct1 < 240) ipClass = 'D — multicast';
      else ipClass = 'E — experimental';
      const isPrivate =
        oct1 === 10 ||
        (oct1 === 172 && secondOctet >= 16 && secondOctet <= 31) ||
        (oct1 === 192 && secondOctet === 168);

      return {
        output: [
          kv('Subnet report for', `${intToIp(network)}/${prefix}`),
          '',
          bullet('Network address', intToIp(network)),
          bullet('Broadcast address', intToIp(broadcast)),
          bullet('Subnet mask', intToIp(mask)),
          bullet('Binary mask', toBinary(mask)),
          bullet('Wildcard mask', intToIp(wildcard)),
          bullet('First usable host', intToIp(firstHost)),
          bullet('Last usable host', intToIp(lastHost)),
          bullet('Total addresses', fmtNum(total)),
          bullet('Usable hosts', fmtNum(usable)),
          bullet('IP class', `${ipClass} — ${isPrivate ? 'private range' : 'public range'}`),
        ].join('\n'),
        note: 'Bit math runs on unsigned 32-bit integers (>>>) — exact for any IPv4 CIDR including /31 and /32.',
      };
    },
  },

  /* ── 12. screen-resolution-tester ──────────────────────────────────────── */
  {
    slug: 'screen-resolution-tester',
    fields: [],
    run: (): ToolResult => {
      const dpr = window.devicePixelRatio || 1;
      const width = screen.width;
      const orientation = width >= screen.height ? 'landscape' : 'portrait';
      const effectiveW = Math.round(window.innerWidth * dpr);
      const effectiveH = Math.round(window.innerHeight * dpr);

      return {
        output: [
          kv('Screen & viewport report', new Date().toLocaleTimeString()),
          '',
          bullet('Screen resolution', `${width} × ${screen.height} px`),
          bullet('Available screen area', `${screen.availWidth} × ${screen.availHeight} px (minus taskbar/dock)`),
          bullet('Browser viewport', `${window.innerWidth} × ${window.innerHeight} px`),
          bullet('Device pixel ratio', fmtNum(dpr, 2)),
          bullet('Effective resolution (viewport × DPR)', `${effectiveW} × ${effectiveH} px`),
          bullet('Orientation', `${orientation} (from screen dimensions)`),
          bullet('Color depth', `${screen.colorDepth}-bit`),
          bullet('window.devicePixelRatio', 'reflects display scaling AND browser zoom'),
          bullet('HD READY (≥ 1920 px wide)', width >= 1920 ? 'yes' : 'no'),
          bullet('QHD class (≥ 2560 px wide)', width >= 2560 ? 'yes' : 'no'),
          bullet('4K class (≥ 3840 px wide)', width >= 3840 ? 'yes' : 'no'),
        ].join('\n'),
        note: 'Resize the browser window or zoom and run again — values are read live from the DOM.',
      };
    },
  },

  /* ── 13. my-browser-storage-cleared ────────────────────────────────────── */
  {
    slug: 'my-browser-storage-cleared',
    fields: [],
    run: async (): Promise<ToolResult> => {
      let lsCount = 0;
      let lsChars = 0;
      let top: { key: string; size: number }[] = [];
      let lsBlocked = false;
      try {
        lsCount = localStorage.length;
        for (let i = 0; i < lsCount; i++) {
          const key = localStorage.key(i);
          if (key === null) continue;
          const size = key.length + (localStorage.getItem(key) || '').length;
          lsChars += size;
          top.push({ key, size });
        }
        top.sort((a, b) => b.size - a.size);
        top = top.slice(0, 5);
      } catch {
        lsBlocked = true; // e.g. cookies/storage disabled in this browsing context
      }

      let ssCount = 0;
      try {
        ssCount = sessionStorage.length;
      } catch {
        /* sessionStorage blocked — report 0 */
      }

      let quota = 'unavailable in this browser';
      try {
        const est = await navigator.storage?.estimate();
        if (est && typeof est.quota === 'number') {
          quota = `${formatBytes(est.usage ?? 0)} used of ${formatBytes(est.quota)} quota`;
        }
      } catch {
        /* Storage Quota API unsupported — keep fallback */
      }

      const lines: string[] = [
        kv('Browser storage inspection', new Date().toLocaleString()),
        '',
        lsBlocked ? bullet('localStorage', 'blocked in this context') : bullet('localStorage keys', String(lsCount)),
      ];
      if (!lsBlocked) {
        lines.push(bullet('localStorage total size', `${fmtNum(lsChars)} chars (≈ ${formatBytes(lsChars)})`));
        if (top.length === 0) {
          lines.push(bullet('Top 5 keys by size', '(empty)'));
        } else {
          top.forEach((entry, idx) =>
            lines.push(bullet(`#${idx + 1} ${entry.key}`, `${fmtNum(entry.size)} chars (≈ ${formatBytes(entry.size)})`)),
          );
        }
      }
      lines.push(
        bullet('sessionStorage keys', String(ssCount)),
        bullet('Cookies enabled', navigator.cookieEnabled ? 'yes' : 'no'),
        bullet('Storage quota estimate', quota),
      );

      return {
        output: lines.join('\n'),
        note: 'This tool only INSPECTS storage; nothing is modified or cleared.',
      };
    },
  },

  /* ── 14. csp-header-generator ──────────────────────────────────────────── */
  {
    slug: 'csp-header-generator',
    fields: [
      { name: 'cspDefaultSelf', label: "default-src 'self'", type: 'checkbox', default: true, hint: 'Fallback policy for every resource type' },
      { name: 'cspInlineScripts', label: "Allow inline scripts ('unsafe-inline' in script-src)", type: 'checkbox', default: false, hint: 'Needed for inline <script> and event handlers — weaker protection' },
      { name: 'cspInlineStyles', label: "Allow inline styles ('unsafe-inline' in style-src)", type: 'checkbox', default: true, hint: 'Needed for inline <style> and style="" attributes' },
      { name: 'cspImagesAny', label: 'Allow images from any source (data: https:)', type: 'checkbox', default: true },
      { name: 'cspGoogleFonts', label: 'Allow Google Fonts (fonts.googleapis.com / fonts.gstatic.com)', type: 'checkbox', default: true },
      { name: 'cspAnalytics', label: 'Analytics script domain', type: 'text', default: '', placeholder: 'e.g. www.googletagmanager.com', hint: 'Added to script-src and connect-src' },
      { name: 'cspReportOnly', label: 'Generate Report-Only header (monitor without blocking)', type: 'checkbox', default: false },
      { name: 'cspReportUri', label: 'Violation report URI (optional)', type: 'text', default: '', placeholder: '/csp-violation-reports' },
    ],
    run: ({ values }) => {
      const analytics = str(values.cspAnalytics, '').trim().toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/\/.*$/, '');
      const reportUri = str(values.cspReportUri, '').trim();
      const reportOnly = bool(values.cspReportOnly, false);
      const inlineScripts = bool(values.cspInlineScripts, false);
      const inlineStyles = bool(values.cspInlineStyles, true);
      const imagesAny = bool(values.cspImagesAny, true);
      const googleFonts = bool(values.cspGoogleFonts, true);

      type Directive = { name: string; value: string; why: string };
      const directives: Directive[] = [];

      if (bool(values.cspDefaultSelf, true)) {
        directives.push({
          name: 'default-src',
          value: "'self'",
          why: 'Fallback policy for all resource types not listed explicitly',
        });
      }

      const scriptSources = ["'self'"];
      if (inlineScripts) scriptSources.push("'unsafe-inline'");
      if (analytics) scriptSources.push(`https://${analytics}`);
      directives.push({ name: 'script-src', value: scriptSources.join(' '), why: 'Controls which scripts the browser may execute' });

      const styleSources = ["'self'"];
      if (inlineStyles) styleSources.push("'unsafe-inline'");
      if (googleFonts) styleSources.push('https://fonts.googleapis.com');
      directives.push({ name: 'style-src', value: styleSources.join(' '), why: 'Controls stylesheets and inline style attributes' });

      directives.push({
        name: 'img-src',
        value: imagesAny ? "'self' data: https:" : "'self'",
        why: imagesAny ? 'Controls image sources (data URIs and any HTTPS host)' : 'Controls image sources (same origin only)',
      });

      if (googleFonts) {
        directives.push({ name: 'font-src', value: "'self' https://fonts.gstatic.com", why: 'Controls web font sources' });
      }

      const connectSources = ["'self'"];
      if (analytics) connectSources.push(`https://${analytics}`);
      directives.push({ name: 'connect-src', value: connectSources.join(' '), why: 'Controls fetch / XHR / WebSocket endpoints' });

      directives.push({ name: 'frame-ancestors', value: "'none'", why: 'Blocks embedding in iframes — clickjacking protection' });
      directives.push({ name: 'base-uri', value: "'self'", why: "Restricts <base href> to the same origin" });
      directives.push({ name: 'form-action', value: "'self'", why: 'Restricts where HTML forms may submit' });
      directives.push({ name: 'upgrade-insecure-requests', value: '', why: 'Automatically upgrades http:// requests to https://' });
      if (reportUri) {
        directives.push({ name: 'report-uri', value: reportUri, why: 'Browsers POST violation reports to this endpoint' });
      }

      const headerValue = directives.map((d) => (d.value ? `${d.name} ${d.value}` : d.name)).join('; ');
      const headerName = reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';

      return {
        output: [
          kv('Generated CSP header', reportOnly ? 'Report-Only mode (monitoring)' : 'Enforcing mode'),
          '',
          `${headerName}: ${headerValue}`,
          '',
          ...directives.map((d) => bullet(d.value ? `${d.name} ${d.value}` : d.name, d.why)),
        ].join('\n'),
        note: 'Deploy in Report-Only mode first and watch the browser console for a few days before enforcing.',
      };
    },
  },
];
