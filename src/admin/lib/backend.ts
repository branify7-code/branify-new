// =============================================================================
// BRANIFY ADMIN — unified backend layer
// -----------------------------------------------------------------------------
// PRODUCTION: talks directly to Supabase (Auth + PostgREST). Every table is
//             protected by RLS policies (see supabase/admin-schema.sql) — the
//             browser key alone can never read or write admin data.
// SANDBOX:    falls back to the local preview API (mini-services/
//             branify-admin-api, port 3032) so the dashboard is fully usable
//             in the development preview. The local transport is compiled out
//             of production builds (allowed only when import.meta.env.DEV).
// Detection order: Supabase schema probe → local health probe → 'none'.
// =============================================================================
import { supabase } from '../../lib/supabase';
import type {
  ActivityRow, AdminMode, AdminUser, CollectionKey, CustomerRow, DashboardData, EventRow,
  ListParams, MediaRow, NotFoundRow, Paged, SearchHit, SiteSettings,
  SystemHealthReport, HealthItem,
} from './types';

export class AdminError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export const LOCAL_API_PORT = 3032;
const LOCAL_ENABLED = Boolean((import.meta as { env?: Record<string, unknown> }).env?.DEV);
const MODE_CACHE_KEY = 'branify_admin_mode';
const TOKEN_KEY = 'branify_admin_token';

// ------------------------------------------------------------------ mode
let cachedMode: AdminMode | null = null;

export function getCachedMode(): AdminMode | null {
  if (cachedMode) return cachedMode;
  try {
    const v = sessionStorage.getItem(MODE_CACHE_KEY);
    if (v === 'supabase' || v === 'local' || v === 'none') cachedMode = v;
  } catch { /* noop */ }
  return cachedMode;
}

function setMode(m: AdminMode) {
  cachedMode = m;
  try { sessionStorage.setItem(MODE_CACHE_KEY, m); } catch { /* noop */ }
}

const timeout = (ms: number): AbortSignal => {
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
};

async function probeSupabase(): Promise<boolean> {
  try {
    const { error } = await supabase.from('settings').select('key').limit(1);
    // No error ⇒ schema applied (RLS may still filter rows, which is fine).
    if (!error) return true;
    // PGRST205 / 42P01 ⇒ relation missing ⇒ schema not applied yet.
    return false;
  } catch {
    return false;
  }
}

async function probeLocal(): Promise<boolean> {
  if (!LOCAL_ENABLED) return false;
  try {
    const res = await fetch(`/api/admin/health?XTransformPort=${LOCAL_API_PORT}`, { signal: timeout(1800) });
    if (!res.ok) return false;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return false;
    const data = (await res.json()) as { mode?: string };
    return data.mode === 'local';
  } catch {
    return false;
  }
}

export async function detectMode(): Promise<AdminMode> {
  if (cachedMode) return cachedMode;
  const mode: AdminMode = (await probeSupabase()) ? 'supabase' : (await probeLocal()) ? 'local' : 'none';
  setMode(mode);
  return mode;
}

// ------------------------------------------------------------------ local fetch
function localUrl(path: string): string {
  const joiner = path.includes('?') ? '&' : '?';
  return `/api/admin${path}${joiner}XTransformPort=${LOCAL_API_PORT}`;
}

function localToken(): string {
  try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
}

async function localFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (!(init.body instanceof FormData)) headers.set('content-type', 'application/json');
  const token = localToken();
  if (token) headers.set('authorization', `Bearer ${token}`);
  let res: Response;
  try {
    res = await fetch(localUrl(path), { ...init, headers, signal: timeout(15000) });
  } catch {
    throw new AdminError('Local admin API is unreachable.', 503);
  }
  if (res.status === 204) return undefined as T;
  let data: unknown = null;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok) {
    const msg = (data as { error?: string })?.error || `Request failed (${res.status})`;
    throw new AdminError(msg, res.status);
  }
  return data as T;
}

// ------------------------------------------------------------------ helpers
function sbErr(error: { message: string } | null, fallback = 'Database request failed'): never {
  throw new AdminError(error?.message || fallback, 400);
}

