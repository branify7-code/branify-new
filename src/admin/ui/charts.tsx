// =============================================================================
// BRANIFY ADMIN — hand-rolled SVG charts (gold theme, zero dependencies)
// =============================================================================
import React, { useId } from 'react';

const GOLD = '#C9A45C';
const GOLD_BRIGHT = '#E9CF79';

// ------------------------------------------------------------------ Sparkline
export const Sparkline: React.FC<{ data: number[]; width?: number; height?: number; stroke?: string; fill?: boolean; className?: string }> = ({
  data, width = 120, height = 34, stroke = GOLD, fill = true, className,
}) => {
  const id = useId().replace(/:/g, '');
  if (!data.length) data = [0, 0];
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = max - min || 1;
  const step = data.length > 1 ? width / (data.length - 1) : width;
  const pts = data.map((v, i) => `${(i * step).toFixed(1)},${(height - 3 - ((v - min) / span) * (height - 6)).toFixed(1)}`);
  const line = `M${pts.join(' L')}`;
  const area = `${line} L${width},${height} L0,${height} Z`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`sg${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#sg${id})`} />}
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

// ------------------------------------------------------------------ Line/area chart with axes
export interface ChartPoint { label: string; value: number }
export const LineArea: React.FC<{
  data: ChartPoint[];
  height?: number;
  stroke?: string;
  formatValue?: (v: number) => string;
  emptyLabel?: string;
}> = ({ data, height = 220, stroke = GOLD_BRIGHT, formatValue = (v) => String(v), emptyLabel = 'No data yet' }) => {
  const id = useId().replace(/:/g, '');
  const W = 640;
  const H = height;
  const padL = 42;
  const padB = 26;
  const padT = 12;
  if (!data.some((d) => d.value > 0)) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/20 text-xs font-semibold uppercase tracking-widest text-[#6B7280]" style={{ height }}>
        {emptyLabel}
      </div>
    );
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  const niceMax = max <= 5 ? 5 : Math.ceil(max / 5) * 5;
  const iw = W - padL - 12;
  const ih = H - padT - padB;
  const x = (i: number) => padL + (data.length > 1 ? (i / (data.length - 1)) * iw : iw / 2);
  const y = (v: number) => padT + ih - (v / niceMax) * ih;
  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ');
  const area = `${line} L${x(data.length - 1).toFixed(1)},${padT + ih} L${padL},${padT + ih} Z`;
  const gridVals = [0, niceMax / 2, niceMax];
  const labelEvery = Math.max(1, Math.ceil(data.length / 8));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="Trend chart">
      <defs>
        <linearGradient id={`la${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.32" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridVals.map((gv) => (
        <g key={gv}>
          <line x1={padL} x2={W - 12} y1={y(gv)} y2={y(gv)} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 4" />
          <text x={padL - 8} y={y(gv) + 3.5} textAnchor="end" fontSize="10" fill="#6B7280">{formatValue(gv)}</text>
        </g>
      ))}
      <path d={area} fill={`url(#la${id})`} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={i}>
          {(i % labelEvery === 0 || i === data.length - 1) && (
            <circle cx={x(i)} cy={y(d.value)} r="3" fill={stroke} stroke="#020407" strokeWidth="1.5" />
          )}
          {(i % labelEvery === 0 || i === data.length - 1) && (
            <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="9.5" fill="#6B7280">
              {d.label.length > 10 ? d.label.slice(5) : d.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
};

// ------------------------------------------------------------------ Donut
export interface DonutSegment { label: string; value: number; color: string }
export const Donut: React.FC<{
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerValue?: React.ReactNode;
  centerLabel?: string;
  emptyLabel?: string;
}> = ({ segments, size = 168, thickness = 22, centerValue, centerLabel, emptyLabel = 'No data' }) => {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label="Distribution donut chart">
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={thickness} />
        {total > 0 &&
          segments.map((s) => {
            const frac = s.value / total;
            const dash = frac * circ;
            const el = (
              <circle
                key={s.label}
                cx={c} cy={c} r={r} fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${c} ${c})`}
                strokeLinecap="butt"
              />
            );
            offset += dash;
            return el;
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {total > 0 ? (
          <>
            <span className="font-display text-2xl font-extrabold text-[#F5F6F2]">{centerValue ?? total}</span>
            {centerLabel && <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">{centerLabel}</span>}
          </>
        ) : (
          <span className="px-4 text-center text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">{emptyLabel}</span>
        )}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ Health ring
export const HealthRing: React.FC<{ value: number; max?: number; size?: number; label?: string; sub?: string }> = ({
  value, max = 100, size = 132, label, sub,
}) => {
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));
  const r = (size - 14) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const color = pct >= 0.9 ? '#34D399' : pct >= 0.7 ? '#C9A45C' : pct >= 0.4 ? '#F59E0B' : '#EF4444';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={`Health score ${Math.round(pct * 100)} percent`}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${pct * circ} ${circ}`}
          transform={`rotate(-90 ${c} ${c})`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-extrabold" style={{ color }}>{Math.round(value)}</span>
        {label && <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{label}</span>}
        {sub && <span className="mt-0.5 text-[9px] text-[#6B7280]">{sub}</span>}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ Horizontal bars
export const HBars: React.FC<{
  items: Array<{ label: string; value: number; color?: string }>;
  formatValue?: (v: number) => string;
  emptyLabel?: string;
}> = ({ items, formatValue = (v) => String(v), emptyLabel = 'No events recorded yet' }) => {
  if (!items.length) {
    return <div className="rounded-xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-xs font-semibold uppercase tracking-widest text-[#6B7280]">{emptyLabel}</div>;
  }
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-3">
          <span className="w-36 shrink-0 truncate text-xs text-[#A7AFBA]" title={it.label}>{it.label}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.max(3, (it.value / max) * 100)}%`, background: it.color || `linear-gradient(90deg, #8f6b2d, ${GOLD_BRIGHT})` }}
            />
          </div>
          <span className="w-10 shrink-0 text-right text-xs font-bold tabular-nums text-[#E8C97C]">{formatValue(it.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ------------------------------------------------------------------ Mini stat tile
export const StatTile: React.FC<{ label: string; value: React.ReactNode; sub?: React.ReactNode; icon?: React.ReactNode; className?: string }> = ({ label, value, sub, icon, className }) => (
  <div className={`rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 ${className || ''}`}>
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#A7AFBA]">{label}</span>
      {icon}
    </div>
    <div className="mt-1 font-display text-xl font-extrabold text-[#F5F6F2]">{value}</div>
    {sub && <div className="mt-0.5">{sub}</div>}
  </div>
);
