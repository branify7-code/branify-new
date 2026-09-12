import React, { useEffect } from 'react';
import { X, Download, Smartphone, Laptop, Share2, PlusSquare, CheckCircle2, Sparkles } from 'lucide-react';

interface PWAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNativeInstall?: () => void;
  isInstallable?: boolean;
}

export const PWAModal: React.FC<PWAModalProps> = ({
  isOpen,
  onClose,
  onNativeInstall,
  isInstallable,
}) => {
  /* Escape-to-close + body scroll lock while the modal is open */
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

  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1120]/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Install Branify App"
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white border border-[#E2E8F0] shadow-2xl p-6 sm:p-8 text-[#111827] space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#111827] transition-colors"
          aria-label="Close install modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E5C378] to-[#997A15] p-[1px] shadow-[0_8px_24px_-8px_rgba(201,164,92,0.5)]">
            <div className="w-full h-full bg-white rounded-[11px] flex items-center justify-center">
              <span className="font-display text-lg font-black text-[#111827]">B</span>
            </div>
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[10px] font-mono uppercase text-[#8F6B2D] tracking-wider mb-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Progressive Web App</span>
            </div>
            <h3 className="font-display text-lg font-bold text-[#111827]">Install Branify App</h3>
          </div>
        </div>

        <p className="text-xs text-[#475569] leading-relaxed">
          Install the Branify flagship app onto your device for ultra-fast launch speeds, full-screen view, and one-tap access to AI & developer tools.
        </p>

        {/* Quick Native Install Button if available */}
        {isInstallable && onNativeInstall && (
          <button
            onClick={() => {
              onNativeInstall();
              onClose();
            }}
            className="btn-metal w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Install Instantly (1-Click)</span>
          </button>
        )}

        {/* Platform Specific Steps */}
        <div className="space-y-4 pt-2 border-t border-[#E2E8F0]">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#8F6B2D] font-semibold">
            {isIOS ? 'iOS Safari Instructions' : 'Desktop / Android Instructions'}
          </div>

          {isIOS ? (
            <div className="space-y-3 text-xs text-[#334155]">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <Share2 className="w-4 h-4 text-[#8F6B2D] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[#111827]">1. Tap the Share button</span>
                  <p className="text-[11px] text-[#64748B]">Located in the bottom Safari navigation bar.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <PlusSquare className="w-4 h-4 text-[#8F6B2D] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[#111827]">2. Select &ldquo;Add to Home Screen&rdquo;</span>
                  <p className="text-[11px] text-[#64748B]">Scroll down in the action menu to find the icon.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <CheckCircle2 className="w-4 h-4 text-[#8F6B2D] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[#111827]">3. Confirm &ldquo;Add&rdquo;</span>
                  <p className="text-[11px] text-[#64748B]">The Branify emblem will appear on your home screen.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#334155]">
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                <div className="flex items-center gap-2 text-[#111827] font-semibold">
                  <Laptop className="w-4 h-4 text-[#8F6B2D]" />
                  <span>Desktop Chrome / Edge</span>
                </div>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  Click the install icon (<Download className="inline w-3 h-3 text-[#8F6B2D]" />) in your browser URL bar or press Menu &gt; Install Branify.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                <div className="flex items-center gap-2 text-[#111827] font-semibold">
                  <Smartphone className="w-4 h-4 text-[#8F6B2D]" />
                  <span>Android Chrome</span>
                </div>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  Tap the three dots menu (⋮) in Chrome and select &ldquo;Install app&rdquo; or &ldquo;Add to Home screen&rdquo;.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Benefits Row */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-2 text-[11px] text-[#94A3B8] border-t border-[#E2E8F0] font-mono">
          <span>✓ Offline-ready app shell</span>
          <span>✓ Fast cached assets</span>
          <span>✓ Pure Standalone Mode</span>
        </div>
      </div>
    </div>
  );
};
