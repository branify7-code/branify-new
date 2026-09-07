// =============================================================================
// BRANIFY ADMIN — Blog editor writing surfaces
// -----------------------------------------------------------------------------
// • VisualEditor   — contenteditable WYSIWYG with a formatting toolbar.
//                    Sanitizes pasted rich text; images are inserted as
//                    <figure> with alt/caption/alignment/size/optional link
//                    and can be re-edited by clicking them.
// • HtmlSourceEditor — raw HTML mode. What you type is sanitized on switch /
//                    save / preview — scripts, event handlers and javascript:
//                    URLs never survive.
// Both surfaces keep ONE source of truth (the html string in the parent), so
// Visual ↔ HTML ↔ Preview switching never loses content.
// =============================================================================
import React, { useEffect, useRef, useState } from 'react';
import {
  Bold, Braces, Code, Eraser, Heading2, Heading3, Heading4, ImagePlus,
  Italic, Link2, List, ListOrdered, Minus, Pilcrow, Quote, Redo2,
  Strikethrough, Table, Underline, Undo2, X,
} from 'lucide-react';
import {
  Badge, Btn, Field, Input, Modal, Select, Textarea, cx, useToast,
} from '../../ui';
import { MediaPickerModal } from './BlogEditorMedia';
import { resolveAssetUrl } from '../../lib/backend';
import { sanitizeArticleHtml } from '../../../lib/sanitizeHtml';

type Align = 'al-center' | 'al-left' | 'al-right';
type Size = 'w-wide' | 'w-inline';

interface FigureSpec {
  url: string;
  alt: string;
  caption: string;
  align: Align;
  size: Size;
  link: string;
}

function buildFigureHtml(f: FigureSpec): string {
  const classes = [f.align, f.size].filter(Boolean).join(' ');
  const img = `<img src="${escapeAttr(f.url)}" alt="${escapeAttr(f.alt)}" loading="lazy" />`;
  const wrapped = f.link ? `<a href="${escapeAttr(f.link)}">${img}</a>` : img;
  return `<figure class="${classes}">${wrapped}${f.caption ? `<figcaption>${escapeHtml(f.caption)}</figcaption>` : ''}</figure>`;
}

