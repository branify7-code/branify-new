// =============================================================================
// BRANIFY ADMIN — Products manager (collection: products / free templates & kits)
// =============================================================================
import React from 'react';
import { Package, Star } from 'lucide-react';
import type { AdminPageProps } from '../../lib/auth';
import type { ProductRow } from '../../lib/types';
import { fmtPrice, timeAgo } from '../../lib/format';
import { Badge } from '../../ui';
import type { Column } from '../../ui/DataTable';
import { makeCrudPage } from './crudShared';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'PKR', 'AED'];
const STATUSES = ['active', 'coming_soon', 'archived'];

const statusTone = (s: string) => (s === 'active' ? 'green' : s === 'coming_soon' ? 'amber' : 'zinc');
const statusLabel = (s: string) => (s === 'coming_soon' ? 'Coming soon' : s === 'archived' ? 'Archived' : 'Active');

const columns: Column<ProductRow>[] = [
  {
    key: 'name',
    label: 'Product',
    sortable: true,
    render: (r) => (
      <div className="min-w-0">
        <p className="truncate font-semibold text-[#F5F6F2]">{r.name}</p>
        <p className="truncate font-mono text-[10.5px] text-[#6B7280]">/{r.slug}</p>
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
    key: 'price',
    label: 'Price',
    render: (r) => (
      <span className={r.price === 0 ? 'font-semibold text-emerald-300' : 'text-[#F5F6F2]'}>
        {fmtPrice(r.price, r.currency || 'USD')}
      </span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: (r) => <Badge tone={statusTone(r.status)}>{statusLabel(r.status)}</Badge>,
  },
  {
    key: 'featured',
    label: 'Featured',
    render: (r) => (
      <Star size={14} className={r.featured ? 'fill-[#E8C97C] text-[#E8C97C]' : 'text-[#566072]'} />
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

export const ProductsManager = makeCrudPage<ProductRow>({
  collection: 'products',
  title: 'Products',
  subtitle: 'Downloadable products & kits — free templates, brand assets and paid files.',
  entity: 'product',
  plural: 'products',
  nameKey: 'name',
  slugKey: 'slug',
  icon: Package,
  defaultSort: 'sort_order',
  defaultDir: 'asc',
  filter: {
    param: 'status',
    label: 'Status',
    options: STATUSES.map((s) => ({ value: s, label: statusLabel(s) })),
  },
  columns,
  inlineToggles: [
    {
      title: 'Toggle featured',
      icon: Star,
      activeWhen: (r) => r.featured,
      payloadFor: (r) => ({ featured: !r.featured }),
      success: (r) => (r.featured ? 'Product unfeatured.' : 'Product featured.'),
    },
  ],
  fields: [
    { kind: 'text', key: 'name', label: 'Name', required: true, placeholder: 'Brand Identity Kit', col: 2 },
    { kind: 'text', key: 'slug', label: 'Slug', required: true, autoFrom: 'name', hint: 'Auto-generated from the name.' },
    { kind: 'text', key: 'category', label: 'Category', placeholder: 'website' },
    { kind: 'select', key: 'status', label: 'Status', options: STATUSES.map((s) => ({ value: s, label: statusLabel(s) })) },
    { kind: 'number', key: 'price', label: 'Price', placeholder: '0', hint: '0 = free.' },
    { kind: 'select', key: 'currency', label: 'Currency', options: CURRENCIES.map((c) => ({ value: c, label: c })) },
    { kind: 'text', key: 'image', label: 'Image URL', placeholder: 'https://…', col: 2 },
    { kind: 'textarea', key: 'description', label: 'Description', col: 2, rows: 4 },
    { kind: 'text', key: 'file_url', label: 'File URL', placeholder: 'https://… or /downloads/…', col: 2 },
    { kind: 'textarea', key: 'delivery_info', label: 'Delivery info', col: 2, rows: 2, hint: 'How the buyer receives the files.' },
    { kind: 'number', key: 'sort_order', label: 'Sort order', placeholder: '0' },
    { kind: 'toggle', key: 'featured', label: 'Featured' },
  ],
  defaults: () => ({
    slug: '',
    name: '',
    category: '',
    description: '',
    image: '',
    price: 0,
    currency: 'USD',
    status: 'active',
    delivery_info: '',
    file_url: '',
    featured: false,
    sort_order: 0,
    seo: {},
  }),
  emptyTitle: 'No products yet',
  emptyHint: 'Products published here appear in the public downloads section.',
});

export type ProductsManagerProps = AdminPageProps;
