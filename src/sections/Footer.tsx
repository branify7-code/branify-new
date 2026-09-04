import React, { useState } from 'react';
import { 
  Twitter, Linkedin, Github, Instagram, ArrowUp, 
  Sparkles, Check, Download, ArrowRight, ShieldCheck, Heart 
} from 'lucide-react';
import { footerColumns } from '../data/navigation';

interface FooterProps {
  onNavigate: (route: string) => void;
  onOpenPWA: () => void;
  isPWAInstalled?: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenPWA,
  isPWAInstalled,
}) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setTimeout(() => {
      setSubscribed(false);
      setEmail('');
    }, 3000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-[#050608] text-white pt-20 pb-12 border-t border-white/[0.08] overflow-hidden">
      {/* Top Subtle Gold Accent Line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        {/* Top Grid: Brand & Columns & Newsletter */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-12 border-b border-white/[0.06]">
          {/* Brand Info */}
          <div className="lg:col-span-4 space-y-6">
            <button
              onClick={() => onNavigate('/')}
              className="flex items-center gap-2.5 text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E5C378] to-[#997A15] p-[1px] shadow-[0_0_20px_rgba(212,175,55,0.25)]">
                <div className="w-full h-full bg-[#08090B] rounded-[7px] flex items-center justify-center">
                  <span className="font-display text-sm font-black text-[#FFF5DC]">B</span>
                </div>
              </div>
              <span className="font-display text-xl font-extrabold tracking-[0.18em] text-[#FFF5DC]">
                BRANIFY
              </span>
            </button>

            <p className="text-sm text-white/60 font-light leading-relaxed max-w-sm">
              Luxury digital studio & next-generation software laboratory. Crafting category-defining web applications, autonomous AI workflows, and high-conversion e-commerce flagships.
            </p>

            {/* PWA Install Button in Footer */}
            <div className="pt-1">
              <button
                id="footer-pwa-install-btn"
                onClick={onOpenPWA}
                className="px-4 py-2.5 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 hover:bg-[#D4AF37] hover:text-[#08090B] text-[#FFF5DC] text-xs font-mono flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.15)]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isPWAInstalled ? 'Branify PWA Installed' : 'Install Branify Web App (PWA)'}</span>
              </button>
            </div>

            {/* Newsletter Input */}
            <form onSubmit={handleSubscribe} className="space-y-2 pt-2">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-white/40">
                Subscribe to Digital Dispatch
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  placeholder="executive@brand.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white focus:border-[#D4AF37] focus:outline-none flex-1"
                />
                <button
                  id="newsletter-submit-btn"
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#08090B] font-bold text-xs uppercase tracking-wider transition-colors shrink-0 cursor-pointer"
                >
                  {subscribed ? <Check className="w-3.5 h-3.5" /> : <span>Join</span>}
                </button>
              </div>
            </form>
          </div>

          {/* Navigation Columns */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {/* Services */}
            <div>
              <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-semibold mb-4">
                Services
              </h4>
              <ul className="space-y-2.5 text-xs text-white/60">
                {footerColumns.services.map((item) => (
                  <li key={item.label}>
                    <button
                      onClick={() => onNavigate(item.route)}
                      className="text-left hover:text-white hover:underline transition-colors cursor-pointer"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-semibold mb-4">
                Company
              </h4>
              <ul className="space-y-2.5 text-xs text-white/60">
                {footerColumns.company.map((item) => (
                  <li key={item.label}>
                    <button
                      onClick={() => onNavigate(item.route)}
                      className="text-left hover:text-white hover:underline transition-colors cursor-pointer"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-semibold mb-4">
                Resources
              </h4>
              <ul className="space-y-2.5 text-xs text-white/60">
                {footerColumns.resources.map((item) => (
                  <li key={item.label}>
                    <button
                      onClick={() => onNavigate(item.route)}
                      className="text-left hover:text-white hover:underline transition-colors cursor-pointer"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-semibold mb-4">
                Legal
              </h4>
              <ul className="space-y-2.5 text-xs text-white/60">
                {footerColumns.legal.map((item) => (
                  <li key={item.label}>
                    <button
                      onClick={() => onNavigate(item.route)}
                      className="text-left hover:text-white hover:underline transition-colors cursor-pointer"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Socials & Scroll to Top */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-white/40">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} BRANIFY. All rights reserved.</span>
            <span>•</span>
            <span className="text-[#D4AF37]">Engineered for Digital Sovereignty</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/10 hover:border-[#D4AF37] hover:text-[#D4AF37] flex items-center justify-center transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/10 hover:border-[#D4AF37] hover:text-[#D4AF37] flex items-center justify-center transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/10 hover:border-[#D4AF37] hover:text-[#D4AF37] flex items-center justify-center transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/10 hover:border-[#D4AF37] hover:text-[#D4AF37] flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
            </div>

            <button
              id="scroll-to-top-btn"
              onClick={scrollToTop}
              className="w-8 h-8 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#FFF5DC] hover:bg-[#D4AF37] hover:text-[#08090B] flex items-center justify-center transition-colors cursor-pointer"
              title="Back to Top"
              aria-label="Scroll to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
