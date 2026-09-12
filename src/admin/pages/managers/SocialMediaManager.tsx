// =============================================================================
// BRANIFY ADMIN — Social Media Manager (Phase 2)
// -----------------------------------------------------------------------------
// /admin/social — the AI Social Media Manager hub:
//   • CONNECTIONS  Facebook Page + Instagram Professional via Meta OAuth
//                  (server-side /api/meta/oauth/start → callback; tokens are
//                  encrypted server-side, the browser only sees metadata)
//   • CONTENT      today / upcoming / drafts / pending approval / scheduled /
//                  published / failed pipeline with approve · schedule ·
//                  publish now · duplicate · delete
//   • CALENDAR     day / week / month views, drag-to-reschedule
//   • AI TOOLS     Generate Post · Weekly Plan · From Blog · From Service
//   • SETTINGS     approval mode · auto publish · default times · posting
//                  days · brand voice · enabled platforms · run-due-now
//
// Reuses the existing admin auth (RLS via the admin session), CRUD helpers,
// UI kit, toast and activity_log. No second dashboard style, no parallel CMS.
// =============================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays, Facebook, Instagram, Loader2, Plus, RefreshCw, Send,
  Settings as SettingsIcon, Share2, Sparkles, Trash2, Wand2,
} from 'lucide-react';
import {
  Badge, Btn, Card, ChipsInput, ConfirmDialog, EmptyState, ErrorBlock, Field, Input,
  LoadingBlock, Modal, Select, Tabs, Textarea, Toggle, cx, useToast,
} from '../../ui';
import {
  AdminError, createRow, deleteRow, getSettings, listRows, logActivity, updateRow, updateSettings,
} from '../../lib/backend';
import type { AdminPageProps } from '../../lib/auth';
import {
  SOCIAL_DEFAULT_SETTINGS, type SocialConnectionRow, type SocialPlatform, type SocialPostRow,
  type SocialPublishingSettings, type SocialStatus,
} from '../../lib/types';
import {
  SocialApiError, connectErrorMessage, metaOAuthStartUrl, publishDueNow, publishSocialPost,
} from '../../lib/socialApi';
import { SocialComposer, type ComposerBlogOption, type ComposerServices } from './SocialComposer';
import { SocialCalendar } from './SocialCalendar';
import { consumeBlogPromoteSeed } from './socialBridge';
import { servicesRegistry } from '../../../data/servicesRegistry';

const SITE_ORIGIN = 'https://branify.store';
const PLATFORMS: Array<{ id: SocialPlatform; label: string }> = [
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
];
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type ContentFilter = 'today' | 'upcoming' | 'drafts' | 'pending' | 'scheduled' | 'published' | 'failed' | 'all';