const TABLES: Record<CollectionKey, string> = {
  services: 'services',
  portfolio_projects: 'portfolio_projects',
  tools: 'tools',
  ai_tools: 'ai_tools',
  products: 'products',
  blog_posts: 'blog_posts',
  inquiries: 'inquiries',
  newsletter_subscribers: 'newsletter_subscribers',
  payments: 'payments',
  seo_overrides: 'seo_overrides',
  redirects: 'redirects',
  media_assets: 'media_assets',
  analytics_events: 'analytics_events',
  activity_log: 'activity_log',
  not_found_log: 'not_found_log',
};

const SEARCHABLE: Partial<Record<CollectionKey, string[]>> = {
  services: ['slug', 'title', 'subtitle', 'category'],
  portfolio_projects: ['slug', 'title', 'category', 'client'],
  tools: ['slug', 'name', 'category', 'description'],
  ai_tools: ['slug', 'name', 'category', 'description'],
  products: ['slug', 'name', 'category', 'description'],
  blog_posts: ['slug', 'title', 'excerpt', 'category'],
  inquiries: ['name', 'email', 'company', 'details'],
  newsletter_subscribers: ['email'],
  payments: ['provider', 'transaction_id', 'customer_email', 'customer_name'],
  seo_overrides: ['page_path', 'title'],
  redirects: ['source', 'destination'],
  media_assets: ['filename', 'alt'],
  analytics_events: ['name', 'path'],
  activity_log: ['user_email', 'action', 'target_type'],
  not_found_log: ['path'],
};

const DEFAULT_SORT: Partial<Record<CollectionKey, string>> = {
  services: 'sort_order', portfolio_projects: 'sort_order', tools: 'sort_order',
  ai_tools: 'sort_order', products: 'sort_order', blog_posts: 'created_at',
  inquiries: 'created_at', newsletter_subscribers: 'created_at', payments: 'created_at',
  seo_overrides: 'page_path',
  redirects: 'created_at', media_assets: 'created_at', analytics_events: 'created_at',
  activity_log: 'created_at', not_found_log: 'last_seen',
};

/** Public asset URLs may point at the local preview API — append the gateway port. */
export function resolveAssetUrl(url: string): string {
  if (!url) return url;
  if (LOCAL_ENABLED && url.startsWith('/api/admin/')) {
    return url.includes('?') ? `${url}&XTransformPort=${LOCAL_API_PORT}` : `${url}?XTransformPort=${LOCAL_API_PORT}`;
  }
  return url;
}

async function logActivity(mode: AdminMode, user: AdminUser | null, action: string, targetType: string, targetId: string, meta: Record<string, unknown> = {}): Promise<void> {
  try {
    if (mode === 'supabase') {
      await supabase.from('activity_log').insert({
        user_id: user?.id || null, user_email: user?.email || '', action,
        target_type: targetType, target_id: targetId, meta,
      });
    }
    // local mode: the API logs writes itself
  } catch { /* activity is best-effort */ }
}

// ------------------------------------------------------------------ auth
export interface LoginResult {
  user: AdminUser;
  mode: AdminMode;
  needsConfirmation?: boolean;
}

async function supabaseAdminCheck(email: string): Promise<AdminUser | null> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('email, name, role')
    .ilike('email', email)
    .limit(1);
  if (error) throw new AdminError(error.message, 400);
  if (!data || data.length === 0) return null;
  const { data: u } = await supabase.auth.getUser();
  return {
    id: u?.user?.id || email,
    email: data[0].email,
    name: data[0].name || email.split('@')[0],
    role: data[0].role || 'admin',
  };
}

export async function adminLogin(email: string, password: string): Promise<LoginResult> {
  const mode = await detectMode();
  if (mode === 'none') throw new AdminError('No admin database is connected yet. Apply supabase/admin-schema.sql to enable the production admin.', 503);

  if (mode === 'supabase') {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new AdminError(error.message, 401);
    const user = await supabaseAdminCheck(email.trim());
    if (!user) {
      await supabase.auth.signOut();
      throw new AdminError('This account is not on the BRANIFY admin allowlist. Access denied.', 403);
    }
    await logActivity('supabase', user, 'admin.login', 'auth', user.id).catch(() => {});
    return { user, mode };
  }

  // local
  const res = await localFetch<{ token: string; user: AdminUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), password }),
  });
  try { localStorage.setItem(TOKEN_KEY, res.token); } catch { /* noop */ }
  return { user: res.user, mode: 'local' };
}

