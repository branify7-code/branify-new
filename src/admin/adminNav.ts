// =============================================================================
// BRANIFY ADMIN — navigation model (sidebar groups, titles, breadcrumbs)
// Order follows the product spec §4 (+ template library extension):
//   Dashboard · Services · Portfolio · Free Tools · AI Tools · Products ·
//   Templates · Template Categories · Blog · Customers · Leads · Payments ·
//   SEO · Analytics · Performance · Media · Settings
//   (+ bottom: Admin Profile · Logout, rendered in shell)
// SEO sub-modules (Sitemap / Redirects / 404 Monitor) are reached from the
// SEO Center hub; PWA lives as a Settings tab. Both keep deep-link routes.
// =============================================================================
import type { LucideIcon } from 'lucide-react';
import {
  Activity, BarChart3, Briefcase, CreditCard, FileText,
  FolderKanban, FolderTree, Gauge, HeartPulse, Image as ImageIcon, LayoutDashboard,
  LayoutTemplate, Search, Settings, ShoppingBag, Sparkles, Users, Wrench,
} from 'lucide-react';

export interface AdminNavItem {
  path: string;              // path under /admin, e.g. '/services'
  label: string;
  icon: LucideIcon;
  badgeKey?: 'leads_new' | 'not_found';
  end?: boolean;             // exact match
}

export interface AdminNavGroup {
  id: string;
  label?: string;            // section caption (undefined = plain group)
  items: AdminNavItem[];
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    id: 'main',
    items: [{ path: '', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    id: 'content',
    label: 'Content',
    items: [
      { path: '/services', label: 'Services', icon: Briefcase },
      { path: '/portfolio', label: 'Portfolio', icon: FolderKanban },
      { path: '/tools', label: 'Free Tools', icon: Wrench },
      { path: '/ai-tools', label: 'AI Tools', icon: Sparkles },
      { path: '/products', label: 'Products', icon: ShoppingBag },
      { path: '/templates', label: 'Templates', icon: LayoutTemplate },
      { path: '/template-categories', label: 'Template Categories', icon: FolderTree },
      { path: '/blog', label: 'Blog', icon: FileText },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    items: [
      { path: '/customers', label: 'Customers', icon: Users },
      { path: '/leads', label: 'Leads', icon: Users, badgeKey: 'leads_new' },
      { path: '/payments', label: 'Payments', icon: CreditCard },
    ],
  },
  {
    id: 'growth',
    label: 'Growth & SEO',
    items: [
      { path: '/seo', label: 'SEO', icon: Search, badgeKey: 'not_found' },
      { path: '/analytics', label: 'Analytics', icon: BarChart3 },
      { path: '/performance', label: 'Performance', icon: Gauge },
    ],
  },
  {
    id: 'site',
    label: 'Site',
    items: [
      { path: '/media', label: 'Media', icon: ImageIcon },
      { path: '/settings', label: 'Settings', icon: Settings },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { path: '/activity', label: 'Activity Log', icon: Activity },
      { path: '/system', label: 'System Health', icon: HeartPulse },
    ],
  },
];

export function findNav(pathUnderAdmin: string): { item: AdminNavItem; group: AdminNavGroup } | null {
  const clean = pathUnderAdmin.replace(/\/+$/, '');
  for (const group of ADMIN_NAV) {
    for (const item of group.items) {
      if (item.path === clean) return { item, group };
    }
  }
  return null;
}

/** Breadcrumb segments for a path under /admin */
export function breadcrumbsFor(pathUnderAdmin: string): Array<{ label: string; path?: string }> {
  const found = findNav(pathUnderAdmin);
  const crumbs: Array<{ label: string; path?: string }> = [{ label: 'Admin', path: '' }];
  if (!found) {
    const segs = pathUnderAdmin.split('/').filter(Boolean);
    if (segs.length) crumbs.push({ label: segs[0].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) });
    return crumbs;
  }
  const { item, group } = found;
  if (group.label && group.id !== 'main') crumbs.push({ label: group.label });
  crumbs.push({ label: item.label, path: item.end || pathUnderAdmin === item.path ? item.path : pathUnderAdmin });
  return crumbs;
}
