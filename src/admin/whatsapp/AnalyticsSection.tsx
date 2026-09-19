// =============================================================================
// BRANIFY WHATSAPP CRM — Analytics (REAL data only — honest zeros, no fakes)
// Date filters: Today · 7 days · 28 days · 3 months · Custom
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Btn, Input, LoadingBlock, useToast, cx } from '../ui';
import * as wa from './waClient';
import type { WaAnalytics } from './waTypes';
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from './waTypes';

const PRESETS = [
  { id: 'today', label: 'Today' }, { id: '7d', label: '7 days' }, { id: '28d', label: '28 days' },
  { id: '3m', label: '3 months' }, { id: 'custom', label: 'Custom' },
];

export const AnalyticsSection: React.FC = () => {
  const { push } = useToast();
  const [preset, setPreset] = useState('7d');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [data, setData] = useState<WaAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await wa.analyticsServer({ preset, start: start || undefined, end: end || undefined });
      setData(res.analytics);
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Could not load analytics.');
    } finally {
      setLoading(false);
    }
  }, [preset, start, end, push]);

  useEffect(() => { if (preset !== 'custom') void load(); }, [preset, load]);
  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const metric = (label: string, value: string | number, sub?: string) => (
    <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
      <p className="text-[9.5px] font-black uppercase tracking-[0.16em] text-[#7E8DA6]">{label}</p>
      <p className="mt-1 font-display text-xl font-extrabold tabular-nums text-[#111827]">{value}</p>
      {sub && <p className="text-[10px] text-[#94A3B8]">{sub}</p>}
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map((p) => (
          <button key={p.id} onClick={() => setPreset(p.id)}
            className={cx('rounded-full px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-wide transition-colors',
              preset === p.id ? 'bg-[#C9A45C]/20 text-[#8F6B2D]' : 'bg-white/[0.05] text-[#5B6B82] hover:text-[#111827]')}>
            {p.label}
          </button>
        ))}
        {preset === 'custom' && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="h-8 w-[150px] text-xs" aria-label="Start date" />
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="h-8 w-[150px] text-xs" aria-label="End date" />
            <Btn variant="gold" size="sm" onClick={() => void load()}>Apply</Btn>
          </div>
        )}
        <Btn variant="ghost" size="sm" onClick={() => void load()} aria-label="Refresh"><RefreshCw size={13} className={loading ? 'animate-spin' : ''} /></Btn>
      </div>

      {loading && !data && <LoadingBlock label="Crunching real numbers…" />}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {metric('Conversations', data.conversations)}
            {metric('New contacts', data.new_contacts)}
            {metric('Messages received', data.messages_received)}
            {metric('Messages sent', data.messages_sent)}
            {metric('Unread now', data.unread_now)}
            {metric('Avg response time', data.response_time || '—', 'first reply per conversation')}
            {metric('Qualified leads', data.qualified_leads)}
            {metric('Won leads', data.won_leads)}
            {metric('Failed messages', data.failed_messages)}
            {metric('Templates used', data.templates_used)}
          </div>

          {Object.keys(data.template_breakdown || {}).length > 0 && (
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
              <p className="text-[9.5px] font-black uppercase tracking-[0.16em] text-[#7E8DA6]">Template usage</p>
              <ul className="mt-1.5 grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(data.template_breakdown).map(([name, count]) => (
                  <li key={name} className="flex items-center justify-between rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-[11px]">
                    <span className="truncate font-semibold text-[#334155]">{name}</span>
                    <span className="font-bold tabular-nums text-[#8F6B2D]">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
            <p className="text-[9.5px] font-black uppercase tracking-[0.16em] text-[#7E8DA6]">Pipeline totals (all time)</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {LEAD_STATUSES.map((s) => (
                <span key={s} className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[10.5px] font-semibold text-[#334155]">
                  {LEAD_STATUS_LABELS[s]}: <b className="text-[#8F6B2D]">{data.lead_status_totals?.[s] || 0}</b>
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
            <p className="text-[9.5px] font-black uppercase tracking-[0.16em] text-[#7E8DA6]">Team (real assignments only)</p>
            {data.team.length === 0 ? (
              <p className="mt-1.5 text-[11px] text-[#7E8DA6]">No assigned conversations in this period yet.</p>
            ) : (
              <div className="mt-1.5 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-white/[0.07] text-[9.5px] font-black uppercase tracking-[0.14em] text-[#7E8DA6]">
                      <th className="px-2 py-1.5">Agent</th><th className="px-2 py-1.5">Conversations</th>
                      <th className="px-2 py-1.5">Resolved</th><th className="px-2 py-1.5">Qualified leads</th><th className="px-2 py-1.5">Response time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.team.map((t) => (
                      <tr key={t.agent} className="border-b border-white/[0.04] text-[#334155]">
                        <td className="px-2 py-1.5 font-bold">{t.agent.split('@')[0]}</td>
                        <td className="px-2 py-1.5 tabular-nums">{t.conversations}</td>
                        <td className="px-2 py-1.5 tabular-nums">{t.resolved}</td>
                        <td className="px-2 py-1.5 tabular-nums">{t.qualified_leads}</td>
                        <td className="px-2 py-1.5 tabular-nums">{t.response_time || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
