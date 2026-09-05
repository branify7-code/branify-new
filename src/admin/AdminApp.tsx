// =============================================================================
// BRANIFY ADMIN — application shell + router
// Lazy-loaded under /admin/* — the public site never downloads this chunk.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell, ChevronDown, ChevronRight, Command, ExternalLink, LogOut, Menu,
  Plus, Search, ShieldQuestion, UserCircle, X, Zap,
} from 'lucide-react';
import './admin.css';
import { ADMIN_NAV, breadcrumbsFor, findNav } from './adminNav';
import { LoginScreen } from './pages/Login';
import {
  adminLogout, getAdminSession, getCachedMode, globalSearch, listNotFound, listRows, modeLabel,
} from './lib/backend';
import type { AdminMode, AdminUser, NotFoundRow, SearchHit } from './lib/types';
import { AdminAuthContext } from './lib/auth';
import type { AdminPageProps } from './lib/auth';
import { Badge, Btn, Kbd, ToastProvider, cx } from './ui';
import { initials, timeAgo } from './lib/format';

// ---- pages (content managers & modules) ----
import { Dashboard } from './pages/Dashboard';
import { ServicesManager } from './pages/managers/ServicesManager';
import { PortfolioManager } from './pages/managers/PortfolioManager';
import { ToolsManager } from './pages/managers/ToolsManager';
import { AIToolsManager } from './pages/managers/AIToolsManager';
import { ProductsManager } from './pages/managers/ProductsManager';
import { TemplatesManager } from './pages/managers/TemplatesManager';
import { TemplateCategoriesManager } from './pages/managers/TemplateCategoriesManager';
import { BlogManager } from './pages/managers/BlogManager';
import { LeadsPage } from './pages/managers/LeadsPage';
import { ContactsPage } from './pages/managers/ContactsPage';
import { CustomersPage } from './pages/CustomersPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { SeoDashboard } from './pages/SeoDashboard';
import { SitemapPage } from './pages/SitemapPage';
import { RedirectsPage } from './pages/RedirectsPage';
import { NotFoundMonitor } from './pages/NotFoundMonitor';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { PerformancePage } from './pages/PerformancePage';
import { MediaPage } from './pages/MediaPage';
import { PwaPage } from './pages/PwaPage';
import { SettingsPage } from './pages/SettingsPage';
import { ActivityPage } from './pages/ActivityPage';
import { SystemPage } from './pages/SystemPage';
import { ProfilePage } from './pages/ProfilePage';

const BADGES_SEEN_KEY = 'branify_admin_badges_seen';

type BadgeCounts = { leads_new: number; not_found: number };

const AdminApp: React.FC = () => {
  const [path, setPath] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/admin',
  );
  const [session, setSession] = useState<{ user: AdminUser; mode: AdminMode } | 'loading' | null>('loading');
  const [sessionEpoch, setSessionEpoch] = useState(0);

  // Internal navigation (works with the SPA's pushState routing)
  useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    window.addEventListener('popstate', sync);
    window.addEventListener('branify:admin-nav', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('branify:admin-nav', sync);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await getAdminSession();
        if (alive) setSession(s);
      } catch {
        if (alive) setSession(null);
      }
    })();
    return () => { alive = false; };
  }, [sessionEpoch]);

  const navigate = useCallback((underAdmin: string) => {
    const target = `/admin${underAdmin}`;
    window.history.pushState({}, '', target);
    window.dispatchEvent(new Event('branify:admin-nav'));
    document.getElementById('adm-scroll')?.scrollTo({ top: 0 });
  }, []);

  const logout = useCallback(async () => {
    await adminLogout();
    setSession(null);
    setSessionEpoch((e) => e + 1);
  }, []);

  if (session === 'loading') {
    return (
      <div className="adm-root flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <img src="/branify-icon.svg" alt="BRANIFY" className="h-10 w-10 animate-pulse" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#C9A45C]">Loading admin…</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginScreen mode={getCachedMode() || 'none'} onSuccess={() => setSessionEpoch((e) => e + 1)} />;
  }

  return (
    <AdminAuthContext.Provider
      value={{ user: session.user, mode: session.mode, logout, refresh: () => setSessionEpoch((e) => e + 1) }}
    >
      <ToastProvider>
        <AdminShell path={path} navigate={navigate} user={session.user} mode={session.mode} logout={logout} />
      </ToastProvider>
    </AdminAuthContext.Provider>
  );
};

