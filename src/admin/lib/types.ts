// =============================================================================
// BRANIFY ADMIN — shared types (single contract for every admin module)
// ==============================================================================

export type AdminMode = 'supabase' | 'local' | 'none';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
}

export interface AdminSession {
  user: AdminUser;
  mode: AdminMode;
}

// ---------------------------------------------------------------- collections
export type CollectionKey =
  | 'services'
  | 'portfolio_projects'
  | 'tools'
  | 'ai_tools'
  | 'products'
  | 'blog_posts'
  | 'inquiries'
  | 'newsletter_subscribers'
  | 'payments'
  | 'seo_overrides'
  | 'redirects'
  | 'media_assets'
  | 'analytics_events'
  | 'activity_log'
  | 'not_found_log';

export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
  archived?: boolean | '';
  [filter: string]: string | number | boolean | undefined;
}

export interface Paged<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------- content rows
export interface SeoMeta {
  title?: string;
  description?: string;
  keywords?: string[];
  [k: string]: unknown;
}

export interface ServiceRow {
  id: string;
  slug: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  category: string;
  technologies: string[];
  deliverables: string[];
  stat_label: string;
  stat_value: string;
  price_note: string;
  active: boolean;
  featured: boolean;
  sort_order: number;
  seo: SeoMeta;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioRow {
  id: string;
  slug: string;
  title: string;
  category: string;
  client: string;
  description: string;
  hero_image: string;
  gallery: string[];
  technologies: string[];
  challenge: string;
  solution: string;
  outcome: string;
  live_url: string;
  featured: boolean;
  published: boolean;
  sort_order: number;
  seo: SeoMeta;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ToolRow {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  url: string;
  input_type: string;
  active: boolean;
  featured: boolean;
  popular: boolean;
  sort_order: number;
  seo: SeoMeta;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface AiToolRow {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  url: string;
  pricing: string;
  active: boolean;
  featured: boolean;
  sort_order: number;
  seo: SeoMeta;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  image: string;
  price: number;
  currency: string;
  status: 'active' | 'coming_soon' | string;
  delivery_info: string;
  file_url: string;
  featured: boolean;
  sort_order: number;
  seo: SeoMeta;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string;
  author_name: string;
  author_role: string;
  published_at: string | null;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | string;
  featured: boolean;
  seo: SeoMeta;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';

export interface LeadRow {
  id: string;
  name: string;
  email: string;
  company: string;
  services: string[];
  budget: string;
  timeline: string;
  details: string;
  phone: string;
  source: string;
  status: LeadStatus | string;
  notes: string;
  archived: boolean;
  created_at: string;
  updated_at?: string;
}

export interface SubscriberRow {
  id: string;
  email: string;
  created_at: string;
}

// ---------------------------------------------------------------- customers
// A customer = a real Supabase Auth user. We store/return ONLY profile data
// (no passwords, no tokens — those live exclusively inside Supabase Auth).
export interface CustomerRow {
  id: string;              // Supabase Auth user ID
  email: string;
  phone: string;           // only if provided by the customer
  name: string;            // only if provided by the customer
  status: string;          // active | blocked
  notes: string;
  created_at: string;      // registration date
  last_login_at: string;   // last sign-in when available
}

// ---------------------------------------------------------------- payments
// Control structure for future payment providers. No gateway is connected —
// the page shows an honest "Payment Gateway Not Connected" state until one is.
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled' | string;

export interface PaymentRow {
  id: string;
  provider: string;
  transaction_id: string;
  customer_email: string;
  customer_name: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  refund_status: string;
  webhook_status: string;
  payment_date: string | null;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface SeoOverrideRow {
  id: string;
  page_path: string;
  title: string;
  description: string;
  canonical: string;
  robots: string;
  og: { title?: string; description?: string; image?: string };
  twitter: { title?: string; description?: string; image?: string };
  schema_json: unknown | null;
  updated_at: string;
  updated_by: string;
}

export interface RedirectRow {
  id: string;
  source: string;
  destination: string;
  status: 301 | 302 | number;
  active: boolean;
  created_at: string;
}

export interface MediaRow {
  id: string;
  filename: string;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  size_bytes: number;
  mime: string;
  created_at: string;
}

export interface EventRow {
  id: string;
  name: string;
  path: string;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface ActivityRow {
  id: string;
  user_id?: string;
  user_email: string;
  action: string;
  target_type: string;
  target_id: string;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface NotFoundRow {
  path: string;
  hits: number;
  first_seen: string;
  last_seen: string;
}

// ---------------------------------------------------------------- dashboard
export interface DashboardData {
  counts: {
    customers: number;
    services: number;
    portfolio: number;
    tools: number;
    ai_tools: number;
    products: number;
    blog_published: number;
    blog_drafts: number;
    leads_total: number;
    leads_new: number;
    subscribers: number;
    media: number;
    redirects: number;
    not_found: number;
  };
  leadsByStatus: Record<string, number>;
  leadsOverTime: Array<{ day: string; count: number }>;
  eventsOverTime: Array<{ day: string; count: number }>;
  eventsByName: Array<{ name: string; count: number }>;
  recentLeads: LeadRow[];
  recentActivity: ActivityRow[];
}

export type HealthStatus = 'operational' | 'warning' | 'error' | 'unknown';

export interface HealthItem {
  key: string;
  label: string;
  status: HealthStatus;
  detail: string;
}

export interface SystemHealthReport {
  mode: AdminMode;
  checkedAt: string;
  items: HealthItem[];
}

// ---------------------------------------------------------------- settings
export interface SiteSettings {
  general?: { site_name?: string; site_url?: string; tagline?: string };
  brand?: { logo_url?: string; favicon_url?: string; default_og_image?: string };
  contact?: {
    email?: string;
    phone?: string;
    whatsapp?: string;
    whatsapp_display?: string;
    offices?: Array<{ label: string; lines: string[] }>;
  };
  social?: Record<string, string>;
  seo_defaults?: {
    title_template?: string;
    default_title?: string;
    default_description?: string;
    default_og_image?: string;
    title_max_length?: number;
    description_max_length?: number;
  };
  performance?: { analytics_provider?: string };
  [k: string]: unknown;
}

// ---------------------------------------------------------------- search
export interface SearchHit {
  type: string;
  id: string;
  title: string;
  sub: string;
  href: string;
}

export const LEAD_STATUSES: LeadStatus[] = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

export const EVENT_DEFS = [
  'whatsapp_click',
  'lead_submit',
  'contact_submit',
  'newsletter_signup',
  'tool_launch',
  'tool_page_view',
  'ai_tool_click',
  'product_click',
  'pwa_install',
  'start_project',
  'book_consultation',
  'not_found',
] as const;
