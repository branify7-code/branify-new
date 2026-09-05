// =============================================================================
// BRANIFY ADMIN — Template Categories manager (collection: template_categories)
// Simpler CRUD over the 16 canonical /templates categories. SEO fields map to
// flat DB columns (seo_title / seo_description / og_image) via rowToForm /
// payloadFrom — the shared engine edits them through the standard SEO block.
// =============================================================================
import React from 'react';
import { FolderTree, Power } from 'lucide-react';
import type { AdminPageProps } from '../../lib/auth';
import type { TemplateCategoryRow, SeoMeta } from '../../lib/types';
import { timeAgo } from '../../lib/format';
import { Badge } from '../../ui';
import type { Column } from '../../ui/DataTable';
import { makeCrudPage, asStr } from './crudShared';

const columns: Column<TemplateCategoryRow>[] = [
  {
    key: 'name',
    label: 'Category',
    sortable: true,
    render: (r) => (
      <div className="min-w-0">
        <p className="truncate font-semibold text-[#F5F6F2]">{r.name}</p>
        <p className="truncate font-mono text-[10.5px] text-[#6B7280]">/templates/{r.slug}</p>
      </div>
    ),
  },
  {
    key: 'tagline',
    label: 'Tagline',
    hideOnMobile: true,
    render: (r) => <span className="text-[#A7AFBA]">{r.tagline || '—'}</span>,
  },
  {
    key: 'sort_order',
    label: 'Order',
    sortable: true,
    hideOnMobile: true,
    render: (r) => <span className="tabular-nums text-[#A7AFBA]">{r.sort_order}</span>,
  },
  {
    key: 'active',
    label: 'Active',
    render: (r) => <Badge tone={r.active ? 'green' : 'zinc'}>{r.active ? 'Active' : 'Inactive'}</Badge>,
  },
  {
    key: 'updated_at',
    label: 'Updated',
    sortable: true,
    hideOnMobile: true,
    render: (r) => <span className="text-[#A7AFBA]">{timeAgo(r.updated_at)}</span>,
  },
];

export const TemplateCategoriesManager = makeCrudPage<TemplateCategoryRow>({
  collection: 'template_categories',
  title: 'Template Categories',
  subtitle: 'The 16 canonical Template Library categories — tagline, hero copy, SEO and ordering.',
  entity: 'category',
  plural: 'categories',
  nameKey: 'name',
  slugKey: 'slug',
  icon: FolderTree,
  defaultSort: 'sort_order',
  defaultDir: 'asc',
  noArchive: true,
  columns,
  inlineToggles: [
    {
      title: 'Toggle active / inactive',
      icon: Power,
      activeWhen: (r) => r.active,
      payloadFor: (r) => ({ active: !r.active }),
      success: (r) => (r.active ? 'Category deactivated.' : 'Category activated.'),
    },
  ],
  fields: [
    { kind: 'text', key: 'name', label: 'Name', required: true, placeholder: 'Restaurant & Food', col: 2 },
    { kind: 'text', key: 'slug', label: 'Slug', required: true, autoFrom: 'name', hint: 'Auto-generated from the name.' },
    { kind: 'text', key: 'tagline', label: 'Tagline', col: 2, placeholder: 'Fine dining, bistros and street food brands.' },
    { kind: 'textarea', key: 'hero_description', label: 'Hero description', col: 2, rows: 4, hint: 'Intro paragraph on the category page.' },
    { kind: 'text', key: 'image', label: 'Image URL', placeholder: '/templates/… or https://…', col: 2 },
    { kind: 'number', key: 'sort_order', label: 'Sort order', placeholder: '0' },
    { kind: 'toggle', key: 'active', label: 'Active' },
  ],
  seo: { ogImage: true },
  rowToForm: (row) => ({
    ...row,
    active: Boolean(row.active),
    sort_order: String(row.sort_order ?? 0),
    seo: {
      title: asStr(row.seo_title),
      description: asStr(row.seo_description),
      og_image: asStr(row.og_image),
    } as SeoMeta,
  }),
  payloadFrom: (payload) => {
    const seo = (payload.seo || {}) as { title?: string; description?: string; og_image?: string };
    const { seo: _seo, ...rest } = payload;
    return {
      ...rest,
      seo_title: asStr(seo.title).trim(),
      seo_description: asStr(seo.description).trim(),
      og_image: asStr(seo.og_image).trim(),
    };
  },
  defaults: () => ({
    slug: '',
    name: '',
    tagline: '',
    hero_description: '',
    image: '',
    active: true,
    sort_order: 0,
    seo: { og_image: '' },
  }),
  emptyTitle: 'No categories yet',
  emptyHint: 'Create the canonical categories that group the Template Library at /templates.',
});

export type TemplateCategoriesManagerProps = AdminPageProps;