function escapeAttr(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeHtml(s: string): string {
  return escapeAttr(s).replace(/'/g, '&#39;');
}

function parseFigureEl(fig: HTMLElement): FigureSpec {
  const img = fig.querySelector('img');
  const link = fig.querySelector('a[href]');
  const cls = fig.className || '';
  const align: Align = cls.includes('al-left') ? 'al-left' : cls.includes('al-right') ? 'al-right' : 'al-center';
  const size: Size = cls.includes('w-inline') ? 'w-inline' : 'w-wide';
  return {
    url: img?.getAttribute('src') || '',
    alt: img?.getAttribute('alt') || '',
    caption: fig.querySelector('figcaption')?.textContent || '',
    align,
    size,
    link: link?.getAttribute('href') || '',
  };
}

// ------------------------------------------------------------------ toolbar bits
const TBtn: React.FC<{
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  title: string;
  onClick: () => void;
  active?: boolean;
}> = ({ icon: Icon, title, onClick, active }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    aria-pressed={active}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className={cx(
      'flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-[#475569] transition-colors hover:border-[#E2E8F0] hover:bg-[#F8FAFC] hover:text-[#8F6B2D]',
      active && 'border-[#C9A45C]/40 bg-[#C9A45C]/10 text-[#8F6B2D]',
    )}
  >
    <Icon size={13} />
  </button>
);

const TDivider = () => <span className="mx-1 hidden h-5 w-px bg-[#E2E8F0] sm:block" aria-hidden="true" />;

// ------------------------------------------------------------------ image settings modal
const ImageSettingsModal: React.FC<{
  open: boolean;
  initial: FigureSpec | null;
  isEditing: boolean;
  onClose: () => void;
  onApply: (spec: FigureSpec) => void;
  onRemove?: () => void;
}> = ({ open, initial, isEditing, onClose, onApply, onRemove }) => {
  const { push } = useToast();
  const [spec, setSpec] = useState<FigureSpec>(initial || { url: '', alt: '', caption: '', align: 'al-center', size: 'w-wide', link: '' });
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (open) setSpec(initial || { url: '', alt: '', caption: '', align: 'al-center', size: 'w-wide', link: '' });
  }, [open, initial]);

  const url = resolveAssetUrl(spec.url);

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={isEditing ? 'Image settings' : 'Insert image'}
        subtitle="Alt text and captions describe the image for readers and search engines — no keyword stuffing."
        width="lg"
        footer={
          <>
            {isEditing && onRemove && (
              <Btn variant="danger" size="sm" icon={X} onClick={() => { onRemove(); onClose(); }}>Remove image</Btn>
            )}
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn
              variant="gold"
              disabled={!spec.url.trim()}
              onClick={() => {
                if (!spec.alt.trim()) {
                  push('info', 'Tip: add alt text so the image is accessible and searchable.');
                }
                onApply({ ...spec, url: spec.url.trim(), alt: spec.alt.trim() });
                onClose();
              }}
            >
              {isEditing ? 'Apply changes' : 'Insert image'}
            </Btn>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Field label="Image source" hint="Pick from the existing media library, upload a new image, or paste a URL.">
            <div className="flex gap-2">
              <Input
                value={spec.url}
                onChange={(e) => setSpec((s) => ({ ...s, url: e.target.value }))}
                placeholder="https://… or pick from the library"
              />
              <Btn variant="outline" size="sm" icon={ImagePlus} onClick={() => setPickerOpen(true)}>Library</Btn>
            </div>
          </Field>

          {url && (
            <div className="flex h-40 items-center justify-center overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
              <img src={url} alt="Selected image preview" className="max-h-full max-w-full object-contain" />
            </div>
          )}

          <Field
            label="Alt text"
            hint="Describe what the image shows; don't stuff keywords. Screen readers + image SEO use it."
          >
            <Input
              value={spec.alt}
              onChange={(e) => setSpec((s) => ({ ...s, alt: e.target.value }))}
              placeholder="e.g. Analytics dashboard showing a 3-month traffic climb"
            />
          </Field>

          <Field label="Caption (optional)" hint="Shown under the image inside the article.">
            <Input
              value={spec.caption}
              onChange={(e) => setSpec((s) => ({ ...s, caption: e.target.value }))}
              placeholder="e.g. Figure 2 — Conversion rate after the redesign"
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Alignment">
              <Select value={spec.align} onChange={(e) => setSpec((s) => ({ ...s, align: e.target.value as Align }))}>
                <option value="al-center">Centered</option>
                <option value="al-left">Float left</option>
                <option value="al-right">Float right</option>
              </Select>
            </Field>
            <Field label="Size">
              <Select value={spec.size} onChange={(e) => setSpec((s) => ({ ...s, size: e.target.value as Size }))}>
                <option value="w-wide">Wide (full column)</option>
                <option value="w-inline">Inline (~62%)</option>
              </Select>
            </Field>
            <Field label="Link (optional)" hint="Clicking the image opens this URL.">
              <Input
                value={spec.link}
                onChange={(e) => setSpec((s) => ({ ...s, link: e.target.value }))}
                placeholder="https://…"
              />
            </Field>
          </div>
        </div>
      </Modal>

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(img) => setSpec((s) => ({ ...s, url: img.url, alt: s.alt || img.alt || '' }))}
        title="Choose an image"
      />
    </>
  );
};