export async function adminLogout(): Promise<void> {
  const mode = getCachedMode();
  try {
    if (mode === 'supabase') await supabase.auth.signOut();
    else if (mode === 'local') await localFetch('/auth/logout', { method: 'POST' }).catch(() => {});
  } finally {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* noop */ }
  }
}

export async function getAdminSession(): Promise<{ user: AdminUser; mode: AdminMode } | null> {
  const mode = await detectMode();
  if (mode === 'none') return null;

  if (mode === 'supabase') {
    const { data } = await supabase.auth.getSession();
    const email = data?.session?.user?.email;
    if (!email) return null;
    const user = await supabaseAdminCheck(email).catch(() => null);
    return user ? { user, mode } : null;
  }

  try {
    const res = await localFetch<{ user: AdminUser }>('/auth/me');
    return { user: res.user, mode: 'local' };
  } catch {
    return null;
  }
}

export async function updateProfile(name: string, avatarUrl: string): Promise<AdminUser> {
  const mode = getCachedMode();
  if (mode === 'local') {
    const res = await localFetch<{ user: AdminUser }>('/auth/profile', {
      method: 'POST', body: JSON.stringify({ name, avatarUrl }),
    });
    return res.user;
  }
  const { data } = await supabase.auth.getUser();
  const email = data?.user?.email || '';
  const { error } = await supabase.from('admin_users').update({ name, }).ilike('email', email);
  if (error) throw new AdminError(error.message, 400);
  if (avatarUrl) await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });
  const user = await supabaseAdminCheck(email);
  return user!;
}

export async function changePassword(current: string, next: string): Promise<void> {
  const mode = getCachedMode();
  if (mode === 'local') {
    await localFetch('/auth/password', { method: 'POST', body: JSON.stringify({ current, next }) });
    return;
  }
  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) throw new AdminError(error.message, 400);
}

// ------------------------------------------------------------------ generic CRUD
export async function listRows<T>(key: CollectionKey, params: ListParams = {}): Promise<Paged<T>> {
  const mode = await detectMode();
  if (mode === 'none') throw new AdminError('Admin database is not connected.', 503);
  const table = TABLES[key];
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(200, Math.max(1, params.pageSize || 25));

  if (mode === 'local') {
    const sp = new URLSearchParams();
    sp.set('page', String(page));
    sp.set('pageSize', String(pageSize));
    if (params.search) sp.set('search', params.search);
    if (params.sort) { sp.set('sort', params.sort); sp.set('dir', params.dir || 'desc'); }
    for (const [k, v] of Object.entries(params)) {
      if (['page', 'pageSize', 'search', 'sort', 'dir'].includes(k)) continue;
      if (v === undefined || v === '') continue;
      sp.set(k, String(v));
    }
    return localFetch<Paged<T>>(`/data/${key}?${sp.toString()}`);
  }

  let q = supabase.from(table).select('*', { count: 'exact' });
  const search = (params.search || '').trim();
  if (search) {
    const fields = SEARCHABLE[key] || [];
    if (fields.length) q = q.or(fields.map((f) => `${f}.ilike.%${search}%`).join(','));
  }
  for (const [k, v] of Object.entries(params)) {
    if (['page', 'pageSize', 'search', 'sort', 'dir'].includes(k)) continue;
    if (v === undefined || v === '') continue;
    if (typeof v === 'boolean') q = q.eq(k, v);
    else q = q.ilike(k, String(v));
  }
  const sortCol = (params.sort || DEFAULT_SORT[key] || 'created_at') as string;
  q = q.order(sortCol, { ascending: params.dir === 'asc', nullsFirst: false });
  const from = (page - 1) * pageSize;
  const { data, error, count } = await q.range(from, from + pageSize - 1);
  if (error) sbErr(error);
  return { rows: (data || []) as T[], total: count || 0, page, pageSize };
}

export async function getRow<T>(key: CollectionKey, id: string): Promise<T> {
  const mode = await detectMode();
  if (mode === 'local') {
    const res = await localFetch<{ row: T }>(`/data/${key}/${id}`);
    return res.row;
  }
  const { data, error } = await supabase.from(TABLES[key]).select('*').eq('id', id).single();
  if (error) sbErr(error);
  return data as T;
}

