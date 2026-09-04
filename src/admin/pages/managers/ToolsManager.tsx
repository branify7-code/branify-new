// =============================================================================
// BRANIFY ADMIN — Free tools manager (collection: tools, 136 seeded rows)
// =============================================================================
import React from 'react';
import { Flame, Power, Star, Wrench } from 'lucide-react';
import type { AdminPageProps } from '../../lib/auth';
import type { ToolRow } from '../../lib/types';
import { timeAgo } from '../../lib/format';
import { Badge } from '../../ui';
import type { Column } from '../../ui/DataTable';
import { makeCrudPage } from './crudShared';

const TOOL_CATEGORIES = [
  'PDF Tools',
  'Image Tools',
  'Text & Content Tools',
  'Developer Tools',
  'SEO Tools',
  'Business Tools',
  'Finance Tools',
  'Marketing Tools',
  'Security & Utility Tools',
];

const INPUT_TYPES = ['file', 'image', 'textarea', 'text', 'form', 'none'];

const BoolPill: React.FC<{ on: boolean; label: string }> = ({ on, label }) => (
  <Badge tone={on ? 'green' : 'zinc'}>{label}</Badge>
);

const columns: Column<ToolRow>[] = [
  {
    key: 'name',
    label: 'Tool',
    sortable: true,
    render: (r) => (
      <div className="min-w-0">
        <p className="truncate font-semibold text-[#F5F6F2]">{r.name}</p>
        <p className="truncate font-mono text-[10.5px] text-[#6B7280]">{r.url || `/${r.slug}`}</p>
      </div>
    ),
  },
  {
    key: 'category',
    label: 'Category',
    sortable: true,
    render: (r) => <Badge tone="steel">{r.category || '—'}</Badge>,
  },
  {
    key: 'active',
    label: 'Status',
    render: (r) => (
      <div className="flex flex-wrap items-center gap-1">
        <BoolPill on={r.active} label={r.active ? 'Active' : 'Off'} />
        {r.featured && <Badge tone="gold">Featured</Badge>}
        {r.popular && <Badge tone="violet">Popular</Badge>}
      </div>
    ),
  },
  {
    key: 'updated_at',
    label: 'Updated',
    sortable: true,
    hideOnMobile: true,
    render: (r) => <span className="text-[#A7AFBA]">{timeAgo(r.updated_at)}</span>,
  },
];

export const ToolsManager = makeCrudPage<ToolRow>({
  collection: 'tools',
  title: 'Free Tools',
  subtitle: '136 browser tools under /tools — search, filter and edit the registry that powers the public directory.',
  entity: 'tool',
  plural: 'tools',
  nameKey: 'name',
  slugKey: 'slug',
  icon: Wrench,
  defaultSort: 'sort_order',
  defaultDir: 'asc',
  filter: {
    param: 'category',
    label: 'Category',
    options: TOOL_CATEGORIES.map((c) => ({ value: c, label: c })),
  },
  columns,
  inlineToggles: [
    {
      title: 'Toggle active',
      icon: Power,
      activeWhen: (r) => r.active,
      payloadFor: (r) => ({ active: !r.active }),
      success: (r) => (r.active ? 'Tool deactivated.' : 'Tool activated.'),
    },
    {
      title: 'Toggle featured',
      icon: Star,
      activeWhen: (r) => r.featured,
      payloadFor: (r) => ({ featured: !r.featured }),
      success: (r) => (r.featured ? 'Tool unfeatured.' : 'Tool featured.'),
    },
    {
      title: 'Toggle popular',
      icon: Flame,
      activeWhen: (r) => r.popular,
      payloadFor: (r) => ({ popular: !r.popular }),
      success: (r) => (r.popular ? 'Popular badge removed.' : 'Tool marked popular.'),
    },
  ],
  fields: [
    { kind: 'text', key: 'name', label: 'Name', required: true, placeholder: 'PDF Merger', col: 2 },
    { kind: 'text', key: 'slug', label: 'Slug', required: true, autoFrom: 'name', hint: 'Auto-generated from the name.' },
    { kind: 'select', key: 'category', label: 'Category', options: TOOL_CATEGORIES.map((c) => ({ value: c, label: c })) },
    { kind: 'select', key: 'input_type', label: 'Input type', options: INPUT_TYPES.map((t) => ({ value: t, label: t })) },
    { kind: 'text', key: 'icon', label: 'Icon', placeholder: 'FileText', hint: 'Lucide icon name.' },
    { kind: 'number', key: 'sort_order', label: 'Sort order', placeholder: '0' },
    { kind: 'text', key: 'url', label: 'URL', placeholder: '/tools/pdf-merger', hint: 'Leave empty to auto-set to /tools/<slug>.', col: 2 },
    { kind: 'textarea', key: 'description', label: 'Description', col: 2, rows: 3 },
    { kind: 'toggle', key: 'active', label: 'Active' },
    { kind: 'toggle', key: 'featured', label: 'Featured' },
    { kind: 'toggle', key: 'popular', label: 'Popular', hint: 'Shows the Popular badge on the directory card.' },
  ],
  defaults: () => ({
    slug: '',
    name: '',
    category: 'PDF Tools',
    description: '',
    icon: 'Wrench',
    url: '',
    input_type: 'text',
    active: true,
    featured: false,
    popular: false,
    sort_order: 0,
    seo: {},
  }),
  seo: { keywords: true },
  payloadFrom: (payload) => ({
    ...payload,
    url: String(payload.url || '').trim() || `/tools/${String(payload.slug || '')}`,
    icon: String(payload.icon || '').trim() || 'Wrench',
  }),
  emptyTitle: 'No tools yet',
  emptyHint: 'The public /free-tools directory renders from this registry.',
});

export type ToolsManagerProps = AdminPageProps;
