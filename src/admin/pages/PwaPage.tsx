// =============================================================================
// BRANIFY ADMIN — PWA Center (real audits only)
// Fetches the live /manifest.json, probes every declared icon, reads the
// service-worker registration and cache storage — then renders an honest
// install-readiness verdict. Known real finding: manifest.json references
// /assets/icon-192.png + /assets/icon-512.png which do NOT exist in /public.
// (HEAD requests through the preview gateway are unreliable — static files
// return 500 and missing files soft-404 as 200 text/html — so icon probes use
// GET and validate the content-type is actually an image.)
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2, Download, FileJson, RefreshCw, Smartphone, TriangleAlert, XCircle,
} from 'lucide-react';
import type { AdminPageProps } from '../lib/auth';
import { Badge, Btn, Card, ErrorBlock, LoadingBlock, cx } from '../ui';
import { DataTable, type Column } from '../ui/DataTable';
import { timeAgo } from '../lib/format';

interface ManifestIcon {
  src: string;
  type?: string;
  sizes?: string;
  purpose?: string;
}

interface Manifest {
  name?: string;
  short_name?: string;
  start_url?: string;
  display?: string;
  theme_color?: string;
  background_color?: string;
  orientation?: string;
  categories?: string[];
  icons?: ManifestIcon[];
}

interface IconCheck extends ManifestIcon {
  id: string;
  status: number; // HTTP status, 0 = network error
  contentType: string;
  ok: boolean;
}

const SWATCH: React.FC<{ color?: string; label: string }> = ({ color, label }) => (
  <span className="inline-flex items-center gap-2">
    <span
      aria-hidden="true"
      className="inline-block h-4 w-4 rounded border border-white/25"
      style={{ background: color || 'transparent' }}
    />
    <span className="font-mono text-[12px] text-[#D8DCE2]">{color || `— (no ${label})`}</span>
  </span>
);