// ------------------------------------------------------------------ link modal
const LinkModal: React.FC<{
  open: boolean;
  text: string;
  onClose: () => void;
  onApply: (url: string, text: string) => void;
}> = ({ open, text, onClose, onApply }) => {
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (open) { setUrl(''); setLabel(text); }
  }, [open, text]);

  const QUICK = [
    { label: 'Services', path: '/services' },
    { label: 'Portfolio', path: '/portfolio' },
    { label: 'Blog', path: '/blog' },
    { label: 'Free tools', path: '/tools' },
    { label: 'AI tools', path: '/ai-tools' },
    { label: 'Free templates', path: '/free-templates' },
    { label: 'Contact', path: '/contact' },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Insert link"
      width="md"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn
            variant="gold"
            disabled={!url.trim()}
            onClick={() => { onApply(url.trim(), label.trim()); onClose(); }}
          >
            Insert link
          </Btn>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Field label="URL" hint="Internal paths (/services…) or full https:// URLs.">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/services or https://…" />
        </Field>
        <Field label="Link text" hint="Shown in the article. Leave empty to keep the selected text.">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. our web development process" />
        </Field>
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#475569]">Quick internal links</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK.map((q) => (
              <button
                key={q.path}
                type="button"
                onClick={() => setUrl(q.path)}
                className="rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#475569] transition-colors hover:border-[#C9A45C]/50 hover:text-[#8F6B2D]"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ------------------------------------------------------------------ visual editor
export const VisualEditor: React.FC<{
  html: string;
  onChange: (html: string) => void;
}> = ({ html, onChange }) => {
  const { push } = useToast();
  const ref = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef<string>('');
  const [imgModal, setImgModal] = useState<{ open: boolean; initial: FigureSpec | null; target: HTMLElement | null }>({ open: false, initial: null, target: null });
  const [linkModal, setLinkModal] = useState<{ open: boolean; text: string }>({ open: false, text: '' });
  const savedRange = useRef<Range | null>(null);

  // -- sync external html into the DOM (never while typing)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (html !== lastEmitted.current) {
      el.innerHTML = html || '';
      lastEmitted.current = html;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html]);

  const emit = () => {
    const el = ref.current;
    if (!el) return;
    const next = el.innerHTML;
    lastEmitted.current = next;
    onChange(next);
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && ref.current && ref.current.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel) return;
    if (savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  const exec = (cmd: string, value?: string) => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    try {
      document.execCommand('styleWithCSS', false, 'false');
      document.execCommand(cmd, false, value);
    } catch { /* command unsupported — no-op */ }
    emit();
  };

  // -- paste: sanitize rich text so the buffer only ever holds article HTML
  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const raw = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');
    if (!raw) return;
    const clean = sanitizeArticleHtml(raw);
    restoreSelection();
    try {
      document.execCommand('insertHTML', false, clean);
    } catch {
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const r = sel.getRangeAt(0);
        r.deleteContents();
        r.insertNode(document.createTextNode(clean.replace(/<[^>]*>/g, '')));
      }
    }
    emit();
  };

  // -- image click → edit
  const onEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const img = target.closest('img');
    if (img) {
      const fig = img.closest('figure');
      saveSelection();
      setImgModal({
        open: true,
        target: (fig as HTMLElement) || img,
        initial: fig
          ? parseFigureEl(fig as HTMLElement)
          : { url: img.getAttribute('src') || '', alt: img.getAttribute('alt') || '', caption: '', align: 'al-center', size: 'w-wide', link: img.closest('a')?.getAttribute('href') || '' },
      });
      return;
    }
    const anchor = target.closest('a');
    if (anchor && (e.ctrlKey || e.metaKey)) {
      window.open(anchor.getAttribute('href') || '#', '_blank', 'noopener');
    }
  };

  const applyFigure = (spec: FigureSpec) => {
    const el = ref.current;
    if (!el) return;
    const { target } = imgModal;
    if (target && el.contains(target)) {
      const tmp = document.createElement('div');
      tmp.innerHTML = buildFigureHtml(spec);
      const node = tmp.firstElementChild || document.createTextNode(spec.url);
      target.replaceWith(node);
      emit();
      push('success', 'Image updated.');
    } else {
      restoreSelection();
      try {
        document.execCommand('insertHTML', false, buildFigureHtml(spec));
      } catch { /* ignore */ }
      emit();
      push('success', 'Image inserted.');
    }
  };

  const removeFigure = () => {
    const { target } = imgModal;
    if (target) {
      target.remove();
      emit();
    }
  };

  const openLinkModal = () => {
    saveSelection();
    const sel = window.getSelection();
    const text = sel && sel.rangeCount > 0 ? sel.toString() : '';
    setLinkModal({ open: true, text });
  };

  const applyLink = (url: string, label: string) => {
    const safe = sanitizeArticleHtml(`<a href="${escapeAttr(url)}">${escapeHtml(label || url)}</a>`);
    restoreSelection();
    if (label || !savedRange.current?.toString()) {
      try { document.execCommand('insertHTML', false, safe); } catch { /* ignore */ }
    } else {
      try { document.execCommand('createLink', false, url); } catch { /* ignore */ }
    }
    emit();
  };

  const insertTable = () => {
    const html = `<table><thead><tr><th>Column A</th><th>Column B</th><th>Column C</th></tr></thead><tbody><tr><td>—</td><td>—</td><td>—</td></tr><tr><td>—</td><td>—</td><td>—</td></tr><tr><td>—</td><td>—</td><td>—</td></tr></tbody></table><p><br/></p>`;
    try { document.execCommand('insertHTML', false, html); } catch { /* ignore */ }
    emit();
  };

  const block = (tag: string) => exec('formatBlock', tag);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[#E2E8F0] bg-[#F8FAFC]/70 px-3 py-2">
        <TBtn icon={Pilcrow} title="Paragraph" onClick={() => block('p')} />
        <TBtn icon={Heading2} title="Heading 2" onClick={() => block('h2')} />
        <TBtn icon={Heading3} title="Heading 3" onClick={() => block('h3')} />
        <TBtn icon={Heading4} title="Heading 4" onClick={() => block('h4')} />
        <TDivider />
        <TBtn icon={Bold} title="Bold" onClick={() => exec('bold')} />
        <TBtn icon={Italic} title="Italic" onClick={() => exec('italic')} />
        <TBtn icon={Underline} title="Underline" onClick={() => exec('underline')} />
        <TBtn icon={Strikethrough} title="Strikethrough" onClick={() => exec('strikeThrough')} />
        <TDivider />
        <TBtn icon={List} title="Bullet list" onClick={() => exec('insertUnorderedList')} />
        <TBtn icon={ListOrdered} title="Numbered list" onClick={() => exec('insertOrderedList')} />
        <TBtn icon={Quote} title="Blockquote" onClick={() => block('blockquote')} />
        <TBtn icon={Code} title="Code block" onClick={() => block('pre')} />
        <TDivider />
        <TBtn icon={Link2} title="Insert link" onClick={openLinkModal} />
        <TBtn icon={Minus} title="Horizontal separator" onClick={() => exec('insertHorizontalRule')} />
        <TBtn icon={Table} title="Insert table (3×3 — edit cells directly)" onClick={insertTable} />
        <TBtn
          icon={ImagePlus}
          title="Insert image"
          onClick={() => { saveSelection(); setImgModal({ open: true, initial: null, target: null }); }}
        />
        <TDivider />
        <TBtn icon={Undo2} title="Undo" onClick={() => exec('undo')} />
        <TBtn icon={Redo2} title="Redo" onClick={() => exec('redo')} />
        <TBtn icon={Eraser} title="Clear formatting" onClick={() => { exec('removeFormat'); exec('unlink'); }} />
      </div>

      {/* editable surface */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Article body — visual editor"
          data-placeholder="Write your article… use the toolbar for headings, lists and images. Click any image to edit it."
          onInput={emit}
          onBlur={emit}
          onPaste={onPaste}
          onClick={onEditorClick}
          className="editor-surface min-h-[420px] px-5 py-4 outline-none sm:px-7 sm:py-6"
        />
      </div>

      <ImageSettingsModal
        open={imgModal.open}
        initial={imgModal.initial}
        isEditing={Boolean(imgModal.target)}
        onClose={() => setImgModal({ open: false, initial: null, target: null })}
        onApply={applyFigure}
        onRemove={removeFigure}
      />
      <LinkModal
        open={linkModal.open}
        text={linkModal.text}
        onClose={() => setLinkModal({ open: false, text: '' })}
        onApply={applyLink}
      />
    </div>
  );
};

