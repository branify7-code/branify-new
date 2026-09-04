// =============================================================================
// BRANIFY ADMIN — AI tools manager (collection: ai_tools, 26 seeded rows)
// =============================================================================
import React from 'react';
import { Bot, Power, Star } from 'lucide-react';
import type { AdminPageProps } from '../../lib/auth';
import type { AiToolRow } from '../../lib/types';
import { timeAgo } from '../../lib/format';
import { Badge } from '../../ui';
import type { Column } from '../../ui/DataTable';
import { makeCrudPage } from './crudShared';

const KNOWN_CATEGORIES = [
  'Chat Assistants',
  'Writing & Content',
  'Image Generation',
  'Video Generation',
  'Voice & Audio',
  'Coding',
  'No-code Builders',
  'Productivity & Research',
  'Automation',
];

const PRICING = ['Free', 'Freemium', 'Paid'];

const PricingPill: React.FC<{ pricing: string }> = ({ pricing }) => (
  <Badge tone={pricing === 'Free' ? 'green' : pricing === 'Freemium' ? 'violet' : 'amber'}>
    {pricing || '—'}
  </Badge>
);

const columns: Column<AiToolRow>[] = [
  {
    key: 'name',
    label: 'AI Tool',
    sortable: true,
    render: (r) => (
      <div className="min-w-0">
        <p className="truncate font-semibold text-[#F5F6F2]">{r.name}</p>
        <p className="truncate font-mono text-[10.5px] text-[#6B7280]">{r.url || r.slug}</p>
      </div>
    ),
  },
  {
    key: 'category',
    label: 'Category',
    sortable: true,
    hideOnMobile: true,
    render: (r) => <Badge tone="steel">{r.category || '—'}</Badge>,
  },
  {
    key: 'pricing',
    label: 'Pricing',
    render: (r) => <PricingPill pricing={r.pricing} />,
  },
  {
    key: 'active',
    label: 'Status',
    render: (r) => (
      <div className="flex flex-wrap items-center gap-1">
        <Badge tone={r.active ? 'green' : 'zinc'}>{r.active ? 'Active' : 'Off'}</Badge>
        {r.featured && <Badge tone="gold">Featured</Badge>}
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

export const AIToolsManager = makeCrudPage<AiToolRow>({
  collection: 'ai_tools',
  title: 'AI Tools',
  subtitle: 'The curated AI directory at /ai-tools — external tools with pricing tiers.',
  entity: 'AI tool',
  plural: 'AI tools',
  nameKey: 'name',
  slugKey: 'slug',
  icon: Bot,
  defaultSort: 'sort_order',
  defaultDir: 'asc',
  filter: {
    param: 'pricing',
    label: 'Pricing',
    options: PRICING.map((p) => ({ value: p, label: p })),
  },
  columns,
  inlineToggles: [
    {
      title: 'Toggle active',
      icon: Power,
      activeWhen: (r) => r.active,
      payloadFor: (r) => ({ active: !r.active }),
      success: (r) => (r.active ? 'AI tool deactivated.' : 'AI tool activated.'),
    },
    {
      title: 'Toggle featured',
      icon: Star,
      activeWhen: (r) => r.featured,
      payloadFor: (r) => ({ featured: !r.featured }),
      success: (r) => (r.featured ? 'AI tool unfeatured.' : 'AI tool featured.'),
    },
  ],
  fields: [
    { kind: 'text', key: 'name', label: 'Name', required: true, placeholder: 'ChatGPT', col: 2 },
    { kind: 'text', key: 'slug', label: 'Slug', required: true, autoFrom: 'name', hint: 'Auto-generated from the name.' },
    {
      kind: 'text',
      key: 'category',
      label: 'Category',
      placeholder: 'Chat Assistants',
      hint: `Known: ${KNOWN_CATEGORIES.join(', ')}`,
    },
    { kind: 'select', key: 'pricing', label: 'Pricing', options: PRICING.map((p) => ({ value: p, label: p })) },
    { kind: 'text', key: 'url', label: 'URL', required: true, placeholder: 'https://chat.openai.com', hint: 'External tool link (opens in a new tab).', col: 2 },
    { kind: 'textarea', key: 'description', label: 'Description', col: 2, rows: 3 },
    { kind: 'number', key: 'sort_order', label: 'Sort order', placeholder: '0' },
    { kind: 'toggle', key: 'active', label: 'Active' },
    { kind: 'toggle', key: 'featured', label: 'Featured' },
  ],
  defaults: () => ({
    slug: '',
    name: '',
    category: '',
    description: '',
    url: '',
    pricing: 'Free',
    active: true,
    featured: false,
    sort_order: 0,
    seo: {},
  }),
  emptyTitle: 'No AI tools yet',
  emptyHint: 'The public /ai-tools directory renders from this registry.',
});

export type AIToolsManagerProps = AdminPageProps;
