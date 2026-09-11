// =============================================================================
// BRANIFY ADMIN — internal link candidates + validation (AI blog generator)
// -----------------------------------------------------------------------------
// • Candidate list: built from the EXISTING site registries (services, free
//   tools, free templates) + the known static routes — sent to the AI endpoint
//   so the model can only ever reference real routes.
// • Validation/stripping: delegated to the EXISTING registry-backed checkLink()
//   from the Blog Editor SEO panel (services/tools/ai-tools/blog/portfolio/
//   free-templates registries) — one source of truth, no duplicated logic.
// =============================================================================

import { servicesRegistry } from '../../data/servicesRegistry';
import { toolsRegistry } from '../../data/toolsRegistry';
import { freeTemplates } from '../../data/freeTemplatesRegistry';
import { STATIC_ROUTES, checkLink } from '../pages/managers/BlogEditorSeo';

export interface LinkCandidate {
  path: string;
  label: string;
  group: string;
}

const MAX_TOOL_LINKS = 45;

/** Real internal routes, capped to a prompt-friendly size (≈120 paths). */
export function buildInternalLinkCandidates(): LinkCandidate[] {
  const out: LinkCandidate[] = [];
  for (const p of STATIC_ROUTES) {
    if (p === '/') continue; // homepage links are rarely useful inside articles
    out.push({ path: p, label: p, group: 'Static routes' });
  }
  for (const s of servicesRegistry) {
    out.push({ path: `/services/${s.slug}`, label: s.name, group: 'Services' });
  }
  // Tools: featured/popular first so the most useful utilities fit in the cap
  const tools = [...toolsRegistry]
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || Number(Boolean(b.popular)) - Number(Boolean(a.popular)))
    .slice(0, MAX_TOOL_LINKS);
  for (const t of tools) {
    out.push({ path: `/tools/${t.slug}`, label: t.name, group: 'Free tools' });
  }
  for (const f of freeTemplates) {
    out.push({ path: `/free-templates/${f.slug}`, label: f.title || f.slug, group: 'Free templates' });
  }
  return out;
}

/** hrefs of <a> anchors inside article HTML. */
export function hrefsOfHtml(html: string): string[] {
  const out: string[] = [];
  const re = /<a\b[^>]*href\s*=\s*("([^"]*)"|'([^']*)')/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) out.push(m[2] ?? m[3] ?? '');
  return out;
}

export interface InternalLinkReport {
  valid: Array<{ href: string; note: string }>;
  invalid: Array<{ href: string; note: string }>;
}

/**
 * Split INTERNAL links of an article HTML body into valid/invalid using the
 * existing registry-backed checkLink(). External links are ignored here
 * (the LinkCheckPanel in the SEO tab reports them separately).
 */
export function validateInternalLinksHtml(html: string): InternalLinkReport {
  const report: InternalLinkReport = { valid: [], invalid: [] };
  const seen = new Set<string>();
  for (const href of hrefsOfHtml(html)) {
    if (!href.startsWith('/') || seen.has(href)) continue;
    seen.add(href);
    const res = checkLink(href, href);
    if (res.state === 'ok') report.valid.push({ href, note: res.note });
    else report.invalid.push({ href, note: res.note });
  }
  return report;
}

/** Remove internal <a> anchors whose href fails the registry check (text kept). */
export function stripInvalidInternalLinksHtml(html: string): string {
  return html.replace(/<a\b([^>]*)href\s*=\s*("([^"]*)"|'([^']*)')([\s\S]*?)>([\s\S]*?)<\/a>/gi,
    (full, _pre: string, _q: string, dq: string | undefined, sq: string | undefined, _post: string, inner: string) => {
      const href = dq ?? sq ?? '';
      if (!href.startsWith('/')) return full; // external — untouched
      return checkLink(href, inner).state === 'ok' ? full : inner;
    });
}
