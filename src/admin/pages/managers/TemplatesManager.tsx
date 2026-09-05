// =============================================================================
// BRANIFY ADMIN — Template Library manager (collection: templates)
// Rows merge over the public /templates registry by slug (contentOverrides).
// status='draft' removes a template from the public site (no archived column).
// =============================================================================
import React from 'react';
import { Eye, LayoutTemplate, Star } from 'lucide-react';
import type { AdminPageProps } from '../../lib/auth';
import type { TemplateRow } from '../../lib/types';
import { timeAgo } from '../../lib/format';
import { Badge } from '../../ui';
import type { Column } from '../../ui/DataTable';
import { makeCrudPage } from './crudShared';
import { TEMPLATE_CATEGORIES } from '../../../data/templates';

const CATEGORY_OPTIONS = TEMPLATE_CATEGORIES.map((c) => ({ value: c.slug, label: c.name }));
const CATEGORY_NAME = new Map(TEMPLATE_CATEGORIES.map((c) => [c.slug, c.name]));
const STATUS_OPTIONS = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
];

const StatusPill: React.FC<{ status: string }> = ({ status }) => (
  <Badge tone={status === 'published' ? 'green' : 'amber'}>{status === 'published' ? 'Published' : 'Draft'}</Badge>
);

const columns: Column<TemplateRow>[] = [
  {
    key: 'name',
    label: 'Template',
    sortable: true,
    render: (r) => (
      <div className="flex min-w-0 items-center gap-2.5">
        {r.thumbnail ? (
          <img
            src={r.thumbnail}
            alt=""
            loading="lazy"
            className="h-9 w-14 shrink-0 rounded-md border border-white/10 bg-[#04070C] object-cover"
          />
        ) : (
          <span className="h-9 w-14 shrink-0 rounded-md border border-white/10 bg-white/[0.03]" aria-hidden="true" />
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold text-[#F5F6F2]">{r.name}</p>
          <p className="truncate font-mono text-[10.5px] text-[#6B7280]">/{r.slug}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'category_slug',
    label: 'Category',
    sortable: true,
    hideOnMobile: true,
    render: (r) => <Badge tone="steel">{CATEGORY_NAME.get(r.category_slug) || r.category_slug || '—'}</Badge>,
  },
  {
    key: 'sort_order',
    label: 'Order',
    sortable: true,
    hideOnMobile: true,
    render: (r) => <span className="tabular-nums text-[#A7AFBA]">{r.sort_order}</span>,
  },
  {
    key: 'featured',
    label: 'Featured',
    render: (r) => (
      <Star size={14} className={r.featured ? 'fill-[#E8C97C] text-[#E8C97C]' : 'text-[#566072]'} />
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: (r) => <StatusPill status={r.status} />,
  },
  {
    key: 'updated_at',
    label: 'Updated',
    sortable: true,
    hideOnMobile: true,
    render: (r) => <span className="text-[#A7AFBA]">{timeAgo(r.updated_at)}</span>,
  },
];

export const TemplatesManager = makeCrudPage<TemplateRow>({
  collection: 'templates',
  title: 'Templates',
  subtitle: 'Template Library (/templates) — rows merge over the compiled registry by slug; drafts leave the public site.',
  entity: 'template',
  plural: 'templates',
  nameKey: 'name',
  slugKey: 'slug',
  icon: LayoutTemplate,
  modalWidth: 'xl',
  defaultSort: 'sort_order',
  defaultDir: 'asc',
  noArchive: true,
  filter: {
    param: 'category_slug',
    label: 'Category',
    options: CATEGORY_OPTIONS,
  },
  columns,
  inlineToggles: [
    {
      title: 'Toggle published / draft',
      icon: Eye,
      activeWhen: (r) => r.status === 'published',
      payloadFor: (r) => ({ status: r.status === 'published' ? 'draft' : 'published' }),
      success: (r) => (r.status === 'published' ? 'Template moved to draft — hidden from the public site.' : 'Template published.'),
    },
    {
      title: 'Toggle featured',
      icon: Star,
      activeWhen: (r) => r.featured,
      payloadFor: (r) => ({ featured: !r.featured }),
      success: (r) => (r.featured ? 'Template unfeatured.' : 'Template featured.'),
    },
  ],
  fields: [
    { kind: 'text', key: 'name', label: 'Name', required: true, placeholder: 'Modern Restaurant', col: 2 },
    { kind: 'text', key: 'slug', label: 'Slug', required: true, autoFrom: 'name', hint: 'Auto-generated from the name.' },
    {
      kind: 'select',
      key: 'category_slug',
      label: 'Category',
      required: true,
      options: CATEGORY_OPTIONS,
      hint: 'Canonical library categories — drives the /templates/<category> route.',
    },
    {
      kind: 'select',
      key: 'status',
      label: 'Status',
      options: STATUS_OPTIONS,
      hint: 'Draft removes the template from the public library.',
    },
    { kind: 'number', key: 'sort_order', label: 'Sort order', placeholder: '0' },
    { kind: 'textarea', key: 'short_description', label: 'Short description', col: 2, rows: 2, counter: 200, hint: 'Card summary on the library and category grids.' },
    { kind: 'textarea', key: 'description', label: 'Description', col: 2, rows: 5 },
    { kind: 'text', key: 'thumbnail', label: 'Thumbnail URL', placeholder: '/templates/modern-restaurant.webp', col: 2 },
    { kind: 'text', key: 'preview_image', label: 'Preview image URL', placeholder: '/templates/modern-restaurant-full.jpg', col: 2 },
    { kind: 'text', key: 'demo_url', label: 'Demo URL', placeholder: 'https://… (live preview link)', col: 2 },
    { kind: 'chips', key: 'tags', label: 'Tags', hint: 'Press Enter or comma to add each tag.', col: 2 },
    { kind: 'toggle', key: 'featured', label: 'Featured' },
  ],
  seo: { ogImage: true },
  defaults: () => ({
    slug: '',
    name: '',
    category_slug: TEMPLATE_CATEGORIES[0]?.slug || '',
    short_description: '',
    description: '',
    thumbnail: '',
    preview_image: '',
    demo_url: '',
    tags: [],
    featured: false,
    status: 'published',
    sort_order: 0,
    seo: { og_image: '' },
  }),
  emptyTitle: 'No templates yet',
  emptyHint: 'Rows added here merge over the compiled template registry by slug and appear on /templates.',
});

export type TemplatesManagerProps = AdminPageProps;