export async function createRow<T>(key: CollectionKey, payload: Record<string, unknown>): Promise<T> {
  const mode = await detectMode();
  if (mode === 'none') throw new AdminError('Admin database is not connected.', 503);
  if (mode === 'local') {
    const res = await localFetch<{ row: T }>(`/data/${key}`, { method: 'POST', body: JSON.stringify(payload) });
    return res.row;
  }
  const body = { ...payload };
  if (key === 'seo_overrides') body.updated_by = body.updated_by || '';
  const { data, error } = await supabase.from(TABLES[key]).upsert(body, {
    onConflict: key === 'seo_overrides' ? 'page_path' : undefined,
  }).select().single();
  if (error) sbErr(error);
  return data as T;
}

export async function updateRow<T>(key: CollectionKey, id: string, payload: Record<string, unknown>): Promise<T> {
  const mode = await detectMode();
  if (mode === 'local') {
    const res = await localFetch<{ row: T }>(`/data/${key}/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
    return res.row;
  }
  const { data, error } = await supabase.from(TABLES[key]).update(payload).eq('id', id).select().single();
  if (error) sbErr(error);
  return data as T;
}

export async function deleteRow(key: CollectionKey, id: string): Promise<void> {
  const mode = await detectMode();
  if (mode === 'local') {
    await localFetch(`/data/${key}/${id}`, { method: 'DELETE' });
    return;
  }
  const { error } = await supabase.from(TABLES[key]).delete().eq('id', id);
  if (error) sbErr(error);
}

export async function reorderRows(key: CollectionKey, orderedIds: string[]): Promise<void> {
  const mode = await detectMode();
  if (mode === 'local') {
    await localFetch(`/data/${key}/reorder`, { method: 'POST', body: JSON.stringify({ ids: orderedIds }) });
    return;
  }
  // Supabase: sequential updates (admin tables are small)
  await Promise.all(orderedIds.map((id, i) =>
    supabase.from(TABLES[key]).update({ sort_order: i }).eq('id', id)));
}

// ------------------------------------------------------------------ customers
// Customers = real Supabase Auth users. Passwords are NEVER stored or returned
// by this module — authentication stays entirely inside Supabase Auth.
// Supabase mode uses the SECURITY DEFINER RPC `branify_list_customers()`
// (admin-only execute), the sandbox preview API exposes its real accounts.
export async function listCustomers(search = ''): Promise<CustomerRow[]> {
  const mode = await detectMode();
  if (mode === 'none') throw new AdminError('Admin database is not connected.', 503);
  if (mode === 'local') {
    const res = await localFetch<{ rows: CustomerRow[] }>(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`);
    return res.rows;
  }
  const { data, error } = await supabase.rpc('branify_list_customers', { p_search: search.trim() || null });
  if (error) sbErr(error, 'Unable to list customers — is the schema installed?');
  const rows = (data || []) as Array<Record<string, unknown>>;
  // merge admin-editable profile fields (status/notes) from public.customers
  let profiles: Record<string, { status?: string; notes?: string }> = {};
  try {
    const { data: prof } = await supabase.from('customers').select('user_id, status, notes');
    for (const p of prof || []) {
      const r = p as { user_id: string; status: string; notes: string };
      profiles[r.user_id] = { status: r.status, notes: r.notes };
    }
  } catch { /* profile table optional */ }
  return rows.map((r) => ({
    id: String(r.id || ''),
    email: String(r.email || ''),
    phone: String(r.phone || ''),
    name: String(r.name || ''),
    status: profiles[String(r.id)]?.status || String(r.status || 'active'),
    notes: profiles[String(r.id)]?.notes || '',
    created_at: String(r.created_at || ''),
    last_login_at: String(r.last_login_at || ''),
  }));
}

export async function updateCustomerStatus(userId: string, status: string, notes?: string): Promise<void> {
  const mode = await detectMode();
  if (mode === 'none') throw new AdminError('Admin database is not connected.', 503);
  if (mode === 'local') {
    await localFetch(`/customers/${userId}`, { method: 'PATCH', body: JSON.stringify({ status, notes }) });
    return;
  }
  const { error } = await supabase
    .from('customers')
    .upsert({ user_id: userId, status, notes: notes ?? '' }, { onConflict: 'user_id' });
  if (error) sbErr(error);
}

