// =============================================================================
// BRANIFY ADMIN — Portfolio manager (collection: portfolio_projects)
// =============================================================================
import React from 'react';
import { Briefcase, Eye, Star } from 'lucide-react';
import type { AdminPageProps } from '../../lib/auth';
import type { PortfolioRow } from '../../lib/types';
import { timeAgo } from '../../lib/format';
import { Badge } from '../../ui';
import type { Column } from '../../ui/DataTable';
import { makeCrudPage } from './crudShared';

const PublishedPill: React.FC<{ published: boolean }> = ({ published }) => (
  <Badge tone={published ? 'green' : 'steel'}>{published ? 'Published' : 'Draft'}</Badge>
);

const columns: Column<PortfolioRow>[] = [
  {
    key: 'title',
    label: 'Project',
    sortable: true,
    render: (r) => (
      <div className="min-w-0">
        <p className="truncate font-semibold text-[#F5F6F2]">{r.title}</p>
        <p className="truncate text-[11px] text-[#6B7280]">{r.client || '—'}</p>
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
    key: 'published',
    label: 'Status',
    render: (r) => <PublishedPill published={r.published} />,
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

export const PortfolioManager = makeCrudPage<PortfolioRow>({
  collection: 'portfolio_projects',
  title: 'Portfolio Projects',
  subtitle: 'Case studies for the public /portfolio page — challenge, solution and outcome per project.',
  entity: 'project',
  plural: 'projects',
  nameKey: 'title',
  slugKey: 'slug',
  icon: Briefcase,
  modalWidth: 'xl',
  defaultSort: 'sort_order',
  defaultDir: 'asc',
  columns,
  inlineToggles: [
    {
      title: 'Toggle published',
      icon: Eye,
      activeWhen: (r) => r.published,
      payloadFor: (r) => ({ published: !r.published }),
      success: (r) => (r.published ? 'Project moved to draft.' : 'Project published.'),
    },
    {
      title: 'Toggle featured',
      icon: Star,
      activeWhen: (r) => r.featured,
      payloadFor: (r) => ({ featured: !r.featured }),
      success: (r) => (r.featured ? 'Project unfeatured.' : 'Project marked as featured.'),
    },
  ],
  fields: [
    { kind: 'text', key: 'title', label: 'Title', required: true, placeholder: 'Fintech Dashboard Redesign', col: 2 },
    { kind: 'text', key: 'slug', label: 'Slug', required: true, autoFrom: 'title', hint: 'Auto-generated from the title.' },
    { kind: 'text', key: 'category', label: 'Category', placeholder: 'web' },
    { kind: 'text', key: 'client', label: 'Client', placeholder: 'Acme Inc.' },
    { kind: 'text', key: 'live_url', label: 'Live URL', placeholder: 'https://…', hint: 'Public link to the shipped product (optional).' },
    { kind: 'number', key: 'sort_order', label: 'Sort order', placeholder: '0' },
    { kind: 'text', key: 'hero_image', label: 'Hero image', col: 2, placeholder: 'https://… or css gradient', hint: 'Image URL or a CSS gradient string.' },
    { kind: 'textarea', key: 'description', label: 'Description', col: 2, rows: 4 },
    { kind: 'textarea', key: 'challenge', label: 'Challenge', col: 2, rows: 3 },
    { kind: 'textarea', key: 'solution', label: 'Solution', col: 2, rows: 3 },
    { kind: 'textarea', key: 'outcome', label: 'Outcome', col: 2, rows: 3 },
    { kind: 'chips', key: 'gallery', label: 'Gallery', hint: 'Image URLs — press Enter to add each one.', col: 2 },
    { kind: 'chips', key: 'technologies', label: 'Technologies', hint: 'Press Enter to add each technology.', col: 2 },
    { kind: 'toggle', key: 'published', label: 'Published' },
    { kind: 'toggle', key: 'featured', label: 'Featured' },
  ],
  defaults: () => ({
    slug: '',
    title: '',
    category: '',
    client: '',
    description: '',
    hero_image: '',
    gallery: [],
    technologies: [],
    challenge: '',
    solution: '',
    outcome: '',
    live_url: '',
    featured: false,
    published: true,
    sort_order: 0,
    seo: {},
  }),
  emptyTitle: 'No projects yet',
  emptyHint: 'Case studies published here appear on the public /portfolio page.',
});

export type PortfolioManagerProps = AdminPageProps;
