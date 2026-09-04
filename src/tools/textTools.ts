// Text & Content Tools (23) — pure client-side string processing.
import type { ToolDefinition, ToolResult } from './types';
import { num, str, bool } from './types';
import {
  kv, bullet, isStopword, splitSentences, countSyllables, pick, sample, secureRandomInt, fleschReadingEase,
} from './helpers';

const fmTime = (seconds: number): string => {
  if (seconds < 60) return `${Math.max(1, Math.round(seconds))} sec`;
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
};

const textMetrics = (text: string) => {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];
  const sentences = trimmed ? splitSentences(trimmed) : [];
  const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim()) : [];
  const chars = trimmed.length;
  const charsNoSpaces = trimmed.replace(/\s/g, '').length;
  const syllables = words.reduce((a, w) => a + countSyllables(w), 0);
  return { words: words.length, chars, charsNoSpaces, sentences: sentences.length, paragraphs: paragraphs.length, syllables, avgWordsPerSentence: sentences.length ? words.length / sentences.length : 0 };
};

export const textTools: ToolDefinition[] = [
  {
    slug: 'word-counter',
    fields: [{ name: 'input', label: 'Your Text', type: 'textarea', rows: 9, default: 'Branify builds powerful digital experiences, intelligent technology, and luxury brands designed to move ambitious businesses forward into the next generation. Every pixel is engineered, every interaction choreographed.', placeholder: 'Type or paste your content here…' }],
    run: (ctx) => {
      const m = textMetrics(str(ctx.values.input));
      return {
        output: [
          kv('Words', m.words),
          kv('Characters', `${m.chars} (${m.charsNoSpaces} without spaces)`),
          '',
          bullet('Sentences', m.sentences),
          bullet('Paragraphs', m.paragraphs),
          bullet('Reading time', fmTime((m.words / 200) * 60)),
          bullet('Speaking time', fmTime((m.words / 130) * 60)),
          bullet('Avg words / sentence', m.avgWordsPerSentence.toFixed(1)),
        ].join('\n'),
        json: { ...m },
      };
    },
  },
  {
    slug: 'character-counter',
    fields: [{ name: 'input', label: 'Your Text', type: 'textarea', rows: 8, default: 'Paste text to count exact characters and spaces — perfect for tweets, meta titles and SMS copy.', placeholder: 'Paste text…' }],
    run: (ctx) => {
      const t = str(ctx.values.input);
      const letters = (t.match(/[A-Za-z]/g) || []).length;
      const digits = (t.match(/\d/g) || []).length;
      const spaces = (t.match(/ /g) || []).length;
      const symbols = t.replace(/[A-Za-z0-9 ]/g, '').length;
      const lines = t ? t.split('\n').length : 0;
      return {
        output: [
          kv('Characters (with spaces)', t.length),
          kv('Characters (no spaces)', t.replace(/\s/g, '').length),
          '',
          bullet('Letters', letters),
          bullet('Digits', digits),
          bullet('Spaces', spaces),
          bullet('Symbols / punctuation', symbols),
          bullet('Lines', lines),
          bullet('SMS segments (160)', Math.max(1, Math.ceil(t.length / 160))),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'sentence-counter',
    fields: [{ name: 'input', label: 'Your Text', type: 'textarea', rows: 8, default: 'Great copy is engineered, not written. Short sentences create momentum. Long sentences, by contrast, carry nuance — but too many in a row will exhaust your reader and dilute the message.', placeholder: 'Paste text…' }],
    run: (ctx) => {
      const t = str(ctx.values.input).trim();
      const sentences = splitSentences(t);
      const words = t ? t.split(/\s+/).filter(Boolean).length : 0;
      const avg = sentences.length ? words / sentences.length : 0;
      return {
        output: [
          kv('Sentences', sentences.length),
          kv('Words', words),
          '',
          bullet('Average sentence length', `${avg.toFixed(1)} words`),
          bullet('Longest sentence', `${Math.max(0, ...sentences.map((s) => s.split(/\s+/).length))} words`),
          bullet('Verdict', avg <= 20 ? 'HEALTHY — scannable rhythm' : 'DENSE — consider splitting long sentences'),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'paragraph-counter',
    fields: [{ name: 'input', label: 'Your Text', type: 'textarea', rows: 8, default: 'Content blocks shape reading rhythm.\n\nThis second paragraph proves the counter sees structure, not just line breaks.\n\nAnd this third one closes the argument.', placeholder: 'Paste text…' }],
    run: (ctx) => {
      const t = str(ctx.values.input).trim();
      const paras = t ? t.split(/\n\s*\n/).filter((p) => p.trim()) : [];
      const words = t ? t.split(/\s+/).filter(Boolean).length : 0;
      return {
        output: [
          kv('Paragraphs', paras.length),
          kv('Total words', words),
          '',
          bullet('Line breaks (single)', Math.max(0, t.split('\n').length - 1)),
          bullet('Block gaps (double)', Math.max(0, (t.match(/\n\s*\n/g) || []).length)),
          ...paras.slice(0, 6).map((p, i) => bullet(`Block ${i + 1}`, `${p.trim().split(/\s+/).length} words — "${p.trim().substring(0, 42)}${p.trim().length > 42 ? '…' : ''}"`)),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'reading-time-calculator',
    fields: [
      { name: 'input', label: 'Article Text', type: 'textarea', rows: 9, default: 'Design systems are the silent infrastructure of every fast-moving product team. They encode decisions once, so teams can ship a hundred times without re-litigating the basics.', placeholder: 'Paste article text…' },
      { name: 'wpm', label: 'Reading Speed (words/min)', type: 'number', default: 200, min: 100, max: 500, step: 10 },
    ],
    run: (ctx) => {
      const t = str(ctx.values.input).trim();
      const wpm = num(ctx.values.wpm, 200);
      const words = t ? t.split(/\s+/).filter(Boolean).length : 0;
      const readSec = (words / wpm) * 60;
      const speakSec = (words / 130) * 60;
      return {
        output: [
          kv('Word count', words),
          kv('Your reading speed', `${wpm} wpm`),
          '',
          bullet('Silent reading time', fmTime(readSec)),
          bullet('Speech / presentation time', fmTime(speakSec)),
          bullet('Slow readers (150 wpm)', fmTime((words / 150) * 60)),
          bullet('Fast readers (250 wpm)', fmTime((words / 250) * 60)),
          bullet('Suggested label', words ? `${Math.max(1, Math.ceil(readSec / 60))} min read` : '—'),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'case-converter',
    fields: [
      { name: 'input', label: 'Your Text', type: 'textarea', rows: 6, default: 'build a brand that means business 2026', placeholder: 'Enter text…' },
    ],
    run: (ctx) => {
      const t = str(ctx.values.input);
      const words = t.trim().split(/[\s_-]+/).filter(Boolean);
      const camel = words.map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())).join('');
      const pascal = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
      const snake = words.map((w) => w.toLowerCase()).join('_');
      const kebab = words.map((w) => w.toLowerCase()).join('-');
      const alternating = t.split('').map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase())).join('');
      const inverse = t.split('').map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join('');
      return {
        output: [
          `UPPERCASE:       ${t.toUpperCase()}`,
          `lowercase:       ${t.toLowerCase()}`,
          `Title Case:      ${t.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}`,
          `Sentence case:   ${t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()}`,
          `camelCase:       ${camel}`,
          `PascalCase:      ${pascal}`,
          `snake_case:      ${snake}`,
          `kebab-case:      ${kebab}`,
          `aLtErNaTiNg:     ${alternating}`,
          `iNVERSE cASE:    ${inverse}`,
        ].join('\n'),
      };
    },
  },
  {
    slug: 'uppercase-converter',
    fields: [{ name: 'input', label: 'Your Text', type: 'textarea', rows: 6, default: 'convert text to all caps', placeholder: 'Convert text to ALL CAPS…' }],
    run: (ctx) => ({ output: str(ctx.values.input).toUpperCase() }),
  },
  {
    slug: 'lowercase-converter',
    fields: [{ name: 'input', label: 'Your Text', type: 'textarea', rows: 6, default: 'CONVERT TEXT TO LOWERCASE', placeholder: 'Convert text to lowercase…' }],
    run: (ctx) => ({ output: str(ctx.values.input).toLowerCase() }),
  },
  {
    slug: 'title-case-converter',
    fields: [
      { name: 'input', label: 'Headline', type: 'textarea', rows: 4, default: 'the ultimate guide to luxury web design in 2026', placeholder: 'Convert headlines to Title Case…' },
      { name: 'style', label: 'Style', type: 'select', default: 'apa', options: [
        { value: 'apa', label: 'APA (small words lowercase)' },
        { value: 'every', label: 'Capitalize Every Word' },
      ] },
    ],
    run: (ctx) => {
      const t = str(ctx.values.input).toLowerCase();
      const small = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet', 'with']);
      const outText = t.replace(/\b[a-z']+\b/g, (word, idx: number) => {
        const isFirst = idx === 0 || /\s$/.test(t.slice(0, idx as number).replace(/["'(]*$/, ''));
        if (str(ctx.values.style, 'apa') === 'apa' && !isFirst && small.has(word)) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
      });
      return { output: outText, note: 'Small words (a, of, the…) stay lowercase in APA style except at the start.' };
    },
  },
  {
    slug: 'duplicate-line-remover',
    fields: [
      { name: 'input', label: 'List with duplicates', type: 'textarea', rows: 9, default: 'gold@branify.store\nteam@branify.store\ngold@branify.store\nhello@branify.store\nteam@branify.store\nsupport@branify.store', placeholder: 'Paste list with duplicate lines…' },
      { name: 'caseSensitive', label: 'Case-sensitive comparison', type: 'checkbox', default: false },
      { name: 'trimLines', label: 'Trim whitespace per line', type: 'checkbox', default: true },
      { name: 'removeEmpty', label: 'Remove empty lines', type: 'checkbox', default: true },
      { name: 'sort', label: 'Sort result', type: 'select', default: 'original', options: [
        { value: 'original', label: 'Keep original order' },
        { value: 'az', label: 'Sort A → Z' },
        { value: 'za', label: 'Sort Z → A' },
      ] },
    ],
    run: (ctx) => {
      const trim = bool(ctx.values.trimLines, true);
      let lines = str(ctx.values.input).split('\n').map((l) => (trim ? l.trim() : l));
      if (bool(ctx.values.removeEmpty, true)) lines = lines.filter((l) => l.trim() !== '');
      const seen = new Set<string>();
      const kept: string[] = [];
      let removed = 0;
      for (const l of lines) {
        const key = bool(ctx.values.caseSensitive, false) ? l : l.toLowerCase();
        if (seen.has(key)) { removed++; continue; }
        seen.add(key);
        kept.push(l);
      }
      const sort = str(ctx.values.sort, 'original');
      const result = sort === 'az' ? [...kept].sort() : sort === 'za' ? [...kept].sort().reverse() : kept;
      return {
        output: result.join('\n'),
        note: `Removed ${removed} duplicate line${removed === 1 ? '' : 's'} — ${lines.length} in → ${result.length} out (order preserved).`,
      };
    },
  },
  {
    slug: 'remove-extra-spaces',
    fields: [
      { name: 'input', label: 'Messy Text', type: 'textarea', rows: 8, default: 'This   text  has    WAY too many spaces,   double  tabs and\n\n\n\nway too many blank lines.     ', placeholder: 'Paste text with extra spaces…' },
      { name: 'collapseSpaces', label: 'Collapse multiple spaces', type: 'checkbox', default: true },
      { name: 'stripLeading', label: 'Strip leading/trailing per line', type: 'checkbox', default: true },
      { name: 'collapseBlanks', label: 'Collapse blank lines', type: 'checkbox', default: true },
      { name: 'removeAllLineBreaks', label: 'Remove ALL line breaks', type: 'checkbox', default: false },
      { name: 'removeTabs', label: 'Convert tabs to single space', type: 'checkbox', default: true },
    ],
    run: (ctx) => {
      let t = str(ctx.values.input);
      const before = t.length;
      if (bool(ctx.values.removeTabs, true)) t = t.replace(/\t+/g, ' ');
      if (bool(ctx.values.collapseSpaces, true)) t = t.replace(/ {2,}/g, ' ');
      if (bool(ctx.values.stripLeading, true)) t = t.split('\n').map((l) => l.trim()).join('\n');
      if (bool(ctx.values.removeAllLineBreaks, true)) t = t.replace(/\s*\n\s*/g, ' ');
      else if (bool(ctx.values.collapseBlanks, true)) t = t.replace(/\n{3,}/g, '\n\n').replace(/ ?\n ?/g, '\n');
      t = t.trim();
      return { output: t, note: `Cleaned ${before} → ${t.length} characters.` };
    },
  },
  {
    slug: 'text-sorter',
    fields: [
      { name: 'input', label: 'Lines to sort', type: 'textarea', rows: 9, default: 'Banana\nApple\nCherry\ndate\nElderberry', placeholder: 'Banana\nApple\nCherry' },
      { name: 'mode', label: 'Sort Mode', type: 'select', default: 'az', options: [
        { value: 'az', label: 'Alphabetical A → Z' },
        { value: 'za', label: 'Alphabetical Z → A' },
        { value: 'len-asc', label: 'Line length (short → long)' },
        { value: 'len-desc', label: 'Line length (long → short)' },
        { value: 'reverse', label: 'Reverse original order' },
        { value: 'shuffle', label: 'Shuffle randomly' },
      ] },
      { name: 'caseSensitive', label: 'Case-sensitive sorting', type: 'checkbox', default: false },
      { name: 'removeDuplicates', label: 'Remove duplicates first', type: 'checkbox', default: true },
    ],
    run: (ctx) => {
      let lines = str(ctx.values.input).split('\n').filter((l) => l.trim() !== '');
      if (bool(ctx.values.removeDuplicates, true)) lines = [...new Set(lines)];
      const cs = bool(ctx.values.caseSensitive, false);
      const key = (l: string) => (cs ? l : l.toLowerCase());
      const mode = str(ctx.values.mode, 'az');
      let result: string[];
      switch (mode) {
        case 'az': result = [...lines].sort((a, b) => key(a).localeCompare(key(b))); break;
        case 'za': result = [...lines].sort((a, b) => key(b).localeCompare(key(a))); break;
        case 'len-asc': result = [...lines].sort((a, b) => a.length - b.length); break;
        case 'len-desc': result = [...lines].sort((a, b) => b.length - a.length); break;
        case 'reverse': result = [...lines].reverse(); break;
        case 'shuffle': {
          result = [...lines];
          for (let i = result.length - 1; i > 0; i--) {
            const j = secureRandomInt(i + 1);
            [result[i], result[j]] = [result[j], result[i]];
          }
          break;
        }
        default: result = lines;
      }
      return { output: result.join('\n'), note: `Sorted ${lines.length} lines using ${mode} mode.` };
    },
  },
  {
    slug: 'text-reverser',
    fields: [
      { name: 'input', label: 'Your Text', type: 'textarea', rows: 6, default: 'Branify builds brands', placeholder: 'Enter text to reverse…' },
      { name: 'mode', label: 'Reverse Mode', type: 'select', default: 'chars', options: [
        { value: 'chars', label: 'Reverse characters' },
        { value: 'words', label: 'Reverse word order' },
        { value: 'lines', label: 'Reverse line order' },
        { value: 'each-word', label: 'Reverse letters in each word' },
      ] },
    ],
    run: (ctx) => {
      const t = str(ctx.values.input);
      const mode = str(ctx.values.mode, 'chars');
      const rev = (s: string) => [...s].reverse().join('');
      let output = t;
      if (mode === 'chars') output = rev(t);
      else if (mode === 'words') output = t.split(/\s+/).reverse().join(' ');
      else if (mode === 'lines') output = t.split('\n').reverse().join('\n');
      else output = t.replace(/\S+/g, (w) => rev(w));
      return { output };
    },
  },
  {
    slug: 'text-cleaner',
    fields: [
      { name: 'input', label: 'Dirty Text', type: 'textarea', rows: 8, default: '<p>Hello   "World"</p>\nIt\u2019s 100% clean — really…\n\n\tTabbed line with trailing spaces   ', placeholder: 'Paste text to sanitize…' },
      { name: 'stripHtml', label: 'Strip HTML tags', type: 'checkbox', default: true },
      { name: 'decodeEntities', label: 'Decode HTML entities', type: 'checkbox', default: true },
      { name: 'smartQuotes', label: 'Normalize smart quotes → straight', type: 'checkbox', default: true },
      { name: 'normalizeUnicode', label: 'Replace fancy dashes/ellipses', type: 'checkbox', default: true },
      { name: 'removeUnprintable', label: 'Remove unprintable characters', type: 'checkbox', default: true },
      { name: 'normalizeSpaces', label: 'Normalize whitespace', type: 'checkbox', default: true },
    ],
    run: (ctx) => {
      let t = str(ctx.values.input);
      const before = t.length;
      if (bool(ctx.values.stripHtml, true)) t = t.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, '');
      if (bool(ctx.values.decodeEntities, true)) {
        const el = document.createElement('textarea');
        el.innerHTML = t;
        t = el.value;
      }
      if (bool(ctx.values.smartQuotes, true)) t = t.replace(/[\u2018\u2019\u201A\u201B]/g, "'").replace(/[\u201C\u201D\u201E]/g, '"');
      if (bool(ctx.values.normalizeUnicode, true)) t = t.replace(/[\u2013\u2014]/g, '-').replace(/\u2026/g, '...').replace(/\u00A0/g, ' ');
      if (bool(ctx.values.removeUnprintable, true)) t = t.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '');
      if (bool(ctx.values.normalizeSpaces, true)) t = t.replace(/[ \t]{2,}/g, ' ').split('\n').map((l) => l.trim()).join('\n').replace(/\n{3,}/g, '\n\n');
      return { output: t.trim(), note: `Sanitized ${before} → ${t.trim().length} characters.` };
    },
  },
  {
    slug: 'find-and-replace',
    fields: [
      { name: 'input', label: 'Text', type: 'textarea', rows: 8, default: 'Branify designs websites. Branify builds brands. Contact Branify today.', placeholder: 'Paste your text…' },
      { name: 'find', label: 'Find', type: 'text', default: 'Branify', placeholder: 'Search for…' },
      { name: 'replaceWith', label: 'Replace With', type: 'text', default: 'BRANIFY', placeholder: 'Replace with…' },
      { name: 'regex', label: 'Treat "Find" as regular expression', type: 'checkbox', default: false },
      { name: 'caseSensitive', label: 'Case sensitive', type: 'checkbox', default: false },
      { name: 'wholeWords', label: 'Whole words only', type: 'checkbox', default: false },
    ],
    run: (ctx) => {
      const t = str(ctx.values.input);
      const find = str(ctx.values.find);
      const rep = str(ctx.values.replaceWith);
      if (!find) throw new Error('Enter the text you want to find.');
      let pattern: string;
      if (bool(ctx.values.regex, false)) pattern = find;
      else pattern = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (bool(ctx.values.wholeWords, false)) pattern = `\\b${pattern}\\b`;
      const flags = 'g' + (bool(ctx.values.caseSensitive, false) ? '' : 'i');
      let re: RegExp;
      try { re = new RegExp(pattern, flags); } catch (e) { throw new Error(`Invalid pattern: ${(e as Error).message}`); }
      const matches = t.match(re);
      const count = matches ? matches.length : 0;
      return {
        output: t.replace(re, rep),
        note: count ? `Replaced ${count} occurrence${count === 1 ? '' : 's'} of "${find}".` : `"${find}" was not found — output is unchanged.`,
      };
    },
  },
  {
    slug: 'lorem-ipsum-generator',
    fields: [
      { name: 'count', label: 'Quantity', type: 'number', default: 3, min: 1, max: 50, step: 1 },
      { name: 'unit', label: 'Generate', type: 'select', default: 'paragraphs', options: [
        { value: 'paragraphs', label: 'Paragraphs' },
        { value: 'sentences', label: 'Sentences' },
        { value: 'words', label: 'Words' },
      ] },
      { name: 'classic', label: 'Start with "Lorem ipsum dolor sit amet"', type: 'checkbox', default: true },
    ],
    run: (ctx) => {
      const WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' ');
      const count = Math.round(num(ctx.values.count, 3));
      const unit = str(ctx.values.unit, 'paragraphs');
      const sentence = () => {
        const len = 8 + secureRandomInt(10);
        const ws = sample(WORDS, len);
        return ws.map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(' ') + '.';
      };
      const paragraph = () => Array.from({ length: 4 + secureRandomInt(4) }, sentence).join(' ');
      let classic = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
      let output: string;
      if (unit === 'words') {
        const ws: string[] = [];
        if (bool(ctx.values.classic, true)) ws.push(...classic.replace(/[,.]/g, '').split(' '));
        while (ws.length < count) ws.push(pick(WORDS));
        output = ws.slice(0, count).join(' ');
      } else if (unit === 'sentences') {
        const ss: string[] = [];
        if (bool(ctx.values.classic, true)) ss.push(classic);
        while (ss.length < count) ss.push(sentence());
        output = ss.slice(0, count).join(' ');
      } else {
        const ps: string[] = [];
        if (bool(ctx.values.classic, true)) { ps.push(`${classic} ${paragraph()}`); }
        while (ps.length < count) ps.push(paragraph());
        output = ps.slice(0, count).join('\n\n');
      }
      return { output, note: `Generated ${count} ${unit} of classic Lorem Ipsum placeholder text.` };
    },
  },
  {
    slug: 'random-text-generator',
    fields: [
      { name: 'count', label: 'Quantity', type: 'number', default: 3, min: 1, max: 20, step: 1 },
      { name: 'style', label: 'Style', type: 'select', default: 'business', options: [
        { value: 'business', label: 'Business / corporate' },
        { value: 'tech', label: 'Tech / startup' },
        { value: 'nonsense', label: 'Absurd nonsense' },
      ] },
      { name: 'sentences', label: 'Sentences per paragraph', type: 'number', default: 4, min: 1, max: 10, step: 1 },
    ],
    run: (ctx) => {
      const banks: Record<string, string[]> = {
        business: ['stakeholder', 'synergy', 'deliverable', 'roadmap', 'quarter', 'growth', 'alignment', 'KPI', ' Bandwidth', 'leverage', 'bandwidth', 'pipeline', 'strategy', 'outcome', 'executive', 'operational', 'scalable', 'quarterly', 'milestone', 'cross-functional'],
        tech: ['containerized', 'microservice', 'Kubernetes', 'latency', 'throughput', 'deploy', 'edge', 'serverless', 'runtime', 'API gateway', 'observability', 'idempotent', 'shard', 'cache invalidation', 'CI/CD', 'blue-green', 'rollback', 'backpressure', 'horizontal scaling', 'hot path'],
        nonsense: ['purple', 'quantum llama', 'waffle', 'timestamp', 'jellybeans', '.hovercraft', 'melon', 'thunder', 'penguin', 'neon', 'accordion', 'marshmallow', 'turbulent', 'carousel', 'bureaucratic', 'avocado', 'kaleidoscope', 'spatula', 'twilight', 'gerbil'],
      };
      const bank = banks[str(ctx.values.style, 'business')] || banks.business;
      const templates = [
        'Our {a} team will {b} the {c} to {d} measurable {e}.',
        'We {b} a {c}-first approach across every {a} {e}.',
        'The {c} framework {d} faster {e} for your {a}.',
        'By 2026 every {a} will {b} its {c} through {d} {e}.',
      ];
      const verbs = ['orchestrate', 'streamline', 'accelerate', 'reimagine', 'future-proof', 'automate'];
      const sents = Math.round(num(ctx.values.sentences, 4));
      const sentence = () => pick(templates)
        .replace('{a}', pick(bank))
        .replace('{b}', pick(verbs))
        .replace('{c}', pick(bank))
        .replace('{d}', pick(verbs))
        .replace('{e}', pick(bank)) + ' ';
      const paragraph = () => Array.from({ length: sents }, sentence).join('').trim();
      const count = Math.round(num(ctx.values.count, 3));
      return { output: Array.from({ length: count }, paragraph).join('\n\n'), note: `Generated ${count} randomized ${str(ctx.values.style)} paragraph${count === 1 ? '' : 's'}.` };
    },
  },
  {
    slug: 'hashtag-generator',
    fields: [
      { name: 'keyword', label: 'Topic keyword', type: 'text', default: 'branding', placeholder: 'e.g. branding, design, web' },
      { name: 'count', label: 'Hashtag count', type: 'number', default: 24, min: 5, max: 60, step: 1 },
    ],
    run: (ctx) => {
      const k = str(ctx.values.keyword, 'branding').trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '');
      const base = k || 'branding';
      const tags = new Set<string>([base, `${base}design`, `${base}tips`, `${base}2026`, `${base}inspiration`, `${base}strategy`, `${base}agency`, `${base}studio`, `digital${base}`, `${base}expert`, `custom${base}`, `${base}consultant`, `${base}services`, `${base}love`, `${base}life`, `${base}community`, `${base}goals`, `${base}growth`, `creative${base}`, `${base}ideas`, `${base}business`, `${base}marketing`, `${base}brand`, `${base}online`, `${base}daily`, `${base}world`, `${base}hub`, `${base}pro`, `${base}master`, `${base}ninja`]);
      const list = [...tags].map((t) => `#${t}`).slice(0, Math.round(num(ctx.values.count, 24)));
      return {
        output: [
          list.join('  '),
          '',
          bullet('Total', `${list.length} hashtags`),
          bullet('Usage tip', 'Mix 3-5 broad tags with niche tags; rotate sets per post to avoid spam signals.'),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'keyword-density-checker',
    fields: [
      { name: 'input', label: 'Content', type: 'textarea', rows: 9, default: 'Web design is the craft of shaping digital trust. Great web design pairs typography, spacing, and motion into one clear voice. At Branify, web design starts with strategy: who is the visitor, what must they feel, and what should they do next. That is why our web design process begins with a brand workshop before a single pixel moves.', placeholder: 'Paste article copy…' },
      { name: 'keyword', label: 'Focus keyword', type: 'text', default: 'web design' },
    ],
    run: (ctx) => {
      const t = str(ctx.values.input).toLowerCase();
      const kw = str(ctx.values.keyword, '').trim().toLowerCase();
      const words = t.match(/[a-z0-9']+/g) || [];
      const total = words.length || 1;
      const kwWords = kw ? kw.split(/\s+/).length : 1;
      let occurrences = 0;
      if (kw) {
        const re = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        occurrences = (t.match(re) || []).length;
      }
      const density = (occurrences * kwWords * 100) / total;
      const freq = new Map<string, number>();
      for (const w of words) {
        if (isStopword(w) || w.length < 3) continue;
        freq.set(w, (freq.get(w) || 0) + 1);
      }
      const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
      const verdict = !kw ? 'NO KEYWORD SET' : density < 0.5 ? 'LOW — add the keyword naturally a few more times' : density <= 2.5 ? 'HEALTHY — search-engine friendly density' : 'RISK — keyword stuffing territory';
      return {
        output: [
          kv('Total words', words.length),
          kv('Keyword', kw || '—'),
          kv('Occurrences', occurrences),
          '',
          bullet(`Density (${kwWords}-word phrase)`, `${density.toFixed(2)}%`),
          bullet('Verdict', verdict),
          '',
          'TOP CONTENT WORDS',
          ...top.map(([w, n], i) => bullet(`#${i + 1} "${w}"`, `${n}× (${((n * 100) / total).toFixed(1)}%)`)),
        ].join('\n'),
        json: { totalWords: words.length, keyword: kw, occurrences, densityPct: +density.toFixed(2), topWords: top.map(([w, n]) => ({ word: w, count: n })) },
      };
    },
  },
  {
    slug: 'text-summarizer',
    fields: [
      { name: 'input', label: 'Long Article', type: 'textarea', rows: 10, default: 'The luxury web market has shifted decisively toward performance. Studies show that a one-second delay in load time cuts conversions by seven percent. Studios that treat speed as a design material consistently outperform those that treat it as an afterthought. Typography carries the brand voice, but motion carries the brand energy. The best agency sites now animate with restraint: a single reveal per viewport, never more. Content strategy has become the differentiator. Visitors do not read pages; they scan narratives. Teams that map scanning patterns before wireframing report forty percent fewer revisions. Finally, pricing transparency builds trust faster than any portfolio piece. Agencies publishing real starting prices receive higher-intent leads and waste less time on mismatched inquiries.', placeholder: 'Paste long article copy…' },
      { name: 'bulletCount', label: 'Key sentences to extract', type: 'number', default: 4, min: 2, max: 8, step: 1 },
    ],
    run: (ctx) => {
      const t = str(ctx.values.input).trim();
      if (!t) throw new Error('Paste an article to summarize.');
      const sentences = splitSentences(t);
      const freq = new Map<string, number>();
      for (const w of t.toLowerCase().match(/[a-z']{3,}/g) || []) {
        if (isStopword(w)) continue;
        freq.set(w, (freq.get(w) || 0) + 1);
      }
      const scored = sentences.map((s, i) => {
        const ws: string[] = s.toLowerCase().match(/[a-z']{3,}/g) || [];
        const score = ws.reduce((a, w) => a + (freq.get(w) || 0), 0) / Math.max(1, ws.length);
        return { s, i, score: score * (i === 0 ? 1.25 : 1) };
      });
      const topCount = Math.min(sentences.length, Math.round(num(ctx.values.bulletCount, 4)));
      const chosen = [...scored].sort((a, b) => b.score - a.score).slice(0, topCount).sort((a, b) => a.i - b.i);
      const m = textMetrics(t);
      return {
        output: [
          `KEY TAKEAWAYS (${chosen.length} of ${sentences.length} sentences)`,
          '',
          ...chosen.map((c, i) => `${i + 1}. ${c.s}`),
          '',
          bullet('Compression', `${m.words} words → summary of ~${chosen.reduce((a, c) => a + c.s.split(/\s+/).length, 0)} words`),
          bullet('Method', 'Extractive frequency scoring — runs entirely in your browser.'),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'json-formatter',
    fields: [
      { name: 'input', label: 'JSON', type: 'textarea', rows: 9, default: '{"name":"BRANIFY","services":["web","design"],"founded":2019}', placeholder: '{"name":"BRANIFY",…}' },
      { name: 'indent', label: 'Indent', type: 'select', default: '2', options: [
        { value: '2', label: '2 spaces' },
        { value: '4', label: '4 spaces' },
        { value: 'tab', label: 'Tabs' },
      ] },
    ],
    run: (ctx) => {
      const raw = str(ctx.values.input).trim();
      if (!raw) throw new Error('Paste JSON first.');
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        const msg = (e as Error).message.replace(/^Unexpected token /, 'Unexpected token ');
        throw new Error(`Invalid JSON — ${msg}`);
      }
      const indent = str(ctx.values.indent, '2');
      const space = indent === 'tab' ? '\t' : Number(indent);
      return { output: JSON.stringify(parsed, null, space as never), json: parsed, note: 'Valid JSON ✓ — formatted, validated and ready.' };
    },
  },
  {
    slug: 'markdown-formatter',
    fields: [
      { name: 'input', label: 'Markdown', type: 'textarea', rows: 10, default: '# Branify Studio\n\n**Bold copy** and *italic accent* and `inline code`.\n\n- Fast websites\n- Luxury branding\n\n[Visit Branify](https://branify.store)\n\n> Design is intelligence made visible.', placeholder: '# Heading…' },
      { name: 'mode', label: 'Output', type: 'select', default: 'html', options: [
        { value: 'html', label: 'Rendered HTML' },
        { value: 'clean', label: 'Cleaned Markdown' },
      ] },
    ],
    run: (ctx) => {
      const md = str(ctx.values.input);
      if (str(ctx.values.mode, 'html') === 'clean') {
        const cleaned = md.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
        return { output: cleaned, note: `Cleaned ${md.length} → ${cleaned.length} characters.` };
      }
      const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      let html = esc(md);
      html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>')
        .replace(/^## (.*)$/gm, '<h2>$1</h2>')
        .replace(/^# (.*)$/gm, '<h1>$1</h1>')
        .replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
        .replace(/^[-*] (.*)$/gm, '<li>$1</li>')
        .replace(/(<li>[\s\S]*?<\/li>)(?!\s*<li>)/g, '<ul>$1</ul>')
        .replace(/\n{2,}/g, '\n<p>')
        .replace(/^(?!<[hbuo])(.+)$/gm, '<p>$1</p>');
      const words = md.split(/\s+/).filter(Boolean).length;
      return {
        output: html.trim(),
        note: `Rendered ${words} words of Markdown → HTML with headings, emphasis, code, links, quotes and lists.`,
      };
    },
  },
  {
    slug: 'slug-generator',
    fields: [
      { name: 'input', label: 'Title / Headline', type: 'textarea', rows: 4, default: 'Build A Brand That Means Business 2026', placeholder: 'Build A Brand That Means Business 2026' },
      { name: 'separator', label: 'Separator', type: 'select', default: '-', options: [
        { value: '-', label: 'Hyphen (-)' },
        { value: '_', label: 'Underscore (_)' },
      ] },
      { name: 'lowercase', label: 'Force lowercase', type: 'checkbox', default: true },
      { name: 'stripStopwords', label: 'Remove common stopwords', type: 'checkbox', default: false },
    ],
    run: (ctx) => {
      let t = str(ctx.values.input).normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
      if (bool(ctx.values.stripStopwords, false)) {
        const stop = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'for', 'with', 'at', 'by', 'from']);
        t = t.split(/\s+/).filter((w) => !stop.has(w.toLowerCase())).join(' ');
      }
      const sep = str(ctx.values.separator, '-');
      let slug = t.trim().replace(/['"’]/g, '').replace(/[^A-Za-z0-9]+/g, sep).replace(new RegExp(`\\${sep}{2,}`, 'g'), sep);
      if (bool(ctx.values.lowercase, true)) slug = slug.toLowerCase();
      slug = slug.replace(new RegExp(`^\\${sep}+|\\${sep}+$`, 'g'), '');
      if (!slug) throw new Error('Title produced an empty slug — add some letters or digits.');
      return {
        output: [
          slug,
          '',
          bullet('Length', `${slug.length} characters (keep under 75 for full SERP display)`),
          bullet('Sample usage', `https://branify.store/${slug}`),
        ].join('\n'),
      };
    },
  },
];