// ------------------------------------------------------------------ dashboard
function bucketByDay(rows: Array<{ created_at: string }>, days = 30): Array<{ day: string; count: number }> {
  const out = new Map<string, number>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of rows) {
    const day = (r.created_at || '').slice(0, 10);
    if (out.has(day)) out.set(day, (out.get(day) || 0) + 1);
  }
  return Array.from(out.entries()).map(([day, count]) => ({ day, count }));
}

export async function getDashboard(): Promise<DashboardData> {
  const mode = await detectMode();
  if (mode === 'none') throw new AdminError('Admin database is not connected.', 503);
  if (mode === 'local') return localFetch<DashboardData>('/dashboard');

  const since = new Date(Date.now() - 29 * 864e5).toISOString();
  const countOf = async (table: string, filters: Record<string, unknown> = {}): Promise<number> => {
    let q = supabase.from(table).select('id', { count: 'exact', head: true });
    for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
    const { count } = await q;
    return count || 0;
  };
  const [
    customers, services, portfolio, tools, aiTools, products, blogPublished, blogDrafts,
    leadsTotal, leadsNew, subscribers, media, redirects, notFound,
  ] = await Promise.all([
    (async () => {
      try {
        const r = await supabase.rpc('branify_list_customers', { p_search: null });
        return ((r.data as unknown[]) || []).length;
      } catch { return 0; }
    })(),
    countOf('services', { archived: false }), countOf('portfolio_projects', { archived: false }),
    countOf('tools', { archived: false }), countOf('ai_tools', { archived: false }),
    countOf('products', { archived: false }), countOf('blog_posts', { archived: false, status: 'published' }),
    countOf('blog_posts', { archived: false, status: 'draft' }), countOf('inquiries'),
    countOf('inquiries', { status: 'new', archived: false }), countOf('newsletter_subscribers'),
    countOf('media_assets'), countOf('redirects', { active: true }), countOf('not_found_log'),
  ]);

  const [statusRows, leadDayRows, eventDayRows, eventNames, recentLeads, recentActivity] = await Promise.all([
    supabase.from('inquiries').select('status'),
    supabase.from('inquiries').select('created_at').gte('created_at', since).limit(2000),
    supabase.from('analytics_events').select('created_at').gte('created_at', since).limit(2000),
    supabase.from('analytics_events').select('name, created_at').gte('created_at', since).limit(2000),
    supabase.from('inquiries').select('*').order('created_at', { ascending: false }).limit(6),
    supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(10),
  ]);

  const leadsByStatus: Record<string, number> = {};
  for (const r of statusRows.data || []) {
    const s = (r as { status: string }).status || 'new';
    leadsByStatus[s] = (leadsByStatus[s] || 0) + 1;
  }
  const nameCounts: Record<string, number> = {};
  for (const r of eventNames.data || []) {
    const n = (r as { name: string }).name;
    nameCounts[n] = (nameCounts[n] || 0) + 1;
  }

  return {
    counts: {
      customers, services, portfolio, tools, ai_tools: aiTools, products,
      blog_published: blogPublished, blog_drafts: blogDrafts,
      leads_total: leadsTotal, leads_new: leadsNew, subscribers,
      media, redirects, not_found: notFound,
    },
    leadsByStatus,
    leadsOverTime: bucketByDay((leadDayRows.data || []) as Array<{ created_at: string }>),
    eventsOverTime: bucketByDay((eventDayRows.data || []) as Array<{ created_at: string }>),
    eventsByName: Object.entries(nameCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    recentLeads: (recentLeads.data || []) as DashboardData['recentLeads'],
    recentActivity: (recentActivity.data || []) as DashboardData['recentActivity'],
  };
}

// ------------------------------------------------------------------ search
export async function globalSearch(q: string): Promise<SearchHit[]> {
  const query = q.trim();
  if (query.length < 2) return [];
  const mode = await detectMode();
  if (mode === 'none') return [];
  if (mode === 'local') {
    const res = await localFetch<{ results: SearchHit[] }>(`/search?q=${encodeURIComponent(query)}`);
    return res.results;
  }
  const scopes: Array<[CollectionKey, string, string, string]> = [
    ['services', 'title', 'Service', '/admin/services'],
    ['portfolio_projects', 'title', 'Portfolio', '/admin/portfolio'],
    ['tools', 'name', 'Tool', '/admin/tools'],
    ['ai_tools', 'name', 'AI Tool', '/admin/ai-tools'],
    ['products', 'name', 'Product', '/admin/products'],
    ['blog_posts', 'title', 'Blog', '/admin/blog'],
    ['inquiries', 'name', 'Lead', '/admin/leads'],
    ['newsletter_subscribers', 'email', 'Subscriber', '/admin/customers?tab=newsletter'],
    ['seo_overrides', 'page_path', 'SEO', '/admin/seo/pages'],
    ['redirects', 'source', 'Redirect', '/admin/seo/redirects'],
    ['media_assets', 'filename', 'Media', '/admin/media'],
  ];
  const hits: SearchHit[] = [];
  await Promise.all(scopes.map(async ([key, labelCol, type, href]) => {
    try {
      const paged = await listRows<Record<string, unknown>>(key, { search: query, pageSize: 5, page: 1 });
      for (const r of paged.rows) {
        hits.push({
          type, id: String(r.id || ''), title: String(r[labelCol] || r.slug || r.path || r.email || '(untitled)'),
          sub: String(r.category || r.status || r.email || ''), href,
        });
      }
    } catch { /* scope skipped */ }
  }));
  return hits.slice(0, 30);
}

// ------------------------------------------------------------------ settings
export async function getSettings(): Promise<SiteSettings> {
  const mode = await detectMode();
  if (mode === 'none') throw new AdminError('Admin database is not connected.', 503);
  if (mode === 'local') {
    const res = await localFetch<{ settings: SiteSettings }>('/settings');
    return res.settings;
  }
  const { data, error } = await supabase.from('settings').select('key, value');
  if (error) sbErr(error);
  const out: Record<string, unknown> = {};
  for (const r of data || []) out[(r as { key: string }).key] = (r as { value: unknown }).value;
  return out as SiteSettings;
}

export async function updateSettings(patch: Record<string, unknown>): Promise<void> {
  const mode = await detectMode();
  if (mode === 'local') {
    await localFetch('/settings', { method: 'PUT', body: JSON.stringify(patch) });
    return;
  }
  const { error } = await supabase.from('settings').upsert(
    Object.entries(patch).map(([key, value]) => ({ key, value })),
    { onConflict: 'key' },
  );
  if (error) sbErr(error);
}

// ------------------------------------------------------------------ activity
export async function listActivity(limit = 60): Promise<ActivityRow[]> {
  const mode = await detectMode();
  if (mode === 'none') return [];
  if (mode === 'local') {
    const res = await localFetch<{ rows: ActivityRow[] }>(`/activity?limit=${limit}`);
    return res.rows;
  }
  const { data, error } = await supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) sbErr(error);
  return (data || []) as ActivityRow[];
}

