import React, { useState } from 'react';
import {
  Sparkles, Download, ArrowUpRight, Building2, MapPin, Phone,
  MessageCircle, Mail, Send, Instagram, Linkedin, Facebook, Twitter, Github, Palette,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BrandKitModal } from '../components/BrandKitModal';
import { trackEvent } from '../lib/track';

interface FooterProps {
  onNavigate: (route: string) => void;
  onOpenPWA: () => void;
  isPWAInstalled?: boolean;
}

/* ------------------------------------------------------------------ */
/* Footer — 1:1 replica of branify.store's <footer> (DOM extracted    */
/* from production). Every control is wired to a real destination.    */
/* ------------------------------------------------------------------ */

const serviceLinks: Array<{ label: string; route: string }> = [
  { label: 'Website Development', route: '/services/website-development' },
  { label: 'WordPress Dev', route: '/services/wordpress-development' },
  { label: 'Landing Pages', route: '/services/landing-pages' },
  { label: 'UI/UX Design', route: '/services/ui-ux-design' },
  { label: 'Logo Design', route: '/services/logo-design' },
  { label: 'Brand Identity', route: '/services/brand-identity' },
  { label: 'SEO Ranking', route: '/services/seo' },
  { label: 'AI Solutions', route: '/services/ai-solutions' },
];

const resourceLinks: Array<{ label: string; route: string; gold?: boolean }> = [
  { label: 'Website Templates', route: '/templates', gold: true },
  { label: 'Free Templates', route: '/free-templates' },
  { label: 'Website Starters', route: '/free-templates/website' },
  { label: 'Business Docs', route: '/free-templates/business' },
  { label: 'Pitch Decks', route: '/free-templates/presentation' },
  { label: 'Pricing Guide', route: '/pricing', gold: true },
  { label: 'Custom Quote', route: '/contact' },
];

const toolsLinks: Array<{ label: string; route: string; gold?: boolean }> = [
  { label: 'AI Tools Directory', route: '/ai-tools', gold: true },
  { label: 'PDF Tools', route: '/tools?category=PDF+Tools' },
  { label: 'Image Converter', route: '/tools?category=Image+Tools' },
  { label: 'Text & Word Counter', route: `/tools?category=${encodeURIComponent('Text & Content Tools')}` },
  { label: 'JSON & Developer', route: '/tools?category=Developer+Tools' },
  { label: 'SEO Meta Builder', route: '/tools?category=SEO+Tools' },
  { label: 'Invoice Generator', route: '/tools?category=Business+Tools' },
];


