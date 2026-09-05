import React, { useEffect } from 'react';
import { X, Download, ExternalLink, ShieldCheck } from 'lucide-react';

interface BrandKitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/* BrandKitModal — replica of branify.store's "Logo & Brand Kit"      */
/* modal: official logo & icon downloads served from                  */
/* /downloads/ (files ship with the site, no external requests).      */
/* ------------------------------------------------------------------ */

interface BrandAsset {
  title: string;
  file: string;
  note: string;
}

const brandAssets: BrandAsset[] = [
  {
    title: 'BRANIFY PRIMARY LOGO (TRANSPARENT)',
    file: '/downloads/branify-logo.png',
    note: 'Full-color horizontal lockup on transparent canvas — for light & dark backgrounds.',
  },
  {
    title: 'BRANIFY PRIMARY LOGO (DARK CANVAS)',
    file: '/downloads/branify-logo-dark.png',
    note: 'Horizontal lockup pre-composed on the brand dark canvas.',
  },
  {
    title: 'BRANIFY MONOGRAM ICON MARK (TRANSPARENT)',
    file: '/downloads/branify-icon.png',
    note: 'Square app-icon / favicon monogram on transparent canvas.',
  },
  {
    title: 'BRANIFY MONOGRAM ICON MARK (DARK THEME)',
    file: '/downloads/branify-icon-dark.png',
    note: 'Monogram mark pre-composed on the brand dark canvas.',
  },
  {
    title: 'BRANIFY VERTICAL EMBLEM LOCKUP',
    file: '/downloads/branify-logo-vertical.png',
    note: 'Stacked emblem + wordmark for packaging, merch & avatars.',
  },
];

export const BrandKitModal: React.FC<BrandKitModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="BRANIFY logo and brand kit downloads"
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#090D14] border border-[#C9A45C]/30 rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#090D14]/95 backdrop-blur border-b border-white/[0.06] px-6 sm:px-8 pt-6 pb-5 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A45C]/10 border border-[#C9A45C]/30 text-[#E2C27B] text-[10px] font-extrabold uppercase tracking-widest">
            <ShieldCheck className="w-3 h-3" />
            Official Brand Assets
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-black text-[#F1F2EE] uppercase tracking-tight">
                BRANIFY Logo &amp; Icon Downloads
              </h2>
              <p className="text-xs text-zinc-400 max-w-lg">
                Download the official BRANIFY logo package for press, partnerships and client proposals. Assets are provided as-is — please do not alter the mark's proportions or colors.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/[0.04] border border-white/10 text-zinc-400 hover:text-[#F1F2EE] hover:border-[#C9A45C]/40 transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Assets */}
        <div className="px-6 sm:px-8 py-6 space-y-4">
          {brandAssets.map((asset) => (
            <div
              key={asset.file}
              className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-[#C9A45C]/30 transition-colors"
            >
              <div className="w-20 h-20 shrink-0 rounded-xl bg-[#05080C] border border-white/10 flex items-center justify-center p-2.5">
                <img src={asset.file} alt={asset.title} className="max-w-full max-h-full object-contain" loading="lazy" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="text-xs font-black text-[#F1F2EE] uppercase tracking-wider">{asset.title}</h3>
                <p className="text-[11px] text-zinc-500 leading-snug">{asset.note}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={asset.file}
                  download
                  className="px-4 py-2 btn-gold-primary text-[#090A0C] text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1.5"
                >
                  <Download className="w-3 h-3 text-[#090A0C]" />
                  <span className="text-[#090A0C] font-black">Download PNG</span>
                </a>
                <a
                  href={asset.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-full bg-white/[0.04] border border-white/10 text-zinc-400 hover:text-[#E2C27B] hover:border-[#C9A45C]/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="hidden sm:inline">Open in new tab</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 pb-6 pt-2 border-t border-white/[0.06] flex items-center justify-between gap-4">
          <p className="text-[10px] text-zinc-600">
            © {new Date().getFullYear()} BRANIFY. All marks reserved.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-black uppercase tracking-wider text-zinc-300 hover:text-[#F1F2EE] hover:border-[#C9A45C]/40 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
