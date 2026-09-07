// =============================================================================
// BRANIFY ADMIN — Blog manager (collection: blog_posts)
// -----------------------------------------------------------------------------
// Route hub:
//   /blog             → post list (shared CRUD table)
//   /blog?post=new    → full-page Blog Editor (CMS-style, visual + HTML)
//   /blog?post=<id>   → full-page Blog Editor for an existing post
// =============================================================================
import React from 'react';
import { Eye, Newspaper, Star } from 'lucide-react';
import type { AdminPageProps } from '../../lib/auth';
import type { BlogRow } from '../../lib/types';
import { fmtDate, timeAgo } from '../../lib/format';
import { Badge } from '../../ui';
import type { Column } from '../../ui/DataTable';
import { makeCrudPage } from './crudShared';
import { BlogEditor } from './BlogEditor';

const StatusPill: React.FC<{ row: BlogRow }> = ({ row }) => {
  const scheduled = row.status === 'published' && row.published_at
    && new Date(row.published_at).getTime() > Date.now();
  if (scheduled) return <Badge tone="violet">Scheduled</Badge>;
  return <Badge tone={row.status === 'published' ? 'green' : 'steel'}>{row.status === 'published' ? 'Published' : 'Draft'}</Badge>;
};

const columns: Column<BlogRow>[] = [
  {
    key: 'title',
    label: 'Post',
    sortable: true,
    render: (r) => (
      <div className="min-w-0">
        <p className="truncate font-semibold text-[#111827]">{r.title}</p>
        <p className="truncate text-[11px] text-[#64748B]">By {r.author_name || '—'}</p>
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
    render: (r) => <StatusPill row={r} />,
  },
  {
    key: 'published_at',
    label: 'Published',
    sortable: true,
    hideOnMobile: true,
    render: (r) => <span className="text-[#475569]">{fmtDate(r.published_at)}</span>,
  },
  {
    key: 'featured',
    label: 'Featured',
    render: (r) => (
      <Star size={14} className={r.featured ? 'fill-[#E8C97C] text-[#8F6B2D]' : 'text-[#64748B]'} />
    ),
  },
  {
    key: 'updated_at',
    label: 'Updated',
    sortable: true,
    hideOnMobile: true,
    render: (r) => <span className="text-[#475569]">{timeAgo(r.updated_at)}</span>,
  },
];

const ListPage = makeCrudPage<BlogRow>({
  collection: 'blog_posts',
  title: 'Blog Posts',
  subtitle: 'Insights & strategy articles for the public /blog — CMS editor with HTML mode, media library, SEO audit and Search Console area.',
  entity: 'post',
  plural: 'posts',
  nameKey: 'title',
  slugKey: 'slug',
  icon: Newspaper,
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
  openEditor: (row) => navBridge.current(row ? `/blog?post=${row.id}` : '/blog?post=new'),
});

/** Module-level navigation bridge — the list config routes New/Edit here. */
const navBridge: { current: (pathUnderAdmin: string) => void } = { current: () => {} };

export const BlogManager: React.FC<AdminPageProps> = (props) => {
  const postId = props.query.get('post');
  navBridge.current = props.navigate;

  if (postId) {
    return <BlogEditor postId={postId === 'new' ? null : postId} {...props} />;
  }
  return <ListPage {...props} />;
};

export type BlogManagerProps = AdminPageProps;