// ------------------------------------------------------------------ HTML source editor
export const HtmlSourceEditor: React.FC<{
  html: string;
  onChange: (html: string) => void;
}> = ({ html, onChange }) => {
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.currentTarget;
      const { selectionStart: s, selectionEnd: en } = el;
      const next = `${html.slice(0, s)}  ${html.slice(en)}`;
      onChange(next);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 2; });
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] bg-[#F8FAFC]/70 px-3 py-1.5">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#475569]">
          <Braces size={12} className="text-[#8F6B2D]" /> HTML / Source
        </p>
        <Badge tone="zinc">sanitized on save · scripts &amp; event handlers stripped</Badge>
      </div>
      <Textarea
        value={html}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        aria-label="Article body — HTML source"
        spellCheck={false}
        placeholder={'<h2>Section heading</h2>\n<p>Article paragraph…</p>\n<ul>\n  <li>Item</li>\n</ul>'}
        className="editor-surface min-h-[460px] flex-1 rounded-none border-0 bg-[#0B1220] font-mono text-[12.5px] leading-relaxed text-[#D7E2F1]"
        style={{ colorScheme: 'dark' }}
      />
      <p className="border-t border-[#E2E8F0] bg-[#F8FAFC]/70 px-3 py-1.5 text-[10.5px] text-[#64748B]">
        Allowed vocabulary: p · h2-h4 · strong · em · u · blockquote · ul/ol/li · a · img/figure/figcaption · tables · pre/code · hr.
        Everything else is removed automatically — the visual editor reads this HTML back on switch.
      </p>
    </div>
  );
};