// ------------------------------------------------------------------ 404 monitor
export async function listNotFound(): Promise<NotFoundRow[]> {
  const mode = await detectMode();
  if (mode === 'none') return [];
  if (mode === 'local') {
    const res = await localFetch<{ rows: NotFoundRow[] }>('/notfound');
    return res.rows;
  }
  const { data, error } = await supabase.from('not_found_log').select('*').order('last_seen', { ascending: false }).limit(200);
  if (error) sbErr(error);
  return (data || []) as NotFoundRow[];
}

export async function clearNotFound(path?: string): Promise<void> {
  const mode = await detectMode();
  if (mode === 'local') {
    await localFetch(`/notfound${path ? `?path=${encodeURIComponent(path)}` : ''}`, { method: 'DELETE' });
    return;
  }
  const q = supabase.from('not_found_log').delete();
  const { error } = path ? await q.eq('path', path) : await q;
  if (error) sbErr(error);
}

// ------------------------------------------------------------------ media
export async function uploadMedia(file: File, alt: string): Promise<MediaRow> {
  const mode = await detectMode();
  if (mode === 'local') {
    const form = new FormData();
    form.append('file', file);
    form.append('alt', alt);
    const res = await localFetch<{ asset: MediaRow }>('/media/upload', { method: 'POST', body: form });
    return res.asset;
  }
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from('media').upload(path, file, { contentType: file.type || 'application/octet-stream' });
  if (error) throw new AdminError(error.message, 400);
  const { data } = supabase.storage.from('media').getPublicUrl(path);
  const row = {
    filename: file.name,
    url: data.publicUrl,
    alt,
    width: null as number | null,
    height: null as number | null,
    size_bytes: file.size,
    mime: file.type || 'application/octet-stream',
  };
  const { data: inserted, error: insErr } = await supabase.from('media_assets').insert(row).select().single();
  if (insErr) sbErr(insErr);
  return inserted as MediaRow;
}

