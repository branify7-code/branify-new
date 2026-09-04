// Developer Tools (15) — encoders, formatters, parsers, converters.
import type { ToolDefinition, ToolResult } from './types';
import { num, str, bool } from './types';
import { kv, bullet, md5, shaHex } from './helpers';

const b64encode = (s: string): string => {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
};

const b64decode = (s: string): string => {
  const bin = atob(s.replace(/\s+/g, ''));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const escapeHtmlLocal = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export const devTools: ToolDefinition[] = [
  {
    slug: 'json-formatter-dev',
    fields: [
      { name: 'input', label: 'Raw JSON', type: 'textarea', rows: 10, default: '{"name":"BRANIFY","tools":100,"categories":["pdf","image","text"],"pro":false}', placeholder: '{"name":"BRANIFY","tools":100}' },
      { name: 'indent', label: 'Indentation', type: 'select', default: '2', options: [
        { value: '2', label: '2 spaces (standard)' },
        { value: '4', label: '4 spaces' },
      ] },
    ],
    run: (ctx) => {
      const raw = str(ctx.values.input).trim();
      if (!raw) throw new Error('Paste JSON first.');
      try {
        const parsed = JSON.parse(raw) as unknown;
        const pretty = JSON.stringify(parsed, null, Number(str(ctx.values.indent, '2')));
        const stats = ((): { keys: number; depth: number; nodes: number } => {
          let keys = 0, depth = 0, maxDepth = 0, nodes = 0;
          const walk = (v: unknown, d: number) => {
            nodes++;
            depth = Math.max(depth, d);
            maxDepth = Math.max(maxDepth, d);
            if (Array.isArray(v)) v.forEach((x) => walk(x, d + 1));
            else if (v && typeof v === 'object') {
              for (const [, val] of Object.entries(v as Record<string, unknown>)) { keys++; walk(val, d + 1); }
            }
          };
          walk(parsed, 0);
          return { keys, depth: maxDepth, nodes };
        })();
        return {
          output: pretty,
          json: parsed,
          note: `Valid JSON ✓ — ${stats.nodes} nodes, ${stats.keys} keys, max depth ${stats.depth}.`,
        };
      } catch (e) {
        const msg = (e as Error).message;
        const posMatch = msg.match(/position (\d+)/);
        const ctx2 = posMatch ? ` near: …${raw.substring(Math.max(0, Number(posMatch[1]) - 20), Number(posMatch[1]) + 20)}…` : '';
        throw new Error(`Invalid JSON — ${msg}${ctx2}`);
      }
    },
  },
  {
    slug: 'json-minifier',
    fields: [
      { name: 'input', label: 'Formatted JSON', type: 'textarea', rows: 10, default: '{\n  "name": "BRANIFY",\n  "tools": 100,\n  "tags": [\n    "pdf",\n    "image",\n    "text"\n  ]\n}', placeholder: 'Paste formatted JSON…' },
    ],
    run: (ctx) => {
      const raw = str(ctx.values.input).trim();
      if (!raw) throw new Error('Paste JSON first.');
      const parsed = JSON.parse(raw) as unknown; // throws with message on invalid
      const min = JSON.stringify(parsed);
      return {
        output: min,
        note: `Minified ${raw.length.toLocaleString()} → ${min.length.toLocaleString()} chars (${(((raw.length - min.length) / raw.length) * 100).toFixed(1)}% smaller).`,
      };
    },
  },
  {
    slug: 'base64-encoder-decoder',
    fields: [
      { name: 'input', label: 'Text or Base64', type: 'textarea', rows: 7, default: 'Build. Brand. Grow. — BRANIFY', placeholder: 'Type plain text to encode OR paste Base64 to decode…' },
      { name: 'mode', label: 'Operation', type: 'select', default: 'auto', options: [
        { value: 'auto', label: 'Auto-detect' },
        { value: 'encode', label: 'Force Encode' },
        { value: 'decode', label: 'Force Decode' },
      ] },
    ],
    run: (ctx) => {
      const t = str(ctx.values.input);
      if (!t.trim()) throw new Error('Enter some text or Base64 first.');
      const mode = str(ctx.values.mode, 'auto');
      const looksB64 = /^[A-Za-z0-9+/=\s]+$/.test(t) && t.replace(/\s+/g, '').length % 4 === 0 && t.replace(/\s+/g, '').length > 3;
      let result: string, direction: string;
      if (mode === 'encode' || (mode === 'auto' && !looksB64)) {
        result = b64encode(t);
        direction = 'ENCODED';
      } else {
        try {
          result = b64decode(t);
          direction = 'DECODED';
        } catch {
          throw new Error('This is not valid Base64 — check padding and character set.');
        }
      }
      return {
        output: [
          result,
          '',
          bullet('Operation', direction),
          bullet('Input length', `${t.length} chars → output ${result.length} chars`),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'url-encoder-decoder',
    fields: [
      { name: 'input', label: 'URL / Text', type: 'textarea', rows: 6, default: 'https://branify.store/search?q=brand strategy & design', placeholder: 'https://example.com/search?q=…' },
      { name: 'mode', label: 'Operation', type: 'select', default: 'encode', options: [
        { value: 'encode', label: 'Encode (percent-encoding)' },
        { value: 'decode', label: 'Decode' },
        { value: 'encode-component', label: 'Encode Component (encodeURIComponent)' },
      ] },
    ],
    run: (ctx) => {
      const t = str(ctx.values.input);
      if (!t.trim()) throw new Error('Enter a URL or text first.');
      const mode = str(ctx.values.mode, 'encode');
      let result: string;
      if (mode === 'decode') {
        result = decodeURIComponent(t.replace(/\+/g, ' '));
      } else if (mode === 'encode-component') {
        result = encodeURIComponent(t);
      } else {
        // Full URI encode: keeps reserved chars like :/?#[]@ and encodes spaces etc.
        result = encodeURI(t).replace(/#/g, '%23');
      }
      return {
        output: [
          result,
          '',
          bullet('Operation', mode),
          bullet('Length change', `${t.length} → ${result.length} chars`),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'uuid-generator',
    fields: [
      { name: 'count', label: 'How many UUIDs', type: 'number', default: 5, min: 1, max: 100, step: 1 },
      { name: 'case', label: 'Case', type: 'select', default: 'lower', options: [
        { value: 'lower', label: 'lowercase' },
        { value: 'upper', label: 'UPPERCASE' },
      ] },
      { name: 'braces', label: 'Wrap in braces {}', type: 'checkbox', default: false },
    ],
    run: (ctx) => {
      const count = Math.min(100, Math.max(1, Math.round(num(ctx.values.count, 5))));
      const upper = str(ctx.values.case, 'lower') === 'upper';
      const braces = bool(ctx.values.braces, false);
      const uuids: string[] = [];
      for (let i = 0; i < count; i++) {
        if (typeof crypto.randomUUID === 'function') {
          uuids.push(crypto.randomUUID());
        } else {
          const b = crypto.getRandomValues(new Uint8Array(16));
          b[6] = (b[6] & 0x0f) | 0x40;
          b[8] = (b[8] & 0x3f) | 0x80;
          const hex = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
          uuids.push(`${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`);
        }
      }
      const formatted = uuids.map((u) => (upper ? u.toUpperCase() : u));
      const lines = formatted.map((u) => (braces ? `{${u}}` : u));
      return {
        output: lines.join('\n'),
        note: `${count} cryptographically-secure RFC 4122 v4 UUID(s) generated via crypto.randomUUID().`,
      };
    },
  },
  {
    slug: 'html-entity-encoder',
    fields: [
      { name: 'input', label: 'HTML / Text', type: 'textarea', rows: 7, default: '<div class="hero">Hello "World" & <Friends></div>', placeholder: '<div>Hello "World" & <Friends></div>' },
      { name: 'mode', label: 'Operation', type: 'select', default: 'encode', options: [
        { value: 'encode', label: 'Encode (escape)' },
        { value: 'decode', label: 'Decode (unescape)' },
      ] },
    ],
    run: (ctx) => {
      const t = str(ctx.values.input);
      if (str(ctx.values.mode, 'encode') === 'decode') {
        const el = document.createElement('textarea');
        el.innerHTML = t;
        return { output: el.value, note: 'HTML entities decoded.' };
      }
      return {
        output: escapeHtmlLocal(t),
        note: `Escaped ${((t.match(/[&<>"']/g) || []).length)} special characters.`,
      };
    },
  },
  {
    slug: 'css-minifier',
    fields: [
      { name: 'input', label: 'CSS', type: 'textarea', rows: 10, default: '/* Brand button styles */\n.btn {\n  color: #f27d26;\n  margin: 0px auto;\n  padding: 12px 24px;   /* generous tap target */\n}\n\n.btn:hover {\n  color: #ffffff;\n}', placeholder: 'Paste CSS…' },
      { name: 'aggressive', label: 'Aggressive (strip last semicolons + 0 units)', type: 'checkbox', default: true },
    ],
    run: (ctx) => {
      const t = str(ctx.values.input);
      if (!t.trim()) throw new Error('Paste CSS first.');
      let css = t
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([{}:;,>~+])\s*/g, '$1')
        .replace(/;}/g, '}')
        .trim();
      if (bool(ctx.values.aggressive, true)) {
        css = css
          .replace(/([\s:,(])0(px|em|rem|%|pt)/g, '$10')
          .replace(/([:])0(px|em|rem|%|pt)/g, '$10')
          .replace(/#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3\b/g, '#$1$2$3');
      }
      const before = t.length, after = css.length;
      return {
        output: css,
        note: `Minified ${before.toLocaleString()} → ${after.toLocaleString()} chars (${(100 - (after / before) * 100).toFixed(1)}% smaller). Comments, whitespace and redundant semicolons removed.`,
      };
    },
  },
  {
    slug: 'js-minifier-helper',
    fields: [
      { name: 'input', label: 'JavaScript', type: 'textarea', rows: 10, default: '// Greeting helper\nfunction hello(name) {\n  const message = "Hello, " + name + "!";\n  console.log(message);\n  return message;\n}', placeholder: 'Paste JS…' },
      { name: 'stripComments', label: 'Strip comments', type: 'checkbox', default: true },
      { name: 'collapseWhitespace', label: 'Collapse line breaks & indent', type: 'checkbox', default: true },
    ],
    run: (ctx) => {
      let js = str(ctx.values.input);
      const before = js.length;
      if (bool(ctx.values.stripComments, true)) {
        js = js.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/([^:'"\\])\/\/.*$/gm, '$1');
      }
      if (bool(ctx.values.collapseWhitespace, true)) {
        js = js.split('\n').map((l) => l.trim()).filter(Boolean).join('\n').replace(/\n{2,}/g, '\n');
      }
      return {
        output: js.trim(),
        note: `Cleaned ${before.toLocaleString()} → ${js.trim().length.toLocaleString()} chars. NOTE: helper-level cleaning — for production bundles use Terser/esbuild.`,
      };
    },
  },
  {
    slug: 'hash-generator-md5-sha256',
    fields: [
      { name: 'input', label: 'Text payload', type: 'textarea', rows: 6, default: 'BRANIFY integrity check', placeholder: 'Enter text payload to hash…' },
      { name: 'algorithms', label: 'Algorithms', type: 'select', default: 'all', options: [
        { value: 'all', label: 'All (MD5, SHA-1, SHA-256, SHA-384, SHA-512)' },
        { value: 'md5', label: 'MD5 only' },
        { value: 'sha256', label: 'SHA-256 only' },
      ] },
    ],
    run: async (ctx) => {
      const t = str(ctx.values.input);
      if (!t) throw new Error('Enter a payload to hash.');
      const algo = str(ctx.values.algorithms, 'all');
      const lines: string[] = [];
      if (algo === 'all' || algo === 'md5') lines.push(`MD5:      ${md5(t)}`);
      if (algo === 'all') lines.push(`SHA-1:    ${await shaHex('SHA-1', t)}`);
      if (algo === 'all' || algo === 'sha256') lines.push(`SHA-256:  ${await shaHex('SHA-256', t)}`);
      if (algo === 'all') {
        lines.push(`SHA-384:  ${await shaHex('SHA-384', t)}`);
        lines.push(`SHA-512:  ${await shaHex('SHA-512', t)}`);
      }
      return {
        output: lines.join('\n'),
        note: `${t.length} chars → hashes computed locally. MD5 is cryptographically broken; use SHA-256+ for security purposes.`,
      };
    },
  },
  {
    slug: 'jwt-decoder-inspector',
    fields: [
      { name: 'token', label: 'JWT Token', type: 'textarea', rows: 6, default: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJicmFuaWZ5LTAwMSIsIm5hbWUiOiJCUkFOSUZZIEFkbWluIiwicm9sZSI6Im93bmVyIiwiaWF0IjoxNzY3MjI1NjAwfQ.tXLTNBJiLlN8sFpHfoLCz5J4OiGvPu1yb9MmUmDJWcU', placeholder: 'Paste eyJhbGciOi… token here' },
    ],
    run: (ctx) => {
      const token = str(ctx.values.token).trim().replace(/^Bearer\s+/i, '');
      const parts = token.split('.');
      if (parts.length < 2) throw new Error('Not a JWT — expected header.payload.signature (at least 2 dot-separated Base64URL parts).');
      const b64url = (s: string) => b64decode(s.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (s.length % 4)) % 4));
      let header: Record<string, unknown>, payload: Record<string, unknown>;
      try {
        header = JSON.parse(b64url(parts[0]));
        payload = JSON.parse(b64url(parts[1]));
      } catch {
        throw new Error('Could not decode the token segments — this is not valid Base64URL-encoded JSON.');
      }
      const lines: string[] = [
        'HEADER',
        JSON.stringify(header, null, 2),
        '',
        'PAYLOAD',
        JSON.stringify(payload, null, 2),
        '',
        'CLAIMS ANALYSIS',
      ];
      const now = Math.floor(Date.now() / 1000);
      const fmt = (ts: unknown) => (typeof ts === 'number' ? new Date(ts * 1000).toISOString() : '—');
      if (typeof payload.exp === 'number') {
        lines.push(bullet('Expires (exp)', `${fmt(payload.exp)} — ${payload.exp > now ? 'VALID for another ' + Math.round((payload.exp - now) / 60) + ' min' : 'EXPIRED ' + Math.round((now - payload.exp) / 60) + ' min ago'}`));
      }
      if (typeof payload.iat === 'number') lines.push(bullet('Issued at (iat)', fmt(payload.iat)));
      if (typeof payload.nbf === 'number') lines.push(bullet('Not before (nbf)', fmt(payload.nbf)));
      lines.push(bullet('Subject (sub)', String(payload.sub || '—')));
      lines.push(bullet('Signature', parts[2] ? `${parts[2].length} chars — NOT verified (no secret provided; decoding only)` : 'MISSING'));
      return {
        output: lines.join('\n'),
        json: { header, payload, signaturePresent: !!parts[2] },
        note: 'Decoded locally — your token never leaves the browser and no secret key is required.',
      };
    },
  },
  {
    slug: 'sql-query-formatter',
    fields: [
      { name: 'input', label: 'SQL Query', type: 'textarea', rows: 8, default: 'SELECT id, name, email, created_at FROM users WHERE active = 1 AND plan <> "free" ORDER BY created_at DESC LIMIT 50', placeholder: 'SELECT id, name FROM users…' },
      { name: 'indent', label: 'Indent', type: 'select', default: '4', options: [
        { value: '2', label: '2 spaces' },
        { value: '4', label: '4 spaces' },
        { value: 'tab', label: 'Tab' },
      ] },
    ],
    run: (ctx) => {
      const sql = str(ctx.values.input).replace(/\s+/g, ' ').trim();
      if (!sql) throw new Error('Paste a SQL query first.');
      const ind = str(ctx.values.indent, '4');
      const pad = ind === 'tab' ? '\t' : ' '.repeat(Number(ind));
      const majorKeywords = ['FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'OFFSET', 'UNION ALL', 'UNION', 'VALUES', 'SET'];
      const clauses: string[] = [];
      const upper = sql;
      // Find clause boundaries for SELECT/INSERT/UPDATE/DELETE style
      let selectPart = '';
      const firstKw = /^(SELECT|INSERT INTO|UPDATE|DELETE FROM)\b/i.exec(upper);
      let rest = sql;
      if (firstKw) {
        selectPart = firstKw[0].toUpperCase();
        rest = sql.slice(firstKw[0].length);
      }
      // split rest by major keywords
      const re = new RegExp(`\\b(${majorKeywords.join('|')})\\b`, 'gi');
      const parts: { kw: string; text: string }[] = [];
      let lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(rest))) {
        if (m.index > lastIndex) parts.push({ kw: '', text: rest.slice(lastIndex, m.index).trim() });
        parts.push({ kw: m[1].toUpperCase(), text: '' });
        lastIndex = m.index + m[1].length;
      }
      parts.push({ kw: '', text: rest.slice(lastIndex).trim() });
      let current = '';
      for (const p of parts) {
        if (p.kw) {
          if (current.trim()) clauses.push(current.trim());
          current = p.kw + ' ';
        } else {
          current += p.text + ' ';
        }
      }
      if (current.trim()) clauses.push(current.trim());
      // format SELECT columns one per line if many
      const formatted: string[] = [];
      clauses.forEach((c, i) => {
        if (i === 0 && selectPart) {
          const body = c.replace(new RegExp(`^${selectPart}\\s*`, 'i'), '');
          const cols = body.split(',').map((s) => s.trim());
          if (cols.length > 3 && !body.includes('*')) {
            formatted.push(selectPart);
            formatted.push(cols.map((col) => `${pad}${col},`.replace(/,$/, cols.length ? ',' : '')).join('\n').replace(/,$/, ''));
          } else {
            formatted.push(`${selectPart} ${body}`);
          }
        } else {
          formatted.push(c);
        }
      });
      const output = formatted.join('\n') + (/[;]\s*$/.test(sql) ? '' : '');
      return {
        output,
        note: `Beautified into ${formatted.length} clauses. Keywords: ${(upper.match(re) || []).length + (firstKw ? 1 : 0)}.`,
      };
    },
  },
  {
    slug: 'curl-to-fetch-converter',
    fields: [
      { name: 'input', label: 'cURL Command', type: 'textarea', rows: 7, default: 'curl -X POST https://api.branify.store/v1/tools -H "Content-Type: application/json" -H "Authorization: Bearer sk_live_9x4k" -d \'{"tool":"qr","size":250}\'', placeholder: 'curl -X POST https://api… -H "…"' },
    ],
    run: (ctx) => {
      const cmd = str(ctx.values.input).trim();
      if (!cmd) throw new Error('Paste a cURL command first.');
      // tokenize respecting quotes
      const tokens: string[] = [];
      let cur = '', quote: string | null = null;
      for (let i = 0; i < cmd.length; i++) {
        const ch = cmd[i];
        if (quote) {
          if (ch === quote) quote = null;
          else cur += ch;
        } else if (ch === '"' || ch === "'") {
          quote = ch;
        } else if (ch === ' ' && cmd[i - 1] !== '\\') {
          if (cur) tokens.push(cur);
          cur = '';
        } else cur += ch;
      }
      if (cur) tokens.push(cur);
      let url = '', method = 'GET', body = '', auth = '';
      const headers: Record<string, string> = {};
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (t === 'curl' || t === '\\') continue;
        if (t === '-X' || t === '--request') method = (tokens[++i] || 'GET').toUpperCase();
        else if (t === '-H' || t === '--header') {
          const h = tokens[++i] || '';
          const idx = h.indexOf(':');
          if (idx > 0) {
            const k = h.slice(0, idx).trim();
            const v = h.slice(idx + 1).trim();
            if (/^authorization$/i.test(k)) auth = v;
            else headers[k] = v;
          }
        } else if (t === '-d' || t === '--data' || t === '--data-raw' || t === '--data-ascii') {
          body = tokens[++i] || '';
          if (method === 'GET') method = 'POST';
        } else if (t === '-u' || t === '--user') {
          auth = `Basic ${b64encode(tokens[++i] || '')}`;
        } else if (!t.startsWith('-') && !url) {
          url = t.replace(/^["']|["']$/g, '');
        }
      }
      if (!url) throw new Error('No URL found in the cURL command.');
      const allHeaders: Record<string, string> = { ...headers };
      if (auth) allHeaders['Authorization'] = auth;
      const headerLines = Object.entries(allHeaders)
        .map(([k, v]) => `    "${k}": "${v}",`)
        .join('\n');
      const fetchCode = [
        `const response = await fetch("${url}", {`,
        `  method: "${method}",`,
        allHeaders && Object.keys(allHeaders).length ? `  headers: {\n${headerLines.replace(/,$/, '')}\n  },` : null,
        body ? `  body: ${/^[\[{]/.test(body) ? `JSON.stringify(${body})` : `"${body}"`},` : null,
        `});`,
        ``,
        `const data = await response.json();`,
        `console.log(data);`,
      ].filter((l) => l !== null).join('\n');
      return {
        output: fetchCode,
        note: `Converted: ${method} ${url} — ${Object.keys(allHeaders).length} header(s)${body ? ', JSON body' : ''}.`,
      };
    },
  },
  {
    slug: 'color-hex-rgb-converter',
    fields: [
      { name: 'color', label: 'Color (HEX / RGB / name)', type: 'text', default: '#F27D26', placeholder: '#F27D26 or rgb(242,125,38)' },
      { name: 'tailwind', label: 'Suggest nearest Tailwind class', type: 'checkbox', default: true },
    ],
    run: (ctx) => {
      const input = str(ctx.values.color, '#F27D26').trim();
      let r = 0, g = 0, b = 0;
      const hexMatch = input.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
      const rgbMatch = input.match(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i);
      if (hexMatch) {
        let h = hexMatch[1];
        if (h.length === 3) h = h.split('').map((c) => c + c).join('');
        r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16);
      } else if (rgbMatch) {
        r = Number(rgbMatch[1]); g = Number(rgbMatch[2]); b = Number(rgbMatch[3]);
      } else {
        // named colors probe
        const el = document.createElement('div');
        el.style.color = input;
        document.body.appendChild(el);
        const computed = getComputedStyle(el).color;
        el.remove();
        const m = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!m) throw new Error(`Could not parse "${input}" as HEX, RGB or a CSS color name.`);
        r = Number(m[1]); g = Number(m[2]); b = Number(m[3]);
      }
      if (r > 255 || g > 255 || b > 255) throw new Error('RGB channels must be 0-255.');
      const hex = (v: number) => v.toString(16).padStart(2, '0').toUpperCase();
      const hexVal = `#${hex(r)}${hex(g)}${hex(b)}`;
      const [h, s, l] = ((): [number, number, number] => {
        const rn = r / 255, gn = g / 255, bn = b / 255;
        const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
        let hh = 0;
        const ll = (max + min) / 2;
        const dd = max - min;
        const ss = dd === 0 ? 0 : dd / (1 - Math.abs(2 * ll - 1));
        if (dd !== 0) {
          if (max === rn) hh = ((gn - bn) / dd) % 6;
          else if (max === gn) hh = (bn - rn) / dd + 2;
          else hh = (rn - gn) / dd + 4;
          hh *= 60;
          if (hh < 0) hh += 360;
        }
        return [Math.round(hh), Math.round(ss * 100), Math.round(ll * 100)];
      })();
      const lines = [
        kv('HEX', hexVal),
        kv('RGB', `rgb(${r}, ${g}, ${b})`),
        kv('RGBA', `rgba(${r}, ${g}, ${b}, 1.0)`),
        kv('HSL', `hsl(${h}, ${s}%, ${l}%)`),
        '',
        bullet('Luminance', ((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255).toFixed(3)),
        bullet('Best text color on top', 0.2126 * r + 0.7152 * g + 0.0722 * b > 150 ? '#000000 (dark text)' : '#FFFFFF (light text)'),
      ];
      if (bool(ctx.values.tailwind, true)) {
        const tw: [string, string][] = [
          ['bg-slate-500', 'rgb(100, 116, 139)'], ['bg-red-500', 'rgb(239, 68, 68)'], ['bg-orange-500', 'rgb(249, 115, 22)'],
          ['bg-amber-500', 'rgb(245, 158, 11)'], ['bg-yellow-500', 'rgb(234, 179, 8)'], ['bg-lime-500', 'rgb(132, 204, 22)'],
          ['bg-green-500', 'rgb(34, 197, 94)'], ['bg-emerald-500', 'rgb(16, 185, 129)'], ['bg-teal-500', 'rgb(20, 184, 166)'],
          ['bg-cyan-500', 'rgb(6, 182, 212)'], ['bg-sky-500', 'rgb(14, 165, 233)'], ['bg-blue-500', 'rgb(59, 130, 246)'],
          ['bg-indigo-500', 'rgb(99, 102, 241)'], ['bg-violet-500', 'rgb(139, 92, 246)'], ['bg-purple-500', 'rgb(168, 85, 247)'],
          ['bg-fuchsia-500', 'rgb(217, 70, 239)'], ['bg-pink-500', 'rgb(236, 72, 153)'], ['bg-rose-500', 'rgb(244, 63, 94)'],
        ];
        let best = tw[0], bestD = Infinity;
        for (const t of tw) {
          const m = t[1].match(/(\d+), (\d+), (\d+)/)!;
          const d = (r - +m[1]) ** 2 + (g - +m[2]) ** 2 + (b - +m[3]) ** 2;
          if (d < bestD) { bestD = d; best = t; }
        }
        lines.push(bullet('Nearest Tailwind class', `${best[0]}  (${best[1]})`));
      }
      return { output: lines.join('\n'), json: { hex: hexVal, rgb: [r, g, b], hsl: [h, s, l] } };
    },
  },
  {
    slug: 'cron-expression-explainer',
    fields: [
      { name: 'expression', label: 'Cron Expression (5 fields)', type: 'text', default: '*/15 * * * *', placeholder: '*/15 * * * *' },
    ],
    run: (ctx) => {
      const expr = str(ctx.values.expression).trim().replace(/\s+/g, ' ');
      if (!expr) throw new Error('Enter a cron expression first.');
      const fields = expr.split(' ');
      if (fields.length !== 5) throw new Error(`Expected 5 space-separated fields (minute hour day month weekday) — got ${fields.length}.`);
      const names: Record<number, string> = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday' };
      const monthNames: Record<number, string> = { 1: 'January', 2: 'February', 3: 'March', 4: 'April', 5: 'May', 6: 'June', 7: 'July', 8: 'August', 9: 'September', 10: 'October', 11: 'November', 12: 'December' };
      const describe = (f: string, unit: string, label: (n: number) => string): string => {
        if (f === '*') return `every ${unit}`;
        if (f.startsWith('*/')) return `every ${f.slice(2)} ${unit}s`;
        if (f.includes('-')) {
          const [a, b] = f.split('-');
          return `${unit}s ${a} through ${b}`;
        }
        if (f.includes(',')) {
          const items = f.split(',').map(Number).filter((n) => !Number.isNaN(n)).map(label);
          return `${unit}s ${items.join(', ')}`;
        }
        const n = Number(f);
        if (Number.isNaN(n)) return `${unit}: "${f}" (unrecognized)`;
        return label(n);
      };
      const [min, hour, dom, mon, dow] = fields;
      const parts = [
        describe(min, 'minute', (n) => `at minute ${n}`),
        describe(hour, 'hour', (n) => (n === 0 ? 'midnight' : n === 12 ? 'noon' : `hour ${n}`)),
        describe(dom, 'day-of-month', (n) => `day ${n} of the month`),
        describe(mon, 'month', (n) => monthNames[n] || `month ${n}`),
        describe(dow, 'day-of-week', (n) => names[n] || `weekday ${n}`),
      ];
      const isWild = fields.filter((f) => f === '*').length;
      let summary: string;
      if (isWild === 5) summary = 'Runs EVERY MINUTE (all fields wildcards).';
      else if (min.startsWith('*/') && isWild === 4) summary = `Runs every ${min.slice(2)} minutes, around the clock.`;
      else if (/^\d+$/.test(min) && /^\d+$/.test(hour) && isWild === 3) summary = `Runs once a day at ${String(Number(hour)).padStart(2, '0')}:${String(Number(min)).padStart(2, '0')}.`;
      else summary = 'Custom schedule — see the breakdown below.';
      const nextGuess = (() => {
        if (/^\d+$/.test(min) && /^\d+$/.test(hour) && isWild === 3) {
          const now = new Date();
          const next = new Date();
          next.setHours(Number(hour), Number(min), 0, 0);
          if (next <= now) next.setDate(next.getDate() + 1);
          return next.toLocaleString();
        }
        return '— (compute with your scheduler for complex expressions)';
      })();
      return {
        output: [
          kv('Expression', expr),
          kv('Fields', 'minute · hour · day-of-month · month · day-of-week'),
          '',
          bullet('Summary', summary),
          '',
          'FIELD BREAKDOWN',
          ...fields.map((f, i) => `  [${f}] → ${parts[i]}`),
          '',
          bullet('Estimated next run', nextGuess),
          bullet('Cron tip', 'Use crontab.guru to sandbox complex schedules; keep server TZ in mind (UTC vs local).'),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'user-agent-parser',
    fields: [
      { name: 'ua', label: 'User-Agent String', type: 'textarea', rows: 5, default: '', placeholder: 'Leave empty to use YOUR current browser user-agent' },
    ],
    run: (ctx) => {
      const ua = str(ctx.values.ua).trim() || navigator.userAgent;
      const detect = (regex: RegExp): string | null => {
        const m = ua.match(regex);
        return m ? m[0] : null;
      };
      let browser = 'Unknown';
      if (/Edg\//.test(ua)) browser = `Microsoft Edge (${(ua.match(/Edg\/([\d.]+)/) || [])[1] || '?'})`;
      else if (/OPR\/|Opera/.test(ua)) browser = `Opera (${(ua.match(/(?:OPR|Opera)[/ ]([\d.]+)/) || [])[1] || '?'})`;
      else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = `Google Chrome (${(ua.match(/Chrome\/([\d.]+)/) || [])[1] || '?'})`;
      else if (/Chromium/.test(ua)) browser = 'Chromium';
      else if (/Firefox\//.test(ua)) browser = `Mozilla Firefox (${(ua.match(/Firefox\/([\d.]+)/) || [])[1] || '?'})`;
      else if (/Safari\//.test(ua)) browser = `Safari (${(ua.match(/Version\/([\d.]+)/) || [])[1] || '?'})`;
      let os = 'Unknown OS';
      if (/Windows NT 10/.test(ua)) os = 'Windows 10/11';
      else if (/Windows/.test(ua)) os = 'Windows (legacy)';
      else if (/Android ([\d.]+)/.test(ua)) os = `Android ${(ua.match(/Android ([\d.]+)/) || [])[1]}`;
      else if (/iPhone|iPad|iPod/.test(ua)) os = `iOS ${(ua.match(/OS ([\d_]+)/) || [])[1]?.replace(/_/g, '.') || '?'}`;
      else if (/Mac OS X ([\d_]+)/.test(ua)) os = `macOS ${(ua.match(/Mac OS X ([\d_]+)/) || [])[1]?.replace(/_/g, '.')}`;
      else if (/Linux/.test(ua)) os = 'Linux';
      const engine = /Gecko\/|Firefox/.test(ua) && !/like Gecko/.test(ua.replace(/like Gecko/g, '')) ? 'Gecko' : /AppleWebKit\//.test(ua) ? (/Chrome|Edg|OPR/.test(ua) ? 'Blink' : 'WebKit') : 'Unknown';
      const device = /Mobile|Android.*Mobile|iPhone/.test(ua) ? 'Smartphone (mobile)' : /iPad|Tablet/.test(ua) ? 'Tablet' : 'Desktop';
      const bot = /bot|crawl|spider|slurp|bingpreview|lighthouse|headless/i.test(ua);
      return {
        output: [
          kv('User-Agent', ua.substring(0, 160) + (ua.length > 160 ? '…' : '')),
          '',
          bullet('Browser', browser),
          bullet('Rendering engine', engine),
          bullet('Operating system', os),
          bullet('Device type', device),
          bullet('Automation / bot', bot ? 'YES — crawler or headless client detected' : 'No bot signatures found'),
          bullet('Language', navigator.language),
          bullet('Local time', new Date().toLocaleString()),
        ].join('\n'),
        json: { browser, engine, os, device, bot, raw: ua },
      };
    },
  },
];
