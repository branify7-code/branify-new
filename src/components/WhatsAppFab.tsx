import React, { useState } from 'react';
import { trackEvent } from '../lib/track';

/* ------------------------------------------------------------------ */
/* WhatsAppFab — replica of branify.store's floating WhatsApp button: */
/* green pulse FAB bottom-right, hover name tooltip, and a "Pick a    */
/* WhatsApp line" popup with both regional numbers + prefilled msg.   */
/* ------------------------------------------------------------------ */

const DISPLAY_NAME = 'BRANIFY Executive Team';
const DEFAULT_MESSAGE =
  'Hi BRANIFY, I am visiting your website and would like to discuss a project / custom quote.';

const WHATSAPP_LINES: Array<{ number: string; label: string; flag: string }> = [
  { number: '+880 1879-176373', label: 'WhatsApp — Bangladesh', flag: '🇧🇩' },
  { number: '+92 332 1029333', label: 'WhatsApp — Pakistan', flag: '🇵🇰' },
];

function waLink(number: string, message: string): string {
  const digits = number.replace(/[^0-9]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

export const WhatsAppFab: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-64 overflow-hidden rounded-2xl border border-[#25D366]/30 bg-[#12131A] shadow-2xl">
          <div className="border-b border-white/10 bg-black/30 px-4 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#25D366]">Chat with us</p>
            <p className="text-[10px] text-zinc-500">Pick a WhatsApp line</p>
          </div>
          <ul className="divide-y divide-white/5">
            {WHATSAPP_LINES.map((line) => (
              <li key={line.number}>
                <a
                  href={waLink(line.number, DEFAULT_MESSAGE)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => { trackEvent('whatsapp_click', { line: line.number }); setOpen(false); }}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5"
                >
                  <span className="text-lg leading-none">{line.flag}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[#F1F2EE]">{line.label}</span>
                    <span className="block truncate font-mono text-[11px] text-zinc-400">{line.number}</span>
                  </span>
                  <WhatsAppGlyph className="h-4 w-4 shrink-0 fill-[#25D366]" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-3">
        {hovered && !open && (
          <div className="hidden sm:flex items-center bg-[#12131A] text-zinc-100 px-3.5 py-2 rounded-xl shadow-2xl border border-[#25D366]/30 text-xs font-semibold animate-fade-in whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse mr-2"></span>
            {DISPLAY_NAME}
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          aria-label="Chat on WhatsApp"
          aria-expanded={open}
          title={DISPLAY_NAME}
          className="relative group flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#20ba5a] text-[#F1F2EE] rounded-full shadow-[0_8px_30px_rgb(37,211,102,0.35)] hover:shadow-[0_12px_40px_rgb(37,211,102,0.5)] transition-all duration-300 transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40 cursor-pointer"
        >
          <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-75 animate-ping pointer-events-none group-hover:animate-none"></span>
          {open ? (
            <svg
              className="w-6 h-6 relative z-10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12"></path>
            </svg>
          ) : (
            <WhatsAppGlyph className="w-7 h-7 fill-current relative z-10" />
          )}
        </button>
      </div>
    </div>
  );
};