// ------------------------------------------------------------------ analytics events
export async function listEvents(params: ListParams = {}): Promise<Paged<EventRow>> {
  return listRows<EventRow>('analytics_events', { ...params, sort: params.sort || 'created_at', dir: params.dir || 'desc' });
}

// ------------------------------------------------------------------ system health
export async function getSystemHealth(): Promise<SystemHealthReport> {
  const mode = await detectMode();
  const items: HealthItem[] = [];
  const now = new Date().toISOString();

  // Database / backend
  if (mode === 'supabase') {
    const t0 = Date.now();
    const { error } = await supabase.from('settings').select('key').limit(1);
    items.push({ key: 'database', label: 'Database (Supabase)', status: error ? 'error' : 'operational', detail: error ? error.message : `Reachable · ${Date.now() - t0}ms` });
    const { data: sess } = await supabase.auth.getSession();
    items.push({ key: 'auth', label: 'Authentication', status: sess?.session ? 'operational' : 'warning', detail: sess?.session ? `Signed in · ${sess.session.user.email}` : 'No active session' });
  } else if (mode === 'local') {
    try {
      const h = await localFetch<{ counts: Record<string, number> }>('/health');
      items.push({ key: 'database', label: 'Database (local preview API)', status: 'operational', detail: `${Object.keys(h.counts).length} collections online` });
      items.push({ key: 'auth', label: 'Authentication (local sessions)', status: 'operational', detail: 'Preview mode — production uses Supabase Auth' });
    } catch (e) {
      items.push({ key: 'database', label: 'Database (local preview API)', status: 'error', detail: (e as Error).message });
    }
  } else {
    items.push({ key: 'database', label: 'Database', status: 'error', detail: 'Not connected — apply supabase/admin-schema.sql' });
    items.push({ key: 'auth', label: 'Authentication', status: 'error', detail: 'Requires Supabase schema' });
  }

  // Public website
  try {
    const res = await fetch('/', { signal: timeout(4000) });
    items.push({ key: 'website', label: 'Public website', status: res.ok ? 'operational' : 'error', detail: `HTTP ${res.status}` });
  } catch {
    items.push({ key: 'website', label: 'Public website', status: 'error', detail: 'Unreachable' });
  }

  // robots.txt
  try {
    const res = await fetch('/robots.txt', { signal: timeout(4000) });
    const txt = res.ok ? await res.text() : '';
    const hasSitemap = /sitemap:/i.test(txt);
    items.push({ key: 'robots', label: 'robots.txt', status: res.ok && hasSitemap ? 'operational' : res.ok ? 'warning' : 'error', detail: res.ok ? (hasSitemap ? `Sitemap declared · ${txt.length} bytes` : 'Missing Sitemap declaration') : `HTTP ${res.status}` });
  } catch {
    items.push({ key: 'robots', label: 'robots.txt', status: 'error', detail: 'Unreachable' });
  }

  // sitemap.xml
  try {
    const res = await fetch('/sitemap.xml', { signal: timeout(5000) });
    const txt = res.ok ? await res.text() : '';
    const urls = (txt.match(/<url>/g) || []).length;
    items.push({ key: 'sitemap', label: 'sitemap.xml', status: res.ok && urls > 0 ? 'operational' : 'warning', detail: res.ok ? `${urls} URLs` : `HTTP ${res.status}` });
  } catch {
    items.push({ key: 'sitemap', label: 'sitemap.xml', status: 'error', detail: 'Unreachable' });
  }

  // PWA manifest + icons
  try {
    const res = await fetch('/manifest.json', { signal: timeout(4000) });
    if (res.ok) {
      const manifest = (await res.json()) as { icons?: Array<{ src: string }>; name?: string };
      let brokenIcons = 0;
      for (const icon of manifest.icons || []) {
        try {
          // GET + content-type (HEAD is unreliable through dev proxies and the
          // gateway soft-404s missing files as 200 text/html — an icon only
          // counts when it actually returns an image).
          const ir = await fetch(icon.src, { cache: 'no-store', signal: timeout(3000) });
          const ct = ir.headers.get('content-type') || '';
          if (!ir.ok || !ct.startsWith('image/')) brokenIcons++;
        } catch { brokenIcons++; }
      }
      const iconCount = (manifest.icons || []).length;
      items.push({
        key: 'pwa', label: 'PWA manifest',
        status: iconCount === 0 ? 'warning' : brokenIcons > 0 ? 'warning' : 'operational',
        detail: iconCount === 0 ? 'No icons declared' : brokenIcons > 0 ? `${brokenIcons}/${iconCount} icon(s) unreachable (404)` : `${iconCount} icon(s) valid (image responses)`,
      });
    } else {
      items.push({ key: 'pwa', label: 'PWA manifest', status: 'error', detail: `HTTP ${res.status}` });
    }
  } catch {
    items.push({ key: 'pwa', label: 'PWA manifest', status: 'error', detail: 'Unreachable' });
  }

  // Service worker
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
    items.push({
      key: 'sw', label: 'Service worker',
      status: reg ? 'operational' : 'warning',
      detail: reg ? `Registered · scope ${reg.scope}` : 'Not registered (site currently ships a self-unregistering SW)',
    });
  } catch {
    items.push({ key: 'sw', label: 'Service worker', status: 'unknown', detail: 'Service worker API unavailable' });
  }

  // Storage (media bucket) — only meaningful when the schema is installed
  if (mode !== 'none') {
    const t0 = Date.now();
    try {
      const { error } = await supabase.storage.from('media').list('', { limit: 1 });
      items.push({
        key: 'storage', label: 'Storage (media bucket)',
        status: error ? 'warning' : 'operational',
        detail: error ? error.message : `Reachable · ${Date.now() - t0}ms`,
      });
    } catch (e) {
      items.push({ key: 'storage', label: 'Storage (media bucket)', status: 'warning', detail: (e as Error).message || 'Unreachable' });
    }
  } else {
    items.push({ key: 'storage', label: 'Storage (media bucket)', status: 'unknown', detail: 'Not connected' });
  }

  // API (Supabase REST endpoint reachability)
  try {
    const metaEnv = (import.meta as { env?: Record<string, string> }).env || {};
    const restUrl = metaEnv.VITE_SUPABASE_URL || 'https://uspshkegxhrglbpxqtil.supabase.co';
    if (restUrl && mode !== 'local') {
      const t0 = Date.now();
      const res = await fetch(`${restUrl.replace(/\/$/, '')}/rest/v1/`, { signal: timeout(4000) });
      items.push({
        key: 'api', label: 'API (Supabase REST)',
        status: res.status >= 200 && res.status < 500 ? 'operational' : 'warning',
        detail: `HTTP ${res.status} · ${Date.now() - t0}ms`,
      });
    } else {
      items.push({ key: 'api', label: 'API', status: 'unknown', detail: 'N/A in preview mode' });
    }
  } catch {
    items.push({ key: 'api', label: 'API (Supabase REST)', status: 'warning', detail: 'Unreachable' });
  }

  // Deployment (static SPA — derived from the current origin)
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const onVercel = host.endsWith('.vercel.app');
  items.push({
    key: 'deployment', label: 'Deployment',
    status: 'operational',
    detail: onVercel ? `Vercel · ${host}` : host === 'localhost' || host === '127.0.0.1' ? `Local preview · ${host}` : host,
  });

  return { mode, checkedAt: now, items };
}

// ------------------------------------------------------------------ mode info (UI badge)
export function modeLabel(mode: AdminMode): string {
  if (mode === 'supabase') return 'Supabase · Production';
  if (mode === 'local') return 'Local preview API';
  return 'Not connected';
}