function fmtWhen(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export const SocialMediaManager: React.FC<AdminPageProps> = ({ query }) => {
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [fatal, setFatal] = useState<string>('');
  const [connections, setConnections] = useState<SocialConnectionRow[]>([]);
  const [posts, setPosts] = useState<SocialPostRow[]>([]);
  const [blogs, setBlogs] = useState<ComposerBlogOption[]>([]);
  const [settings, setSettings] = useState<SocialPublishingSettings>(SOCIAL_DEFAULT_SETTINGS);
  const [tab, setTab] = useState<'content' | 'calendar' | 'settings'>('content');
  const [filter, setFilter] = useState<ContentFilter>('all');
  const [composer, setComposer] = useState<{ open: boolean; mode: 'single' | 'weekly' | 'from_blog' | 'from_service' }>({ open: false, mode: 'single' });
  const [editing, setEditing] = useState<SocialPostRow | null>(null);
  const [confirmAsk, setConfirmAsk] = useState<{ title: string; message: string; danger: boolean; run: () => Promise<void> } | null>(null);
  const [busy, setBusy] = useState('');
  const [draftSettings, setDraftSettings] = useState<SocialPublishingSettings>(SOCIAL_DEFAULT_SETTINGS);

  // ------------------------------------------------------------ data loads
  const loadAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [conns, postPage, settingsAll, blogPage] = await Promise.all([
        listRows<SocialConnectionRow>('social_connections', { pageSize: 10 }),
        listRows<SocialPostRow>('social_posts', { pageSize: 200, sort: 'created_at', dir: 'desc' }),
        getSettings(),
        listRows<ComposerBlogOption & { status?: string; excerpt?: string }>('blog_posts', { pageSize: 40, sort: 'created_at', dir: 'desc' }),
      ]);
      setConnections(conns.rows);
      setPosts(postPage.rows);
      setBlogs(blogPage.rows.filter((b) => (b as unknown as { status?: string }).status === 'published').map((b) => ({
        id: b.id, title: b.title, slug: b.slug, excerpt: (b as unknown as { excerpt?: string }).excerpt || '',
      })));
      const merged = { ...SOCIAL_DEFAULT_SETTINGS, ...((settingsAll as Record<string, unknown>).social_publishing as Partial<SocialPublishingSettings> || {}) };
      setSettings(merged);
      setDraftSettings(merged);
      setFatal('');
    } catch (e) {
      const msg = e instanceof AdminError || e instanceof SocialApiError ? e.message : (e as Error).message || 'Load failed.';
      // The most common first-run cause: the social schema has not been applied yet.
      setFatal(/social_posts|schema|relation.*does not exist|PGRST205/i.test(msg)
        ? 'The social tables are not in the database yet. Run supabase/social-schema.sql in the Supabase SQL Editor, then reload.'
        : msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // mount: load + OAuth redirect banners + blog→social bridge + silent due run
  useEffect(() => {
    void loadAll();
    const connected = query.get('connected');
    const connectError = query.get('connect_error');
    if (connected) {
      push('success', `Connected: ${connected.split(',').join(' + ')}. Meta tokens are stored encrypted on the server.`);
      void logActivity('supabase', null, 'social.connect', 'social_connection', connected, { via: 'meta-oauth' });
    }
    if (connectError) {
      push('error', connectErrorMessage(connectError));
    }
    const seed = consumeBlogPromoteSeed();
    if (seed) {
      setComposer({ open: true, mode: 'from_blog' });
      push('info', `Promoting “${seed.title}” — pick it in the blog selector if it is not preselected.`);
    }
    if (connected || connectError) {
      window.history.replaceState({}, '', '/admin/social');
      window.dispatchEvent(new Event('branify:admin-nav'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // silent catch-up of due scheduled posts when auto publish is on
  useEffect(() => {
    if (loading || fatal || !settings.auto_publish) return;
    void (async () => {
      try {
        const r = await publishDueNow();
        if (r.published > 0) {
          push('info', `Auto-publish released ${r.published} scheduled post${r.published === 1 ? '' : 's'}.`);
          void loadAll(true);
        }
      } catch { /* silent — cron also covers this */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, fatal, settings.auto_publish]);

  // ------------------------------------------------------------ connections
  const connFor = (p: SocialPlatform): SocialConnectionRow | undefined => connections.find((c) => c.platform === p);
  const fb = connFor('facebook');
  const ig = connFor('instagram');

  const disconnect = (p: SocialPlatform) => {
    const row = connFor(p);
    if (!row) return;
    setConfirmAsk({
      title: `Disconnect ${p === 'facebook' ? 'Facebook' : 'Instagram'}?`,
      message: 'Scheduled publishing for this platform stops until you reconnect. Scheduled drafts are kept. The Meta account itself is not touched.',
      danger: true,
      run: async () => {
        await deleteRow('social_connections', row.id);
        void logActivity('supabase', null, 'social.disconnect', 'social_connection', p, {});
        push('success', `${p === 'facebook' ? 'Facebook' : 'Instagram'} disconnected.`);
        void loadAll(true);
      },
    });
  };

  const ConnectionCard: React.FC<{ platform: SocialPlatform }> = ({ platform }) => {
    const row = connFor(platform);
    const isFb = platform === 'facebook';
    const label = isFb ? 'Facebook' : 'Instagram';
    const connected = Boolean(row?.token_encrypted);
    const expired = row?.token_expires_at ? new Date(row.token_expires_at).getTime() < Date.now() : false;
    const handle = connected ? (isFb ? row?.page_name : row?.ig_username ? `@${row.ig_username}` : row?.page_name) : '';
    return (
      <Card
        title={label}
        subtitle={connected ? 'Connected via Meta OAuth' : 'Not connected'}
        actions={
          connected
            ? <>
              <Btn size="sm" variant="outline" onClick={() => { window.location.href = metaOAuthStartUrl(platform); }}>Reconnect</Btn>
              <Btn size="sm" variant="danger" onClick={() => disconnect(platform)}>Disconnect</Btn>
            </>
            : <Btn size="sm" variant="gold" icon={isFb ? Facebook : Instagram} onClick={() => { window.location.href = metaOAuthStartUrl(platform); }}>Connect {label}</Btn>
        }
      >
        {connected ? (
          <div className="space-y-1.5 text-sm">
            <p className="flex items-center gap-2 font-semibold text-emerald-600">Connected ✓ <span className="font-normal text-[#111827]">{isFb ? `Page: ${handle || '—'}` : `Account: ${handle || '—'}`}</span></p>
            <p className="text-xs text-[#475569]">Connected {fmtWhen(row?.connected_at || null)}{row?.token_expires_at ? ` · token ${expired ? 'EXPIRED — reconnect required' : `valid until ${fmtWhen(row.token_expires_at)}`}` : ' · long-lived token'}</p>
            {expired && <Badge tone="red">Token expired — reconnect</Badge>}
            {!isFb && !row?.ig_user_id && <Badge tone="amber">No Instagram Professional account linked to the Page yet</Badge>}
            <p className="text-[11px] text-[#475569]">Access tokens are stored AES-encrypted server-side and are never shown in the dashboard.</p>
          </div>
        ) : (
          <div className="space-y-1.5 text-sm text-[#475569]">
            <p>{isFb
              ? 'Connect your Facebook Page to publish posts and photos.'
              : 'Connect an Instagram Professional (Business/Creator) account linked to your Facebook Page.'}</p>
            {!isFb && fb && <p className="text-xs">Tip: reconnect Facebook if your Instagram account is linked to a different Page.</p>}
          </div>
        )}
      </Card>
    );
  };

  // ------------------------------------------------------------ content pipeline
  const filtered = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    return posts.filter((p) => {
      switch (filter) {
        case 'today': {
          const when = p.scheduled_at ? new Date(p.scheduled_at) : null;
          return p.status === 'scheduled' && when !== null && when >= today && when < tomorrow;
        }
        case 'upcoming': {
          const when = p.scheduled_at ? new Date(p.scheduled_at) : null;
          return p.status === 'scheduled' && when !== null && when >= tomorrow;
        }
        case 'drafts': return ['draft', 'pending_approval'].includes(p.status);
        case 'pending': return p.status === 'pending_approval';
        case 'scheduled': return p.status === 'scheduled';
        case 'published': return p.status === 'published';
        case 'failed': return p.status === 'failed';
        default: return true;
      }
    });
  }, [posts, filter]);

  const approve = async (p: SocialPostRow) => {
    setBusy(p.id);
    try {
      await updateRow<SocialPostRow>('social_posts', p.id, { status: 'approved', approved_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      void logActivity('supabase', null, 'social.approve', 'social_post', p.id, { platform: p.platform });
      push('success', 'Approved — ready to schedule or publish.');
      void loadAll(true);
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Approve failed.');
    } finally { setBusy(''); }
  };

  const schedule = async (p: SocialPostRow, slot: string) => {
    setBusy(p.id);
    try {
      await updateRow<SocialPostRow>('social_posts', p.id, { status: 'scheduled', scheduled_at: new Date(slot).toISOString(), updated_at: new Date().toISOString() });
      void logActivity('supabase', null, 'social.schedule', 'social_post', p.id, { scheduled_at: slot, platform: p.platform });
      push('success', `Scheduled for ${fmtWhen(new Date(slot).toISOString())}.`);
      void loadAll(true);
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Scheduling failed.');
    } finally { setBusy(''); }
  };

  const publishNow = async (p: SocialPostRow) => {
    setBusy(p.id);
    try {
      const out = await publishSocialPost(p.id);
      push('success', `Published to ${out.platform}.`);
      void loadAll(true);
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Publishing failed.');
      void loadAll(true);
    } finally { setBusy(''); }
  };

  const duplicate = async (p: SocialPostRow) => {
    setBusy(p.id);
    try {
      await createRow<SocialPostRow>('social_posts', {
        platform: p.platform, content_type: p.content_type, title: `${p.title || 'Untitled'} (copy)`,
        caption: p.caption, hashtags: p.hashtags, media_url: p.media_url, media_type: p.media_type,
        status: 'draft', approval_required: p.approval_required, source_type: p.source_type, source_id: p.source_id,
        created_by: p.created_by, metadata: { ...p.metadata, duplicated_from: p.id },
      });
      push('success', 'Duplicated as draft.');
      void loadAll(true);
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Duplicate failed.');
    } finally { setBusy(''); }
  };

  const remove = (p: SocialPostRow) => {
    setConfirmAsk({
      title: 'Delete this social post?',
      message: `“${p.title || p.caption.slice(0, 60)}” will be removed permanently.`,
      danger: true,
      run: async () => {
        await deleteRow('social_posts', p.id);
        push('success', 'Post deleted.');
        void loadAll(true);
      },
    });
  };

  // ------------------------------------------------------------ editor modal
  const [form, setForm] = useState<Partial<SocialPostRow>>({});
  const openEditor = (p: SocialPostRow | null, presetDate?: string) => {
    if (p) setForm({ ...p });
    else {
      setForm({
        platform: 'facebook', content_type: 'facebook_post', title: '', caption: '', hashtags: [],
        media_url: '', status: 'draft', approval_required: settings.approval_required,
        scheduled_at: presetDate || null, source_type: 'manual', created_by: 'admin',
      });
    }
    setEditing(p || {} as SocialPostRow);
  };
  const saveEditor = async () => {
    const isNew = !editing?.id;
    setBusy('editor');
    try {
      const payload: Record<string, unknown> = {
        platform: form.platform || 'facebook',
        content_type: form.content_type || 'facebook_post',
        title: form.title || '', caption: form.caption || '', hashtags: form.hashtags || [],
        media_url: form.media_url || '', media_type: form.media_url ? 'image' : '',
        status: form.status || 'draft', approval_required: form.approval_required ?? true,
        scheduled_at: form.scheduled_at || null, updated_at: new Date().toISOString(),
      };
      if (isNew) {
        await createRow<SocialPostRow>('social_posts', { ...payload, created_by: 'admin', source_type: 'manual' });
      } else {
        await updateRow<SocialPostRow>('social_posts', editing.id, payload);
        if (payload.status === 'scheduled' && form.scheduled_at) {
          void logActivity('supabase', null, 'social.schedule', 'social_post', editing.id, { scheduled_at: form.scheduled_at });
        }
      }
      push('success', isNew ? 'Draft created.' : 'Saved.');
      setEditing(null);
      void loadAll(true);
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Save failed.');
    } finally { setBusy(''); }
  };

  // ------------------------------------------------------------ settings
  const saveSettings = async () => {
    setBusy('settings');
    try {
      await updateSettings({ social_publishing: draftSettings });
      setSettings(draftSettings);
      push('success', 'Social settings saved.');
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Saving settings failed.');
    } finally { setBusy(''); }
  };

  const runDue = async () => {
    setBusy('due');
    try {
      const r = await publishDueNow();
      push(r.published > 0 ? 'success' : 'info',
        r.published > 0 ? `Published ${r.published} due post${r.published === 1 ? '' : 's'}.`
          : r.reason === 'auto_publish_off' ? 'Auto publish is OFF — enable it in settings, or publish posts manually.'
          : 'Nothing due right now.');
      void loadAll(true);
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Due run failed.');
    } finally { setBusy(''); }
  };

  // ------------------------------------------------------------ render
  if (loading) return <LoadingBlock label="Loading Social Media Manager…" />;
  if (fatal) {
    return <ErrorBlock title="Social Media unavailable" message={fatal} onRetry={() => void loadAll()} />;
  }

  const composerServices: ComposerServices[] = servicesRegistry.map((s) => ({
    name: s.name, slug: s.slug, tagline: s.tagline, shortDescription: s.shortDescription,
  }));

  const counters = {
    drafts: posts.filter((p) => ['draft', 'pending_approval'].includes(p.status)).length,
    scheduled: posts.filter((p) => p.status === 'scheduled').length,
    published: posts.filter((p) => p.status === 'published').length,
    failed: posts.filter((p) => p.status === 'failed').length,
  };

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-lg font-bold text-[#111827]">
            <Share2 size={18} className="text-[#8F6B2D]" /> Social Media
            <Badge tone="gold">AI · BUILD. BRAND. GROW.</Badge>
          </h1>
          <p className="text-xs text-[#475569]">Facebook Page + Instagram Professional · approval-first publishing · calendar &amp; AI content plans</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn variant="outline" icon={Wand2} onClick={() => setComposer({ open: true, mode: 'from_service' })}>From Service</Btn>
          <Btn variant="outline" icon={RefreshCw} onClick={() => setComposer({ open: true, mode: 'from_blog' })}>From Blog</Btn>
          <Btn variant="outline" icon={Wand2} onClick={() => setComposer({ open: true, mode: 'weekly' })}>Generate Weekly Plan</Btn>
          <Btn variant="gold" icon={Sparkles} onClick={() => setComposer({ open: true, mode: 'single' })}>✨ AI Generate Social Post</Btn>
        </div>
      </div>

      <Tabs
        tabs={[
          { id: 'content', label: 'Content', badge: counters.drafts || undefined },
          { id: 'calendar', label: 'Calendar', badge: counters.scheduled || undefined },
          { id: 'settings', label: 'Settings' },
        ]}
        active={tab}
        onChange={(id) => setTab(id as typeof tab)}
      />

      {tab === 'content' && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ConnectionCard platform="facebook" />
            <ConnectionCard platform="instagram" />
          </div>

          <Card
            title="Content pipeline"
            subtitle={`${counters.drafts} drafts · ${counters.scheduled} scheduled · ${counters.published} published · ${counters.failed} failed`}
            actions={<Btn size="sm" variant="outline" icon={Plus} onClick={() => openEditor(null)}>New Post</Btn>}
          >
            <div className="mb-3 flex flex-wrap gap-1.5">
              {([
                ['all', 'All'], ['today', "Today's posts"], ['upcoming', 'Upcoming'], ['drafts', 'Drafts'],
                ['pending', 'Pending approval'], ['scheduled', 'Scheduled'], ['published', 'Published'], ['failed', 'Failed'],
              ] as Array<[ContentFilter, string]>).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setFilter(id)}
                  className={cx('rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors',
                    filter === id ? 'border-[#C9A45C] bg-[#C9A45C]/10 text-[#8F6B2D]' : 'border-[#E2E8F0] text-[#475569] hover:border-[#C9A45C]/50')}
                >{label}</button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={Share2}
                title="Nothing here yet"
                hint="Generate a post with AI, or connect a platform and schedule your first update."
                action={<Btn variant="gold" icon={Sparkles} onClick={() => setComposer({ open: true, mode: 'single' })}>✨ AI Generate Social Post</Btn>}
              />
            ) : (
              <div className="space-y-2">
                {filtered.map((p) => (
                  <div key={p.id} className="rounded-xl border border-[#E2E8F0] bg-white p-3">
                    <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                      {p.platform === 'facebook' ? <Facebook size={13} className="text-[#1877F2]" /> : <Instagram size={13} className="text-[#C13584]" />}
                      <Badge tone={p.status === 'published' ? 'green' : p.status === 'failed' ? 'red' : p.status === 'scheduled' ? 'gold' : p.status === 'approved' ? 'violet' : 'zinc'}>
                        {p.status.replace('_', ' ')}
                      </Badge>
                      {p.source_type !== 'manual' && <Badge tone="steel">{p.source_type.replace('_', ' ')}</Badge>}
                      <span className="text-xs font-bold text-[#111827]">{p.title || p.caption.slice(0, 60) || 'Untitled'}</span>
                      <span className="text-[11px] text-[#475569]">
                        {p.status === 'published' ? `published ${fmtWhen(p.published_at)}` : p.scheduled_at ? `for ${fmtWhen(p.scheduled_at)}` : `created ${fmtWhen(p.created_at)}`}
                      </span>
                      {p.error_message && <span className="text-[11px] text-red-600">⚠ {p.error_message.slice(0, 90)}</span>}
                    </div>
                    <div className="mt-1 flex gap-2">
                      {p.media_url && (
                        <img
                          src={p.media_url}
                          alt={String((p.metadata as { alt_text?: string } | null)?.alt_text || `${p.title || 'post'} media`)}
                          className="h-16 w-16 shrink-0 rounded-lg border border-[#E2E8F0] object-cover"
                          loading="lazy"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 whitespace-pre-wrap text-[13px] text-[#475569]">{p.caption}</p>
                        {p.media_url && <p className="mt-0.5 text-[11px] text-[#475569]">media attached{p.media_type ? ` (${p.media_type})` : ''}</p>}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {['draft', 'pending_approval', 'scheduled'].includes(p.status) && p.approval_required && !p.approved_at && (
                        <Btn size="sm" variant="outline" loading={busy === p.id} onClick={() => approve(p)}>Approve</Btn>
                      )}
                      {p.status !== 'published' && p.status !== 'publishing' && (
                        <>
                          <Btn size="sm" variant="subtle" onClick={() => openEditor(p)}>Edit</Btn>
                          <Btn size="sm" variant="gold" icon={Send} loading={busy === p.id} onClick={() => publishNow(p)}>Publish Now</Btn>
                        </>
                      )}
                      {p.status === 'published' && p.external_post_id && (
                        <a
                          href={p.platform === 'facebook'
                            ? `https://www.facebook.com/${p.external_post_id.includes('_') ? p.external_post_id.split('_')[1] : p.external_post_id}`
                            : `https://www.instagram.com/p/${p.external_post_id}/`}
                          target="_blank" rel="noreferrer"
                          className="inline-flex h-8 items-center rounded-lg border border-[rgba(201,164,92,0.25)] px-3 text-xs font-semibold text-[#475569] hover:text-[#8F6B2D]"
                        >View live</a>
                      )}
                      <Btn size="sm" variant="ghost" onClick={() => void duplicate(p)} disabled={busy === p.id}>Duplicate</Btn>
                      <Btn size="sm" variant="ghost" onClick={() => remove(p)} disabled={busy === p.id} icon={Trash2}>Delete</Btn>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === 'calendar' && (
        <Card title="Content calendar" subtitle="Month / week / day · drag chips to reschedule">
          <SocialCalendar
            posts={posts}
            onOpenPost={(p) => openEditor(p)}
            onAddOnDay={(iso) => openEditor(null, iso)}
            onReschedule={(p, iso) => {
              const keep = new Date(p.scheduled_at || Date.now());
              const target = new Date(iso);
              target.setHours(keep.getHours(), keep.getMinutes(), 0, 0);
              void schedule(p, target.toISOString());
            }}
          />
        </Card>
      )}

      {tab === 'settings' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Posting modes" subtitle="Approval-first is the default — nothing publishes itself">
            <div className="space-y-3">
              <Toggle
                checked={draftSettings.approval_required}
                onChange={(v) => setDraftSettings((s) => ({ ...s, approval_required: v }))}
                label="Approval required (AI content waits for review)"
              />
              <Toggle
                checked={draftSettings.auto_publish}
                onChange={(v) => setDraftSettings((s) => ({ ...s, auto_publish: v }))}
                label="Auto publish (scheduled approved posts release automatically)"
              />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Default Facebook time"><Input type="time" value={draftSettings.facebook_time} onChange={(e) => setDraftSettings((s) => ({ ...s, facebook_time: e.target.value }))} /></Field>
                <Field label="Default Instagram time"><Input type="time" value={draftSettings.instagram_time} onChange={(e) => setDraftSettings((s) => ({ ...s, instagram_time: e.target.value }))} /></Field>
              </div>
              <Field label="Weekly posting days">
                <div className="flex flex-wrap gap-1.5">
                  {WEEK_DAYS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDraftSettings((s) => ({ ...s, posting_days: s.posting_days.includes(d) ? s.posting_days.filter((x) => x !== d) : [...s.posting_days, d] }))}
                      className={cx('rounded-lg border px-2.5 py-1 text-xs font-semibold',
                        draftSettings.posting_days.includes(d) ? 'border-[#C9A45C] bg-[#C9A45C]/10 text-[#8F6B2D]' : 'border-[#E2E8F0] text-[#475569]')}
                    >{d}</button>
                  ))}
                </div>
              </Field>
              <Field label="Timezone" hint="'site' = the composing admin's browser timezone. Scheduled slots display in your current timezone.">
                <Input value={draftSettings.timezone} onChange={(e) => setDraftSettings((s) => ({ ...s, timezone: e.target.value }))} />
              </Field>
              <Field label="Allowed platforms">
                <div className="flex gap-4">
                  {PLATFORMS.map((p) => (
                    <Toggle
                      key={p.id}
                      checked={draftSettings.platforms_enabled.includes(p.id)}
                      label={p.label}
                      onChange={(v) => setDraftSettings((s) => ({
                        ...s,
                        platforms_enabled: v ? [...new Set([...s.platforms_enabled, p.id])] : s.platforms_enabled.filter((x) => x !== p.id),
                      }))}
                    />
                  ))}
                </div>
              </Field>
              <Field label="Brand voice" hint="Fed to the AI with every generation.">
                <Textarea rows={3} value={draftSettings.brand_voice} onChange={(e) => setDraftSettings((s) => ({ ...s, brand_voice: e.target.value }))} />
              </Field>
              <div className="flex gap-2">
                <Btn variant="gold" loading={busy === 'settings'} onClick={saveSettings}>Save settings</Btn>
                <Btn variant="outline" icon={Send} loading={busy === 'due'} onClick={runDue}>Run due publish now</Btn>
              </div>
            </div>
          </Card>
          <Card title="How publishing works" subtitle="Server-side, idempotent, approval-first">
            <div className="space-y-2 text-sm text-[#475569]">
              <p><strong className="text-[#111827]">1 · Generate</strong> — AI drafts land as drafts (approval required by default). Never auto-published.</p>
              <p><strong className="text-[#111827]">2 · Approve</strong> — you review, edit and approve. Approved posts can be scheduled or published.</p>
              <p><strong className="text-[#111827]">3 · Schedule</strong> — pick a slot; the server cron (every 5 min) releases due posts when Auto publish is ON, claiming each atomically so nothing double-posts.</p>
              <p><strong className="text-[#111827]">4 · Publish</strong> — Facebook via Graph API (photos / feed), Instagram via media container → publish on the linked Professional account.</p>
              <p className="rounded-lg border border-[#E2E8F0] bg-white p-2 text-xs">
                Meta setup checklist (one-time, Meta App Dashboard): create app “Branify AI Marketing”, add
                <strong> Facebook Login for Business</strong>, set the redirect URI
                <code className="mx-1 rounded bg-[#0F172A]/[0.06] px-1">{SITE_ORIGIN}/api/meta/oauth/callback</code>
                and fill META_APP_ID / META_APP_SECRET in Vercel env vars.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* composer */}
      <SocialComposer
        open={composer.open}
        onClose={() => setComposer((c) => ({ ...c, open: false }))}
        mode={composer.mode}
        onModeChange={(m) => setComposer((c) => ({ ...c, mode: m }))}
        platformsEnabled={settings.platforms_enabled.length ? settings.platforms_enabled : ['facebook', 'instagram']}
        approvalRequired={settings.approval_required}
        brandVoice={settings.brand_voice}
        recentCaptions={posts.slice(0, 8).map((p) => p.caption)}
        recentBlogTitles={blogs.slice(0, 10).map((b) => b.title)}
        blogs={blogs}
        services={composerServices}
        defaultTimes={{ facebook: settings.facebook_time, instagram: settings.instagram_time }}
        onSaved={() => void loadAll(true)}
      />

      {/* editor */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit social post' : 'New social post'}
        width="lg"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setEditing(null)}>Cancel</Btn>
            {editing?.id && ['draft', 'pending_approval', 'approved', 'scheduled'].includes(editing.status) && !form.approved_at && form.approval_required && (
              <Btn variant="outline" loading={busy === editing.id} onClick={() => { setEditing(null); void approve(editing); }}>Approve</Btn>
            )}
            <Btn variant="gold" loading={busy === 'editor'} onClick={saveEditor}>Save</Btn>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Platform">
            <Select value={String(form.platform || 'facebook')} onChange={(e) => {
              const p = e.target.value as SocialPlatform;
              setForm((f) => ({ ...f, platform: p, content_type: p === 'facebook' ? 'facebook_post' : 'instagram_image' }));
            }}>
              {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </Select>
          </Field>
          <Field label="Content type">
            <Select value={String(form.content_type || 'facebook_post')} onChange={(e) => setForm((f) => ({ ...f, content_type: e.target.value as SocialPostRow['content_type'] }))}>
              {['facebook_post', 'instagram_image', 'instagram_carousel', 'instagram_reel_idea', 'instagram_story_idea'].map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Title (internal)"><Input value={String(form.title || '')} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Caption" required><Textarea rows={6} value={String(form.caption || '')} onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))} /></Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Hashtags" hint="Enter to add · they are appended for Instagram, kept off Facebook">
              <ChipsInput value={form.hashtags || []} onChange={(v) => setForm((f) => ({ ...f, hashtags: v }))} placeholder="#branding" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Media URL (public image)" hint="Paste an asset URL from Admin → Media — Instagram requires a publicly reachable image.">
              <Input value={String(form.media_url || '')} onChange={(e) => setForm((f) => ({ ...f, media_url: e.target.value }))} placeholder="https://…/media/…jpg" />
            </Field>
          </div>
          <Field label="Schedule for"><Input type="datetime-local" value={form.scheduled_at ? new Date(form.scheduled_at).toISOString().slice(0, 16) : ''} onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : null, status: e.target.value ? 'scheduled' : f.status }))} /></Field>
          <Field label="Status">
            <Select value={String(form.status || 'draft')} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as SocialStatus }))}>
              {['draft', 'pending_approval', 'approved', 'scheduled', 'cancelled'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Toggle checked={form.approval_required ?? true} label="Approval required before publishing" onChange={(v) => setForm((f) => ({ ...f, approval_required: v }))} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmAsk)}
        onClose={() => setConfirmAsk(null)}
        onConfirm={() => { const run = confirmAsk?.run; setConfirmAsk(null); void run?.(); }}
        title={confirmAsk?.title || ''}
        message={confirmAsk?.message || ''}
        danger={confirmAsk?.danger}
      />
    </div>
  );
};

export default SocialMediaManager;