const socials: Array<{ label: string; href: string; Icon: React.FC<{ className?: string }> }> = [
  { label: 'Instagram', href: 'https://www.instagram.com/branify001', Icon: Instagram },
  { label: 'LinkedIn', href: 'https://linkedin.com/company/branify', Icon: Linkedin },
  { label: 'Facebook', href: 'https://www.facebook.com/share/14mz5a1BDXB/', Icon: Facebook },
  { label: 'Twitter/X', href: 'https://x.com/branify_store', Icon: Twitter },
  { label: 'GitHub', href: 'https://github.com/branify', Icon: Github },
];

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenPWA, isPWAInstalled }) => {
  const [email, setEmail] = useState('');
  const [subState, setSubState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [subMessage, setSubMessage] = useState('');
  const [brandKitOpen, setBrandKitOpen] = useState(false);

  /* Real newsletter subscription → Supabase `newsletter_subscribers`
     (table exists in the production project; see supabase/schema.sql).
     Falls back to a graceful message if the network/write fails. */
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || subState === 'loading') return;
    setSubState('loading');
    setSubMessage('');
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert([{ email: value }]);
      if (error) {
        if (error.code === '23505') {
          setSubMessage("You're already subscribed to BRANIFY Insider!");
          setSubState('done');
        } else {
          setSubMessage(error.message || 'Subscription failed. Please try again.');
          setSubState('error');
        }
      } else {
        setSubMessage('Subscribed! Watch your inbox for strategy updates.');
        setSubState('done');
        trackEvent('newsletter_signup', {});
        setEmail('');
        setTimeout(() => {
          setSubState('idle');
          setSubMessage('');
        }, 4000);
      }
    } catch {
      setSubMessage('Network error — please try again in a moment.');
      setSubState('error');
    }
  };

  const nav = (route: string) => {
    onNavigate(route);
  };

  return (
    <footer className="bg-[#0B1120] text-slate-400 border-t border-[#C9A45C]/20 pt-16 pb-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[1.5px] bg-gradient-to-r from-transparent via-[#C9A45C]/60 to-transparent"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#C9A45C]/5 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
        {/* PWA Install Banner */}
        <div className="bg-white/[0.04] border border-[#C9A45C]/25 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#C9A45C]/10 border border-[#C9A45C]/30 text-[#E7C978] text-[10px] font-extrabold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-[#E7C978]" />
              Progressive Web App
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-[#F1F5F9] uppercase tracking-tight">
              {isPWAInstalled ? 'BRANIFY Is Installed On This Device' : 'Get BRANIFY on Your Mobile & Desktop Device'}
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm max-w-xl">
              Install the official BRANIFY app for instant offline access to 100+ free online tools, service quotes, and digital templates.
            </p>
          </div>
          <button
            onClick={onOpenPWA}
            className="shrink-0 px-7 py-3.5 btn-gold-primary text-[#090A0C] font-extrabold text-xs uppercase tracking-widest rounded-full shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#090A0C]" />
            <span className="text-[#090A0C] font-black">{isPWAInstalled ? 'App Info' : 'Install App'}</span>
          </button>
        </div>

        {/* Link Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand + Offices */}
          <div className="col-span-2 space-y-4">
            <button onClick={() => nav('/')} className="text-left focus:outline-none cursor-pointer">
              <div className="flex items-center gap-3 group">
                <img
                  src="/branify-logo-horizontal.svg"
                  alt="BRANIFY — Build. Brand. Grow."
                  className="h-12 w-auto transition-transform duration-300 group-hover:scale-[1.03] drop-shadow-[0_0_18px_rgba(91,95,239,0.35)]"
                />
              </div>
            </button>
            <p className="text-slate-500 text-xs leading-relaxed max-w-sm">
              International digital agency &amp; technology partner helping ambitious startups and enterprise brands look better, work smarter, and scale faster.
            </p>

            <div className="space-y-3.5 text-xs text-slate-400 pt-1">
              {/* Head Office (UK) */}
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-[#C9A45C]/20 space-y-1">
                <div className="flex items-center gap-1.5 text-[#E7C978] font-extrabold uppercase text-[10px] tracking-wider">
                  <Building2 className="w-3 h-3" />
                  <span>Head Office (UK)</span>
                </div>
                <div className="flex items-start gap-2 text-slate-400 text-[11px] leading-snug pl-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#E7C978] shrink-0 mt-0.5" />
                  <span>13 Church Way, Bradford, BD1 7ZE, United Kingdom</span>
                </div>
                <div className="flex items-center gap-2 pl-0.5 pt-0.5">
                  <Phone className="w-3 h-3 text-[#E7C978] shrink-0" />
                  <a href="tel:+447412831132" className="text-slate-400 hover:text-[#E7C978] text-[11px] font-semibold transition-colors">
                    +44 7412 831132
                  </a>
                </div>
              </div>

              {/* Pakistan Office */}
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-[#C9A45C]/30 transition-colors space-y-1">
                <div className="flex items-center gap-1.5 text-[#E7C978] font-extrabold uppercase text-[10px] tracking-wider">
                  <Building2 className="w-3 h-3" />
                  <span>Pakistan Office</span>
                </div>
                <div className="flex items-start gap-2 text-slate-400 text-[11px] leading-snug pl-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#E7C978] shrink-0 mt-0.5" />
                  <span>House 6, Street 2, Nearby PMA, Pakistan</span>
                </div>
                <div className="flex items-center gap-2 pl-0.5 pt-0.5">
                  <Phone className="w-3 h-3 text-[#E7C978] shrink-0" />
                  <a href="tel:+923321029333" className="text-slate-400 hover:text-[#E7C978] text-[11px] font-semibold transition-colors">
                    +92 332 1029333
                  </a>
                </div>
              </div>

              {/* Bangladesh Branch — Opening Soon */}
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-[#C9A45C]/30 transition-colors space-y-1">
                <div className="flex items-center gap-1.5 text-[#E7C978] font-extrabold uppercase text-[10px] tracking-wider">
                  <Building2 className="w-3 h-3" />
                  <span>Bangladesh Branch</span>
                </div>
                <div className="flex items-start gap-2 text-slate-400 text-[11px] leading-snug pl-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#E7C978] shrink-0 mt-0.5" />
                  <span>Opening Soon — New Location Announcing Shortly</span>
                </div>
              </div>

              {/* WhatsApp + Email */}
              <div className="space-y-2 pl-0.5 pt-1">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <a
                    href="https://wa.me/923321029333"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-emerald-400 text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <span>WhatsApp: +92 332 1029333</span>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#E7C978] shrink-0" />
                  <a href="mailto:admin@branify.store" className="text-slate-400 hover:text-[#E7C978] text-xs transition-colors">
                    admin@branify.store
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-[#F1F5F9] uppercase tracking-wider">Services</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              {serviceLinks.map((item) => (
                <li key={item.label}>
                  <button onClick={() => nav(item.route)} className="hover:text-[#E7C978] transition-colors text-left">
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Free Resources */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-[#F1F5F9] uppercase tracking-wider">Free Resources</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              {resourceLinks.map((item) =>
                item.gold ? (
                  <li key={item.label}>
                    <button onClick={() => nav(item.route)} className="hover:text-[#F1F5F9] transition-colors text-[#E7C978] font-bold flex items-center gap-1 text-left">
                      {item.label} <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </li>
                ) : (
                  <li key={item.label}>
                    <button onClick={() => nav(item.route)} className="hover:text-[#E7C978] transition-colors text-left">
                      {item.label}
                    </button>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* 100+ Free Tools */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-[#F1F5F9] uppercase tracking-wider">100+ Free Tools</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              {toolsLinks.map((item) =>
                item.gold ? (
                  <li key={item.label}>
                    <button onClick={() => nav(item.route)} className="hover:text-[#F1F5F9] transition-colors text-[#E7C978] font-bold flex items-center gap-1 text-left">
                      {item.label} <Sparkles className="w-3 h-3 text-[#E7C978]" />
                    </button>
                  </li>
                ) : (
                  <li key={item.label}>
                    <button onClick={() => nav(item.route)} className="hover:text-[#E7C978] transition-colors text-left">
                      {item.label}
                    </button>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Company & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-[#F1F5F9] uppercase tracking-wider">Company &amp; Legal</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li>
                <button onClick={() => nav('/about')} className="hover:text-[#E7C978] transition-colors text-left">About Us</button>
              </li>
              <li>
                <button onClick={() => nav('/portfolio')} className="hover:text-[#E7C978] transition-colors text-left">Case Studies</button>
              </li>
              <li>
                <button onClick={() => nav('/blog')} className="hover:text-[#E7C978] transition-colors text-left">Insights Blog</button>
              </li>
              <li>
                <button onClick={() => nav('/pricing')} className="hover:text-[#E7C978] transition-colors text-left">Transparent Pricing</button>
              </li>
              <li>
                <button
                  onClick={() => setBrandKitOpen(true)}
                  className="hover:text-[#F1F5F9] text-[#E7C978] font-extrabold transition-colors flex items-center gap-1 cursor-pointer text-left"
                >
                  <Palette className="w-3 h-3" />
                  <span>Logo &amp; Brand Kit</span>
                </button>
              </li>
              <li>
                <button onClick={() => nav('/privacypolicy')} className="hover:text-[#E7C978] transition-colors text-left">Privacy Policy</button>
              </li>
              <li>
                <button onClick={() => nav('/termsandconditions')} className="hover:text-[#E7C978] transition-colors text-left">Terms of Service</button>
              </li>
              <li>
                <button onClick={() => nav('/refundpolicy')} className="hover:text-[#E7C978] transition-colors text-left">Refund Policy</button>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter + Socials */}
        <div className="pt-8 border-t border-[#C9A45C]/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <form onSubmit={handleSubscribe} className="w-full md:w-auto flex items-center gap-2 max-w-md">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter work email for strategy updates..."
              className="px-4 py-2.5 bg-white/[0.04] border border-[#C9A45C]/25 rounded-full text-xs text-[#F1F5F9] placeholder-zinc-500 focus:outline-none focus:border-[#C9A45C] flex-1"
              aria-label="Email for newsletter"
              required
            />
            <button
              type="submit"
              disabled={subState === 'loading'}
              className="px-6 py-2.5 btn-gold-primary text-[#090A0C] text-xs font-black uppercase tracking-wider rounded-full transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-60"
            >
              <span className="text-[#090A0C] font-black">{subState === 'loading' ? '...' : subState === 'done' ? 'Done' : 'Subscribe'}</span>
              <Send className="w-3.5 h-3.5 text-[#090A0C]" />
            </button>
          </form>
          {subMessage && (
            <p className={`text-[11px] ${subState === 'error' ? 'text-red-400' : 'text-emerald-400'}`} role="status">
              {subMessage}
            </p>
          )}
          <div className="flex items-center gap-3">
            {socials.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-white/[0.04] hover:bg-[#C9A45C]/20 text-slate-500 hover:text-[#E7C978] rounded-full border border-white/[0.08] hover:border-[#C9A45C]/40 transition-colors"
                title={label}
                aria-label={label}
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="text-center text-xs text-slate-500 pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>© {new Date().getFullYear()} BRANIFY (branify.store). All rights reserved.</div>
          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={() => nav('/privacypolicy')} className="hover:underline cursor-pointer">Privacy</button>
            <button onClick={() => nav('/termsandconditions')} className="hover:underline cursor-pointer">Terms</button>
            <button onClick={() => nav('/disclaimer')} className="hover:underline cursor-pointer">Disclaimer</button>
            <button onClick={() => nav('/admin')} className="text-slate-500 hover:text-slate-500 transition-colors cursor-pointer">Admin</button>
          </div>
        </div>
      </div>

      <BrandKitModal isOpen={brandKitOpen} onClose={() => setBrandKitOpen(false)} />
    </footer>
  );
};