// ==============================================================================
// SHELL
// ==============================================================================
const AdminShell: React.FC<{
  path: string;
  navigate: (underAdmin: string) => void;
  user: AdminUser;
  mode: AdminMode;
  logout: () => Promise<void>;
}> = ({ path, navigate, user, mode, logout }) => {
  const subPath = (path.replace(/^\/admin/, '') || '/').split('?')[0];
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem('branify_admin_sidebar') === 'collapsed'; } catch { return false; }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [badges, setBadges] = useState<BadgeCounts>({ leads_new: 0, not_found: 0 });
  const [notifOpen, setNotifOpen] = useState(false);
  const [qaOpen, setQaOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const refreshBadges = useCallback(() => {
    (async () => {
      try {
        const [p, nf] = await Promise.all([
          listRows<{ id: string }>('inquiries', { status: 'new', archived: false, pageSize: 1 }),
          listNotFound(),
        ]);
        setBadges({ leads_new: p.total, not_found: nf.length });
      } catch { /* keep previous badges */ }
    })();
  }, []);

  useEffect(() => {
    refreshBadges();
    const t = setInterval(refreshBadges, 90000);
    return () => clearInterval(t);
  }, [refreshBadges, subPath]);

  useEffect(() => {
    try { localStorage.setItem('branify_admin_sidebar', collapsed ? 'collapsed' : 'open'); } catch { /* noop */ }
  }, [collapsed]);

  // ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // close dropdowns on outside click
  useEffect(() => {
    const close = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest('[data-dropdown]')) {
        setNotifOpen(false); setQaOpen(false); setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const crumbs = useMemo(() => breadcrumbsFor(subPath === '/' ? '' : subPath), [subPath]);
  const active = findNav(subPath === '/' ? '' : subPath);

  const renderPage = () => {
    const pageProps: AdminPageProps = { query: new URLSearchParams(path.split('?')[1] || ''), navigate, refreshBadges };
    const unknown = (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-6 py-16 text-center">
        <ShieldQuestion size={28} className="text-[#C9A45C]/60" />
        <p className="font-display text-lg font-bold text-[#F5F6F2]">Page not found in admin</p>
        <Btn variant="outline" size="sm" onClick={() => navigate('/')}>Back to dashboard</Btn>
      </div>
    );
    switch (subPath) {
      case '/': return <Dashboard {...pageProps} />;
      case '/services': return <ServicesManager {...pageProps} />;
      case '/portfolio': return <PortfolioManager {...pageProps} />;
      case '/tools': return <ToolsManager {...pageProps} />;
      case '/ai-tools': return <AIToolsManager {...pageProps} />;
      case '/products': return <ProductsManager {...pageProps} />;
      case '/templates': return <TemplatesManager {...pageProps} />;
      case '/template-categories': return <TemplateCategoriesManager {...pageProps} />;
      case '/blog': return <BlogManager {...pageProps} />;
      case '/leads': return <LeadsPage {...pageProps} />;
      case '/customers': return <CustomersPage {...pageProps} />;
      case '/payments': return <PaymentsPage {...pageProps} />;
      case '/contacts': return <ContactsPage {...pageProps} />;
      case '/seo': return <SeoDashboard {...pageProps} />;
      case '/seo/sitemap': return <SitemapPage {...pageProps} />;
      case '/seo/redirects': return <RedirectsPage {...pageProps} />;
      case '/seo/404': return <NotFoundMonitor {...pageProps} />;
      case '/analytics': return <AnalyticsPage {...pageProps} />;
      case '/performance': return <PerformancePage {...pageProps} />;
      case '/media': return <MediaPage {...pageProps} />;
      case '/pwa': return <PwaPage {...pageProps} />;
      case '/settings': return <SettingsPage {...pageProps} />;
      case '/activity': return <ActivityPage {...pageProps} />;
      case '/system': return <SystemPage {...pageProps} />;
      case '/profile': return <ProfilePage {...pageProps} />;
      default: return unknown;
    }
  };

  const badgeFor = (key?: string): number =>
    key === 'leads_new' ? badges.leads_new : key === 'not_found' ? badges.not_found : 0;

  const notifications: Array<{ id: string; title: string; detail: string; when: string; href: string; tone: 'gold' | 'red' | 'green' }> = [];
  if (badges.leads_new > 0) notifications.push({ id: 'leads', title: `${badges.leads_new} new lead${badges.leads_new === 1 ? '' : 's'} awaiting triage`, detail: 'Open the Leads CRM to review and qualify.', when: 'live', href: '/leads', tone: 'gold' });
  if (badges.not_found > 0) notifications.push({ id: '404', title: `${badges.not_found} unresolvable URL${badges.not_found === 1 ? '' : 's'} logged`, detail: 'Review the 404 monitor and create redirects.', when: 'live', href: '/seo/404', tone: 'red' });
  notifications.push({ id: 'sys', title: 'System snapshot available', detail: 'Run a fresh health check from System Health.', when: 'on demand', href: '/system', tone: 'green' });

  // ------------------------------------------------------------------ sidebar
  const SidebarInner = ({ compact }: { compact?: boolean }) => (
    <div className="flex h-full flex-col">
      <div className={cx('flex items-center gap-2.5 px-4 py-4', compact && 'justify-center px-2')}>
        <img src="/branify-icon.svg" alt="BRANIFY logo" className="h-9 w-9 shrink-0" />
        {!compact && (
          <div className="min-w-0 leading-tight">
            <p className="truncate font-display text-sm font-extrabold tracking-[0.22em] text-[#F5F6F2]">BRANIFY</p>
            <p className="text-[8.5px] font-bold uppercase tracking-[0.3em] text-[#C9A45C]">Admin Panel</p>
          </div>
        )}
      </div>

      <nav className="adm-scroll flex-1 overflow-y-auto px-2.5 pb-3" aria-label="Admin navigation">
        {ADMIN_NAV.map((group) => (
          <div key={group.id}>
            {group.label && !compact && <p className="adm-caption">{group.label}</p>}
            {group.label && compact && <div className="mx-2 my-2 border-t border-white/[0.06]" />}
            {group.items.map((item) => {
              const isActive = active?.item.path === item.path;
              const count = badgeFor(item.badgeKey);
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  className={cx('adm-nav-item mb-0.5 w-full', isActive && 'active', compact && 'justify-center px-0')}
                  onClick={() => { navigate(item.path); setDrawerOpen(false); }}
                  title={compact ? item.label : undefined}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={16} className="shrink-0" />
                  {!compact && <span className="flex-1 truncate text-left">{item.label}</span>}
                  {!compact && count > 0 && (
                    <span className="rounded-full bg-[#C9A45C] px-1.5 py-px text-[9.5px] font-black tabular-nums text-[#1A1206]">{count}</span>
                  )}
                  {!compact && (item.path === '/services' || item.path === '/portfolio') && (
                    <ChevronRight size={12} className="text-[#566072]" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {!compact && (
        <div className="border-t border-white/[0.06] p-3">
          <div className="rounded-xl border border-[#C9A45C]/25 bg-gradient-to-br from-[#C9A45C]/[0.12] to-transparent p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#E8C97C]">BRANIFY Control Center</p>
            <p className="mt-0.5 text-[10px] leading-snug text-[#A7AFBA]">{modeLabel(mode)}</p>
          </div>
          <button className="adm-nav-item mt-1.5 w-full" onClick={() => navigate('/profile')}>
            <UserCircle size={16} />
            <span className="flex-1 truncate text-left">{user.name || user.email}</span>
          </button>
          <button className="adm-nav-item w-full text-red-300 hover:bg-red-500/10 hover:text-red-200" onClick={() => void logout()}>
            <LogOut size={16} />
            <span className="flex-1 text-left">Logout</span>
          </button>
        </div>
      )}
      {compact && (
        <div className="border-t border-white/[0.06] p-2">
          <button className="adm-nav-item w-full justify-center" title="Profile" onClick={() => navigate('/profile')}>
            <UserCircle size={16} />
          </button>
          <button className="adm-nav-item w-full justify-center text-red-300 hover:bg-red-500/10" title="Logout" onClick={() => void logout()}>
            <LogOut size={16} />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="adm-root flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className={cx('adm-sidebar fixed inset-y-0 left-0 z-40 hidden shrink-0 lg:block', collapsed ? 'w-[68px]' : 'w-60')} aria-label="Admin sidebar">
        <SidebarInner compact={collapsed} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[90] lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="adm-sidebar absolute inset-y-0 left-0 w-72 max-w-[85vw]">
            <button className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-[#A7AFBA] hover:bg-white/10" onClick={() => setDrawerOpen(false)} aria-label="Close navigation">
              <X size={16} />
            </button>
            <SidebarInner />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className={cx('flex min-h-screen w-full min-w-0 flex-col transition-[padding] duration-200', collapsed ? 'lg:pl-[68px]' : 'lg:pl-60')}>
        {/* Header */}
        <header className="adm-header sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 px-3 sm:gap-3 sm:px-4">
          <button className="rounded-lg p-2 text-[#A7AFBA] hover:bg-white/[0.06] hover:text-white lg:hidden" onClick={() => setDrawerOpen(true)} aria-label="Open navigation">
            <Menu size={18} />
          </button>
          <button className="hidden rounded-lg p-2 text-[#A7AFBA] hover:bg-white/[0.06] hover:text-white lg:block" onClick={() => setCollapsed((c) => !c)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <Menu size={18} />
          </button>

          <div className="min-w-0 flex-1">
            <nav className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#566072]" aria-label="Breadcrumb">
              {crumbs.map((c, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight size={10} className="opacity-50" />}
                  {c.path !== undefined && i < crumbs.length - 1 ? (
                    <button className="hover:text-[#C9A45C]" onClick={() => navigate(c.path!)}>{c.label}</button>
                  ) : (
                    <span className={cx(i === crumbs.length - 1 && 'text-[#C9A45C]')}>{c.label}</span>
                  )}
                </span>
              ))}
            </nav>
            <h1 className="truncate font-display text-[15px] font-bold leading-tight text-[#F5F6F2]">
              {active?.item.label || (subPath === '/' ? 'Dashboard' : subPath.replace('/', '').replace(/-/g, ' '))}
            </h1>
          </div>

          {/* Global search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-[#566072] transition-colors hover:border-[#C9A45C]/40 hover:text-[#A7AFBA] sm:flex sm:w-56 md:w-72"
            aria-label="Open global search"
          >
            <Search size={14} />
            <span className="flex-1 text-left">Search anything…</span>
            <Kbd>⌘K</Kbd>
          </button>
          <button className="rounded-lg p-2 text-[#A7AFBA] hover:bg-white/[0.06] hover:text-white sm:hidden" onClick={() => setSearchOpen(true)} aria-label="Search">
            <Search size={17} />
          </button>

          {/* Quick actions */}
          <div className="relative" data-dropdown>
            <button className="hidden items-center gap-1.5 rounded-xl border border-[#C9A45C]/35 bg-gradient-to-b from-[#E8C97C] to-[#C9A45C] px-3 py-2 text-xs font-bold text-[#1A1206] shadow hover:brightness-110 md:flex" onClick={() => setQaOpen((o) => !o)} aria-expanded={qaOpen}>
              <Zap size={13} /> Quick Actions
            </button>
            <button className="rounded-lg border border-[#C9A45C]/35 p-2 text-[#E8C97C] md:hidden" onClick={() => setQaOpen((o) => !o)} aria-label="Quick actions">
              <Plus size={16} />
            </button>
            {qaOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-xl border border-[rgba(201,164,92,0.25)] bg-[#07101A] shadow-2xl">
                {[
                  ['New Service', '/services?new=1'],
                  ['New Portfolio Project', '/portfolio?new=1'],
                  ['New Tool', '/tools?new=1'],
                  ['New AI Tool', '/ai-tools?new=1'],
                  ['New Product', '/products?new=1'],
                  ['New Template', '/templates?new=1'],
                  ['New Blog Post', '/blog?new=1'],
                  ['New Redirect', '/seo/redirects?new=1'],
                  ['Edit Homepage SEO', '/seo?page=/'],
                ].map(([label, href]) => (
                  <button key={href} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] text-[#C9CED6] hover:bg-white/[0.05] hover:text-[#E9CF79]" onClick={() => { setQaOpen(false); navigate(href); }}>
                    <Plus size={13} className="text-[#C9A45C]" /> {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative" data-dropdown>
            <button className="relative rounded-lg p-2 text-[#A7AFBA] hover:bg-white/[0.06] hover:text-white" onClick={() => setNotifOpen((o) => !o)} aria-label={`Notifications (${notifications.length})`}>
              <Bell size={17} />
              {notifications.length > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C9A45C] px-1 text-[9px] font-black text-[#1A1206]">
                  {notifications.length}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 max-w-[92vw] overflow-hidden rounded-xl border border-[rgba(201,164,92,0.25)] bg-[#07101A] shadow-2xl">
                <p className="border-b border-white/[0.06] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#A7AFBA]">Notifications</p>
                <div className="max-h-80 overflow-y-auto adm-scroll">
                  {notifications.map((n) => (
                    <button key={n.id} className="flex w-full items-start gap-2.5 border-b border-white/[0.04] px-4 py-3 text-left last:border-0 hover:bg-white/[0.04]" onClick={() => { setNotifOpen(false); navigate(n.href); }}>
                      <span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.tone === 'gold' && 'bg-[#C9A45C]', n.tone === 'red' && 'bg-red-400', n.tone === 'green' && 'bg-emerald-400')} />
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold text-[#F5F6F2]">{n.title}</span>
                        <span className="block text-[11px] leading-snug text-[#A7AFBA]">{n.detail}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" data-dropdown>
            <button className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 hover:border-[#C9A45C]/40" onClick={() => setProfileOpen((o) => !o)} aria-expanded={profileOpen} aria-label="Profile menu">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-b from-[#E8C97C] to-[#C9A45C] text-[11px] font-black text-[#1A1206]">
                {initials(user.name || user.email)}
              </span>
              <span className="hidden text-left leading-tight xl:block">
                <span className="block max-w-[120px] truncate text-xs font-bold text-[#F5F6F2]">{user.name || user.email}</span>
                <span className="block text-[9.5px] font-bold uppercase tracking-wider text-[#C9A45C]">{user.role.replace('_', ' ')}</span>
              </span>
              <ChevronDown size={13} className="text-[#A7AFBA]" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-[rgba(201,164,92,0.25)] bg-[#07101A] shadow-2xl">
                <div className="border-b border-white/[0.06] px-4 py-3">
                  <p className="truncate text-[13px] font-bold text-[#F5F6F2]">{user.name || user.email}</p>
                  <p className="truncate text-[11px] text-[#A7AFBA]">{user.email}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#C9A45C]">{modeLabel(mode)}</p>
                </div>
                <button className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] text-[#C9CED6] hover:bg-white/[0.05]" onClick={() => { setProfileOpen(false); navigate('/profile'); }}>
                  <UserCircle size={14} /> Admin profile
                </button>
                <button className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] text-[#C9CED6] hover:bg-white/[0.05]" onClick={() => { setProfileOpen(false); navigate('/system'); }}>
                  <ShieldQuestion size={14} /> System health
                </button>
                <a className="flex w-full items-center gap-2 border-t border-white/[0.06] px-4 py-2.5 text-left text-[13px] text-[#C9CED6] hover:bg-white/[0.05]" href="/" target="_blank" rel="noreferrer">
                  <ExternalLink size={14} /> View public site
                </a>
                <button className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] text-red-300 hover:bg-red-500/10" onClick={() => void logout()}>
                  <LogOut size={14} /> Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main id="adm-scroll" className="adm-safe-bottom min-w-0 flex-1 px-3 py-4 sm:px-5 sm:py-5">
          <div className="adm-page mx-auto w-full max-w-[1440px]" key={subPath}>
            {renderPage()}
          </div>
        </main>
      </div>

      {searchOpen && <SearchPalette onClose={() => setSearchOpen(false)} navigate={navigate} />}
    </div>
  );
};

// ==============================================================================
// GLOBAL SEARCH PALETTE
// ==============================================================================
const SearchPalette: React.FC<{ onClose: () => void; navigate: (p: string) => void }> = ({ onClose, navigate }) => {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [busy, setBusy] = useState(false);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    if (q.trim().length < 2) { setHits([]); return; }
    setBusy(true);
    const t = setTimeout(async () => {
      try { setHits(await globalSearch(q)); } catch { setHits([]); } finally { setBusy(false); }
    }, 260);
    return () => clearTimeout(t);
  }, [q]);

  const go = (hit: SearchHit) => {
    onClose();
    navigate(hit.href.replace(/^\/admin/, ''));
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-start justify-center bg-black/70 p-4 pt-[12vh] backdrop-blur-sm" onMouseDown={onClose} role="dialog" aria-modal="true" aria-label="Global search">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-[rgba(201,164,92,0.3)] bg-[#07101A] shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2.5 border-b border-white/[0.07] px-4">
          <Search size={16} className="text-[#C9A45C]" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setCursor(0); }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, hits.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
              if (e.key === 'Enter' && hits[cursor]) go(hits[cursor]);
            }}
            placeholder="Search services, tools, leads, SEO pages…"
            className="h-12 flex-1 bg-transparent text-sm text-[#F5F6F2] outline-none placeholder-[#566072]"
            aria-label="Search query"
          />
          {busy && <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9A45C]">…</span>}
          <Kbd>esc</Kbd>
        </div>
        <div className="adm-scroll max-h-[52vh] overflow-y-auto">
          {q.trim().length >= 2 && !busy && hits.length === 0 && (
            <p className="px-4 py-8 text-center text-xs text-[#566072]">No results for “{q}”</p>
          )}
          {hits.map((h, i) => (
            <button
              key={`${h.type}-${h.id}`}
              className={cx('flex w-full items-center gap-3 border-b border-white/[0.04] px-4 py-2.5 text-left last:border-0', i === cursor ? 'bg-white/[0.05]' : 'hover:bg-white/[0.03]')}
              onMouseEnter={() => setCursor(i)}
              onClick={() => go(h)}
            >
              <Badge tone="gold" className="w-20 justify-center shrink-0">{h.type.replace('_', ' ')}</Badge>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-[#F5F6F2]">{h.title}</span>
                {h.sub && <span className="block truncate text-[11px] text-[#A7AFBA]">{h.sub}</span>}
              </span>
              <ChevronRight size={13} className="shrink-0 text-[#566072]" />
            </button>
          ))}
          {q.trim().length < 2 && (
            <p className="px-4 py-8 text-center text-xs text-[#566072]">Type at least 2 characters — searches all content, leads, SEO pages & media.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminApp;
