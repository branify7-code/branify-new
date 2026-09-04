import React from 'react';
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
  if (!isOpen) return null;

  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0F1015] border border-[#D4AF37]/30 shadow-[0_0_50px_rgba(212,175,55,0.15)] p-6 sm:p-8 text-white space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          aria-label="Close install modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E5C378] to-[#997A15] p-[1px] shadow-[0_0_25px_rgba(212,175,55,0.3)]">
            <div className="w-full h-full bg-[#08090B] rounded-[11px] flex items-center justify-center">
              <span className="font-display text-lg font-black text-[#FFF5DC]">B</span>
            </div>
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[10px] font-mono uppercase text-[#D4AF37] tracking-wider mb-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Progressive Web App</span>
            </div>
            <h3 className="font-display text-lg font-bold text-[#FFF5DC]">Install Branify App</h3>
          </div>
        </div>

        <p className="text-xs text-white/70 leading-relaxed font-light">
          Install the Branify flagship app onto your device for instant offline access, ultra-fast launch speeds, full-screen view, and uninterrupted AI & developer tools.
        </p>

        {/* Quick Native Install Button if available */}
        {isInstallable && onNativeInstall && (
          <button
            onClick={() => {
              onNativeInstall();
              onClose();
            }}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C378] text-[#08090B] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:brightness-110 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Install Instantly (1-Click)</span>
          </button>
        )}

        {/* Platform Specific Steps */}
        <div className="space-y-4 pt-2 border-t border-white/10">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#D4AF37] font-semibold">
            {isIOS ? 'iOS Safari Instructions' : 'Desktop / Android Instructions'}
          </div>

          {isIOS ? (
            <div className="space-y-3 text-xs text-white/80">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <Share2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">1. Tap the Share button</span>
                  <p className="text-[11px] text-white/50">Located in the bottom Safari navigation bar.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <PlusSquare className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">2. Select &ldquo;Add to Home Screen&rdquo;</span>
                  <p className="text-[11px] text-white/50">Scroll down in the action menu to find the icon.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">3. Confirm &ldquo;Add&rdquo;</span>
                  <p className="text-[11px] text-white/50">The Branify emblem will appear on your home screen.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-white/80">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Laptop className="w-4 h-4 text-[#D4AF37]" />
                  <span>Desktop Chrome / Edge</span>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Click the install icon (<Download className="inline w-3 h-3 text-[#D4AF37]" />) in your browser URL bar or press Menu &gt; Install Branify.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Smartphone className="w-4 h-4 text-[#D4AF37]" />
                  <span>Android Chrome</span>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Tap the three dots menu (⋮) in Chrome and select &ldquo;Install app&rdquo; or &ldquo;Add to Home screen&rdquo;.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Benefits Row */}
        <div className="flex items-center justify-between pt-2 text-[11px] text-white/40 border-t border-white/5 font-mono">
          <span>✓ Instant Offline Caching</span>
          <span>✓ 0 MB Storage Overhead</span>
          <span>✓ Pure Standalone Mode</span>
        </div>
      </div>
    </div>
  );
};
