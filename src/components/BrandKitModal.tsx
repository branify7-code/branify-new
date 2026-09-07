import React, { useEffect } from 'react';
import { X, Download, ExternalLink, ShieldCheck } from 'lucide-react';

interface BrandKitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/* BrandKitModal — "Logo & Brand Kit" modal: THE official BRANIFY     */
/* logo & monogram icon (transparent PNG) served from /downloads/.    */
/* Single official artwork — no variants, no recreations.             */
/* ------------------------------------------------------------------ */

interface BrandAsset {
  title: string;
  file: string;
  note: string;
}

const brandAssets: BrandAsset[] = [
  {
    title: 'BRANIFY OFFICIAL LOGO (TRANSPARENT PNG)',
    file: '/downloads/branify-logo.png',
    note: 'The official BRANIFY logo — metallic gold monogram & wordmark lockup on transparent canvas. Use as-is.',
  },
  {
    title: 'BRANIFY OFFICIAL MONOGRAM ICON (TRANSPARENT PNG)',
    file: '/downloads/branify-icon.png',
    note: 'The official B monogram mark — app icon / favicon usage on transparent canvas.',
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
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#0B1120]/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="BRANIFY logo and brand kit downloads"
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-[#E2E8F0] px-6 sm:px-8 pt-6 pb-5 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A45C]/10 border border-[#C9A45C]/30 text-[#8F6B2D] text-[10px] font-extrabold uppercase tracking-widest">
            <ShieldCheck className="w-3 h-3" />
            Official Brand Assets
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
                BRANIFY Logo &amp; Icon Downloads
              </h2>
              <p className="text-xs text-[#64748B] max-w-lg">
                Download the official BRANIFY logo package for press, partnerships and client proposals. Assets are provided as-is — please do not alter the mark's proportions or colors.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#111827] hover:border-[#CBD5E1] transition-colors shrink-0"
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
              className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#C9A45C]/40 transition-colors"
            >
              <div className="w-20 h-20 shrink-0 rounded-xl bg-[#0B1120] border border-[#E2E8F0] flex items-center justify-center p-2.5">
                <img src={asset.file} alt={asset.title} className="max-w-full max-h-full object-contain" loading="lazy" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="text-xs font-extrabold text-[#111827] tracking-wider">{asset.title}</h3>
                <p className="text-[11px] text-[#64748B] leading-snug">{asset.note}</p>
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
                  className="px-3.5 py-2 rounded-full bg-white border border-[#E2E8F0] text-[#475569] hover:text-[#5B5FEF] hover:border-[#5B5FEF]/50 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="hidden sm:inline">Open in new tab</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 pb-6 pt-2 border-t border-[#E2E8F0] flex items-center justify-between gap-4">
          <p className="text-[10px] text-[#64748B]">
            © {new Date().getFullYear()} BRANIFY. All marks reserved.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-extrabold uppercase tracking-wider text-[#475569] hover:text-[#111827] hover:border-[#CBD5E1] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
