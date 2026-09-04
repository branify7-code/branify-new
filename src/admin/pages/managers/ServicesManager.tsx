// =============================================================================
// BRANIFY ADMIN — Services manager (collection: services)
// =============================================================================
import React from 'react';
import { Layers, Power, Star } from 'lucide-react';
import type { AdminPageProps } from '../../lib/auth';
import type { ServiceRow } from '../../lib/types';
import { timeAgo } from '../../lib/format';
import { Badge } from '../../ui';
import type { Column } from '../../ui/DataTable';
import { makeCrudPage } from './crudShared';

const CATEGORIES = ['web', 'design', 'branding', 'marketing', 'ai', 'consulting'];

const ActivePill: React.FC<{ on: boolean }> = ({ on }) => (
  <Badge tone={on ? 'green' : 'zinc'}>{on ? 'Active' : 'Inactive'}</Badge>
);

const columns: Column<ServiceRow>[] = [
  {
    key: 'title',
    label: 'Service',
    sortable: true,
    render: (r) => (
      <div className="flex items-center gap-2.5">
        <span className="w-7 shrink-0 font-mono text-[11px] font-bold text-[#C9A45C]">{r.number || '—'}</span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-[#F5F6F2]">{r.title}</p>
          <p className="truncate font-mono text-[10.5px] text-[#6B7280]">/{r.slug}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'category',
    label: 'Category',
    sortable: true,
    render: (r) => <Badge tone="zinc">{r.category || '—'}</Badge>,
  },
  {
    key: 'active',
    label: 'Status',
    render: (r) => <ActivePill on={r.active} />,
  },
  {
    key: 'featured',
    label: 'Featured',
    render: (r) => (
      <Star size={14} className={r.featured ? 'fill-[#E8C97C] text-[#E8C97C]' : 'text-[#566072]'} />
    ),
  },
  {
    key: 'sort_order',
    label: 'Sort',
    sortable: true,
    className: 'tabular-nums',
    hideOnMobile: true,
    render: (r) => <span className="text-[#A7AFBA]">{r.sort_order}</span>,
  },
  {
    key: 'updated_at',
    label: 'Updated',
    sortable: true,
    hideOnMobile: true,
    render: (r) => <span className="text-[#A7AFBA]">{timeAgo(r.updated_at)}</span>,
  },
];

export const ServicesManager = makeCrudPage<ServiceRow>({
  collection: 'services',
  title: 'Services',
  subtitle: 'The service catalog rendered on the public /services page — packages, deliverables and pricing notes.',
  entity: 'service',
  plural: 'services',
  nameKey: 'title',
  slugKey: 'slug',
  icon: Layers,
  defaultSort: 'sort_order',
  defaultDir: 'asc',
  filter: {
    param: 'category',
    label: 'Category',
    options: CATEGORIES.map((c) => ({ value: c, label: c })),
  },
  columns,
  inlineToggles: [
    {
      title: 'Toggle active',
      icon: Power,
      activeWhen: (r) => r.active,
      payloadFor: (r) => ({ active: !r.active }),
      success: (r) => (r.active ? 'Service deactivated.' : 'Service activated.'),
    },
    {
      title: 'Toggle featured',
      icon: Star,
      activeWhen: (r) => r.featured,
      payloadFor: (r) => ({ featured: !r.featured }),
      success: (r) => (r.featured ? 'Service unfeatured.' : 'Service marked as featured.'),
    },
  ],
  fields: [
    { kind: 'text', key: 'title', label: 'Title', required: true, placeholder: 'Website Development', col: 2 },
    { kind: 'text', key: 'slug', label: 'Slug', required: true, autoFrom: 'title', hint: 'Auto-generated from the title — lowercase letters, numbers, dashes.' },
    { kind: 'text', key: 'number', label: 'Number', placeholder: '01', hint: 'Display order badge, e.g. 01.' },
    { kind: 'select', key: 'category', label: 'Category', options: CATEGORIES.map((c) => ({ value: c, label: c })) },
    { kind: 'text', key: 'icon', label: 'Icon', placeholder: 'Globe', hint: 'Lucide icon name shown on the public page.' },
    { kind: 'number', key: 'sort_order', label: 'Sort order', placeholder: '0' },
    { kind: 'text', key: 'subtitle', label: 'Subtitle', col: 2, placeholder: 'One-line tagline' },
    { kind: 'textarea', key: 'description', label: 'Description', col: 2, rows: 4, placeholder: 'Full service description…' },
    { kind: 'text', key: 'stat_label', label: 'Stat label', placeholder: 'Avg. delivery' },
    { kind: 'text', key: 'stat_value', label: 'Stat value', placeholder: '3–6 weeks' },
    { kind: 'text', key: 'price_note', label: 'Price note', placeholder: 'Starting from …', col: 2 },
    { kind: 'chips', key: 'technologies', label: 'Technologies', hint: 'Press Enter to add each technology.', col: 2 },
    { kind: 'chips', key: 'deliverables', label: 'Deliverables', hint: 'Press Enter to add each deliverable.', col: 2 },
    { kind: 'toggle', key: 'active', label: 'Active' },
    { kind: 'toggle', key: 'featured', label: 'Featured' },
  ],
  defaults: () => ({
    slug: '',
    number: '',
    title: '',
    subtitle: '',
    description: '',
    icon: 'Sparkles',
    category: 'web',
    technologies: [],
    deliverables: [],
    stat_label: '',
    stat_value: '',
    price_note: '',
    active: true,
    featured: false,
    sort_order: 0,
    seo: {},
  }),
  payloadFrom: (payload) => ({
    ...payload,
    icon: String(payload.icon || '').trim() || 'Sparkles',
  }),
  emptyTitle: 'No services yet',
  emptyHint: 'The public /services page renders from this catalog — create your first service.',
});

// The generic page honours the AdminPageProps contract (?new=1, navigate, refreshBadges).
export type ServicesManagerProps = AdminPageProps;
