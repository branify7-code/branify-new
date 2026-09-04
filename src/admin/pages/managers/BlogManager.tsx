// =============================================================================
// BRANIFY ADMIN — Blog manager (collection: blog_posts)
// =============================================================================
import React from 'react';
import { Eye, Newspaper, Star } from 'lucide-react';
import type { AdminPageProps } from '../../lib/auth';
import type { BlogRow } from '../../lib/types';
import { fmtDate, timeAgo } from '../../lib/format';
import { Badge } from '../../ui';
import type { Column } from '../../ui/DataTable';
import { makeCrudPage } from './crudShared';

const StatusPill: React.FC<{ status: string }> = ({ status }) => (
  <Badge tone={status === 'published' ? 'green' : 'steel'}>{status === 'published' ? 'Published' : 'Draft'}</Badge>
);

const columns: Column<BlogRow>[] = [
  {
    key: 'title',
    label: 'Post',
    sortable: true,
    render: (r) => (
      <div className="min-w-0">
        <p className="truncate font-semibold text-[#F5F6F2]">{r.title}</p>
        <p className="truncate text-[11px] text-[#6B7280]">By {r.author_name || '—'}</p>
      </div>
    ),
  },
  {
    key: 'category',
    label: 'Category',
    sortable: true,
    hideOnMobile: true,
    render: (r) => <Badge tone="zinc">{r.category || '—'}</Badge>,
  },
  {
    key: 'status',
    label: 'Status',
    render: (r) => <StatusPill status={r.status} />,
  },
  {
    key: 'published_at',
    label: 'Published',
    sortable: true,
    hideOnMobile: true,
    render: (r) => <span className="text-[#A7AFBA]">{fmtDate(r.published_at)}</span>,
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

export const BlogManager = makeCrudPage<BlogRow>({
  collection: 'blog_posts',
  title: 'Blog Posts',
  subtitle: 'Insights & strategy articles for the public /blog — markdown body, tags and SEO.',
  entity: 'post',
  plural: 'posts',
  nameKey: 'title',
  slugKey: 'slug',
  icon: Newspaper,
  modalWidth: 'xl',
  defaultSort: 'created_at',
  defaultDir: 'desc',
  filter: {
    param: 'status',
    label: 'Status',
    options: [
      { value: 'draft', label: 'Draft' },
      { value: 'published', label: 'Published' },
    ],
  },
  columns,
  inlineToggles: [
    {
      title: 'Toggle published / draft',
      icon: Eye,
      activeWhen: (r) => r.status === 'published',
      payloadFor: (r) => ({ status: r.status === 'published' ? 'draft' : 'published' }),
      success: (r) => (r.status === 'published' ? 'Post moved back to draft.' : 'Post published.'),
    },
    {
      title: 'Toggle featured',
      icon: Star,
      activeWhen: (r) => r.featured,
      payloadFor: (r) => ({ featured: !r.featured }),
      success: (r) => (r.featured ? 'Post unfeatured.' : 'Post featured.'),
    },
  ],
  fields: [
    { kind: 'text', key: 'title', label: 'Title', required: true, placeholder: 'How to scale a brand in 2026', col: 2 },
    { kind: 'text', key: 'slug', label: 'Slug', required: true, autoFrom: 'title', hint: 'Auto-generated from the title.' },
    { kind: 'text', key: 'category', label: 'Category', placeholder: 'marketing' },
    {
      kind: 'select',
      key: 'status',
      label: 'Status',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'published', label: 'Published' },
      ],
    },
    { kind: 'text', key: 'author_name', label: 'Author name', placeholder: 'BRANIFY Team' },
    { kind: 'text', key: 'author_role', label: 'Author role', placeholder: 'Growth Strategist' },
    { kind: 'date', key: 'published_at', label: 'Published date', hint: 'Leave empty for an unscheduled draft.' },
    { kind: 'text', key: 'cover_image', label: 'Cover image URL', placeholder: 'https://…', col: 2 },
    { kind: 'textarea', key: 'excerpt', label: 'Excerpt', col: 2, rows: 3, counter: 200, hint: 'Short summary used on cards and meta description fallback.' },
    {
      kind: 'code',
      key: 'content',
      label: 'Content (Markdown)',
      col: 2,
      rows: 16,
      placeholder: '## Heading\n\nParagraph…\n\n- list item',
      hint: 'Markdown: ## / ### headings, **bold**, `code`, - lists.',
    },
    { kind: 'chips', key: 'tags', label: 'Tags', hint: 'Press Enter to add each tag.', col: 2 },
    { kind: 'toggle', key: 'featured', label: 'Featured' },
  ],
  defaults: () => ({
    slug: '',
    title: '',
    excerpt: '',
    content: '',
    cover_image: '',
    author_name: 'BRANIFY Team',
    author_role: '',
    published_at: '',
    category: '',
    tags: [],
    status: 'draft',
    featured: false,
    seo: {},
  }),
  emptyTitle: 'No posts yet',
  emptyHint: 'Write your first article — published posts appear instantly on the public /blog.',
});

export type BlogManagerProps = AdminPageProps;