export const PwaPage: React.FC<AdminPageProps> = () => {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [iconChecks, setIconChecks] = useState<IconCheck[]>([]);
  const [sw, setSw] = useState<{ registered: boolean; detail: string } | null>(null);
  const [cacheKeys, setCacheKeys] = useState<string[]>([]);
  const [cacheSupported, setCacheSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  const run = useCallback(async (silent = false) => {
    if (silent) setChecking(true);
    else { setLoading(true); setError(null); }

    try {
      // ---------------------------------------------- manifest (real fetch)
      let m: Manifest | null = null;
      try {
        const res = await fetch('/manifest.json', { cache: 'no-store' });
        if (!res.ok) throw new Error(`manifest.json returned HTTP ${res.status}`);
        m = (await res.json()) as Manifest;
        setManifest(m);
      } catch (e) {
        setManifest(null);
        throw new Error((e as Error).message || 'manifest.json could not be fetched');
      }

      // ---------------------------------------------- icon probes (GET + content-type)
      const checks: IconCheck[] = await Promise.all(
        (m.icons || []).map(async (icon, i) => {
          const base: IconCheck = { ...icon, id: `${icon.src}-${i}`, status: 0, contentType: '', ok: false };
          try {
            const r = await fetch(icon.src, { cache: 'no-store' });
            const ct = r.headers.get('content-type') || '';
            // res.ok alone is NOT enough here: the preview gateway soft-404s
            // missing files as 200 text/html. A valid icon must be an image.
            const ok = r.ok && ct.startsWith('image/');
            return { ...base, status: r.status, contentType: ct, ok };
          } catch {
            return base;
          }
        }),
      );
      setIconChecks(checks);

      // ---------------------------------------------- service worker
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          setSw(reg
            ? { registered: true, detail: `Registered · scope ${reg.scope}` }
            : { registered: false, detail: 'Not registered — the site currently ships a self-unregistering service worker (cache-offline disabled by design)' });
        } else {
          setSw({ registered: false, detail: 'Service Worker API unavailable in this browser' });
        }
      } catch {
        setSw({ registered: false, detail: 'Service worker state could not be read' });
      }

      // ---------------------------------------------- cache storage
      try {
        if ('caches' in window) {
          setCacheKeys(await caches.keys());
          setCacheSupported(true);
        } else {
          setCacheSupported(false);
        }
      } catch {
        setCacheSupported(false);
      }

      setError(null);
    } catch (e) {
      setError((e as Error).message || 'PWA audit failed.');
    } finally {
      setLoading(false);
      setChecking(false);
      setCheckedAt(new Date().toISOString());
    }
  }, []);

  useEffect(() => { run(); }, [run]);

  // ------------------------------------------------------ install readiness
  const iconsValid = iconChecks.length > 0 && iconChecks.every((i) => i.ok);
  const checklist = manifest ? [
    { label: 'Web app manifest present', ok: true, detail: '/manifest.json fetched live' },
    {
      label: 'Icons valid & reachable',
      ok: iconsValid,
      detail: iconsValid
        ? `${iconChecks.length} icon(s) verified as images`
        : `${iconChecks.filter((i) => !i.ok).length} of ${iconChecks.length} icon(s) failing (missing files / served as HTML)`,
    },
    { label: 'display: standalone', ok: manifest.display === 'standalone', detail: `display = ${manifest.display || '—'}` },
    { label: 'start_url present', ok: Boolean(manifest.start_url), detail: `start_url = ${manifest.start_url || '—'}` },
    { label: 'theme_color present', ok: Boolean(manifest.theme_color), detail: `theme_color = ${manifest.theme_color || '—'}` },
  ] : [];
  const failing = checklist.filter((c) => !c.ok).length;
  const ready = manifest !== null && failing === 0;

  // ---------------------------------------------------------- icons columns
  const columns: Column<IconCheck>[] = [
    { key: 'src', label: 'Icon path', render: (r) => <span className="font-mono text-[11.5px] text-[#EDEFF2]">{r.src}</span> },
    { key: 'sizes', label: 'Sizes', hideOnMobile: true, render: (r) => <span className="tabular-nums text-[#A7AFBA]">{r.sizes || '—'}</span> },
    { key: 'purpose', label: 'Purpose', hideOnMobile: true, render: (r) => <span className="text-[#A7AFBA]">{r.purpose || '—'}</span> },
    {
      key: 'status', label: 'Probe result',
      render: (r) => r.ok ? (
        <Badge tone="green">Valid · HTTP {r.status}</Badge>
      ) : (
        <Badge tone="red">
          {r.status === 0 ? 'Unreachable' : r.ok === false && r.status === 200 ? 'Missing (served HTML)' : `HTTP ${r.status}`}
        </Badge>
      ),
    },
    { key: 'contentType', label: 'Content type', hideOnMobile: true, render: (r) => <span className="font-mono text-[10.5px] text-[#566072]">{r.contentType || '—'}</span> },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-40 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
        <LoadingBlock label="Auditing live PWA setup — fetching manifest, probing icons, reading service worker…" />
      </div>
    );
  }

  if (error && !manifest) {
    return <ErrorBlock title="PWA audit unavailable" message={error} onRetry={() => run()} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ---------------------------------------------------------- header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-extrabold text-[#F5F6F2] sm:text-2xl">
            PWA Center <span className="text-[#E8C97C]">— live audit</span>
          </h1>
          <p className="mt-1 text-xs text-[#A7AFBA] sm:text-sm">
            Everything below is probed in your browser right now — manifest, icons, service worker, cache storage.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {checkedAt && <span className="text-[11px] tabular-nums text-[#6B7280]">checked {timeAgo(checkedAt)}</span>}
          <Btn size="sm" variant="outline" icon={RefreshCw} loading={checking} onClick={() => run(true)}>
            Re-run audit
          </Btn>
        </div>
      </div>

      {/* ------------------------------------------------ manifest properties */}
      <Card
        title="Web App Manifest"
        subtitle="Fetched live from /manifest.json"
        actions={<Badge tone="gold"><FileJson size={11} /> manifest.json</Badge>}
        bodyClass="pt-1"
      >
        {manifest ? (
          <dl className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {([
              ['name', manifest.name],
              ['short_name', manifest.short_name],
              ['start_url', manifest.start_url],
              ['display', manifest.display],
              ['orientation', manifest.orientation],
              ['categories', (manifest.categories || []).length ? manifest.categories!.join(', ') : ''],
            ] as Array<[string, string | undefined]>).map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-3 border-b border-white/[0.05] pb-2">
                <dt className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#A7AFBA]">{k}</dt>
                <dd className={cx('truncate text-right text-[13px]', v ? 'text-[#F5F6F2]' : 'text-[#566072]')} title={v || ''}>{v || 'N/A'}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.05] pb-2">
              <dt className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#A7AFBA]">theme_color</dt>
              <dd><SWATCH color={manifest.theme_color} label="theme_color" /></dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.05] pb-2">
              <dt className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#A7AFBA]">background_color</dt>
              <dd><SWATCH color={manifest.background_color} label="background_color" /></dd>
            </div>
          </dl>
        ) : (
          <ErrorBlock title="Manifest not readable" message={error || 'N/A'} onRetry={() => run(true)} />
        )}
      </Card>

      {/* ------------------------------------------------------- icons audit */}
      <Card
        title="Icon Audit"
        subtitle="Each manifest icon probed live — a valid icon must return an image response"
        actions={<Badge tone={iconsValid ? 'green' : 'red'}>{iconsValid ? 'All valid' : 'Broken icons'}</Badge>}
        bodyClass="pt-1"
      >
        {iconChecks.length === 0 ? (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-3.5 py-3 text-xs text-amber-200">
            The manifest declares no icons — browsers will fall back to the favicon and install prompts will degrade.
          </p>
        ) : (
          <DataTable<IconCheck>
            columns={columns}
            rows={iconChecks}
            total={iconChecks.length}
            page={1}
            pageSize={Math.max(iconChecks.length, 1)}
            onPageChange={() => { /* single page — full audit table */ }}
            emptyTitle="No icons declared"
          />
        )}

        {!iconsValid && iconChecks.some((i) => i.src.startsWith('/assets/')) && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3.5">
            <TriangleAlert size={16} className="mt-0.5 shrink-0 text-amber-300" />
            <div className="text-xs leading-relaxed text-amber-200">
              <p className="font-bold uppercase tracking-wider">Real finding — manifest icons are missing</p>
              <p className="mt-1">
                Manifest references <span className="font-mono">/assets/icon-*.png</span> which don't exist in <span className="font-mono">/public</span>.
                Fix: add the files or update manifest.json paths to <span className="font-mono">/branify-icon.png</span> (192/512 sizes).
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* ------------------------------------------ service worker + cache */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Service Worker" subtitle="navigator.serviceWorker.getRegistration()" bodyClass="pt-1">
          {sw ? (
            <div
              className={cx(
                'flex items-start gap-3 rounded-xl border px-4 py-3.5',
                sw.registered
                  ? 'border-emerald-500/30 bg-emerald-500/[0.06]'
                  : 'border-amber-500/30 bg-amber-500/[0.06]',
              )}
            >
              {sw.registered
                ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-300" />
                : <TriangleAlert size={16} className="mt-0.5 shrink-0 text-amber-300" />}
              <div>
                <p className={cx('text-xs font-bold uppercase tracking-wider', sw.registered ? 'text-emerald-300' : 'text-amber-300')}>
                  {sw.registered ? 'Registered' : 'Not registered'}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#C9CED6]">{sw.detail}</p>
              </div>
            </div>
          ) : (
            <LoadingBlock label="Reading service worker…" />
          )}
        </Card>

        <Card title="Cache Storage" subtitle="caches.keys() for this origin" bodyClass="pt-1">
          {cacheSupported ? (
            cacheKeys.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {cacheKeys.map((k) => (
                  <li key={k} className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                    <Smartphone size={13} className="shrink-0 text-[#C9A45C]" />
                    <span className="truncate font-mono text-xs text-[#D8DCE2]">{k}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-white/10 bg-black/20 px-4 py-6 text-center text-xs font-semibold uppercase tracking-widest text-[#6B7280]">
                No cache storage entries — consistent with the self-unregistering SW
              </p>
            )
          ) : (
            <p className="text-xs text-[#6B7280]">Cache Storage API unavailable in this browser.</p>
          )}
        </Card>
      </div>

      {/* ------------------------------------------------- install readiness */}
      <Card
        title="Install Readiness"
        subtitle="Chrome/Edge installability checklist — checked against the live manifest"
        actions={
          <Badge tone={ready ? 'green' : 'amber'}>
            <Download size={11} /> {ready ? 'Install-ready' : `Not ready · ${failing} check${failing === 1 ? '' : 's'} failing`}
          </Badge>
        }
        bodyClass="pt-1"
      >
        <ul className="flex flex-col gap-1.5">
          {checklist.map((c) => (
            <li key={c.label} className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
              {c.ok
                ? <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-400" />
                : <XCircle size={15} className="mt-0.5 shrink-0 text-red-400" />}
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-[#D8DCE2]">{c.label}</span>
                <span className="block truncate text-[11px] text-[#6B7280]" title={c.detail}>{c.detail}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[10.5px] leading-relaxed text-[#6B7280]">
          Honest verdict: {!ready
            ? 'install prompts are degraded until the missing icon files exist (or the manifest paths are corrected). Everything else is already standalone-ready.'
            : 'this site passes the installability checks.'}
        </p>
      </Card>
    </div>
  );
};
