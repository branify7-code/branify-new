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

function BranifyFooterLogo() {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-11 h-11 transition-all duration-500"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="branify-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF9EB">
            <animate attributeName="stop-color" values="#FFF9EB;#DFBA73;#FFF9EB" dur="4s" repeatCount="indefinite" />
          </stop>
          <stop offset="35%" stopColor="#E2C27B"></stop>
          <stop offset="70%" stopColor="#C9A45C"></stop>
          <stop offset="100%" stopColor="#8A6827"></stop>
        </linearGradient>
        <linearGradient id="branify-silver-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5F5F2"></stop>
          <stop offset="50%" stopColor="#C9A45C"></stop>
          <stop offset="100%" stopColor="#8A6827"></stop>
        </linearGradient>
        <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur"></feGaussianBlur>
          <feComposite in="SourceGraphic" in2="blur" operator="over"></feComposite>
        </filter>
      </defs>
      <circle
        cx="60"
        cy="60"
        r="48"
        fill="none"
        stroke="url(#branify-gold-grad)"
        strokeWidth="1"
        strokeDasharray="6 6"
        opacity="0.25"
        className="origin-center animate-[spin_20s_linear_infinite]"
      ></circle>
      <path d="M 18 36 L 42 14 H 80 C 98 14 110 25 110 41 C 110 54 99 63 83 67 L 40 40 L 18 36 Z" fill="url(#branify-gold-grad)" filter="url(#gold-glow)"></path>
      <path d="M 48 26 H 75 C 83 26 89 30 89 37 C 89 44 83 48 73 48 L 41 28 L 48 26 Z" fill="#07090D"></path>
      <path d="M 38 41 L 83 67 L 76 72 L 30 46 Z" fill="#07090D"></path>
      <path d="M 14 78 L 52 53 H 84 C 102 53 114 64 114 80 C 114 98 98 106 74 106 H 32 C 22 106 18 98 28 98 L 72 98 C 86 98 94 91 94 80 C 94 69 86 63 70 63 L 40 81 L 14 78 Z" fill="url(#branify-silver-grad)"></path>
    </svg>
  );
}

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
    <footer className="bg-[#05080C] text-zinc-300 border-t border-[#C9A45C]/20 pt-16 pb-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[1.5px] bg-gradient-to-r from-transparent via-[#C9A45C]/60 to-transparent"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#C9A45C]/5 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
        {/* PWA Install Banner */}
        <div className="bg-[#090D14]/90 border border-[#C9A45C]/25 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#C9A45C]/10 border border-[#C9A45C]/30 text-[#E2C27B] text-[10px] font-extrabold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-[#E2C27B]" />
              Progressive Web App
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-[#F1F2EE] uppercase tracking-tight">
              {isPWAInstalled ? 'BRANIFY Is Installed On This Device' : 'Get BRANIFY on Your Mobile & Desktop Device'}
            </h3>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-xl">
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
                <div className="relative shrink-0 transition-transform duration-300 group-hover:scale-105">
                  <BranifyFooterLogo />
                </div>
                <div className="flex flex-col justify-center">
                  <div className="font-black uppercase flex items-center leading-none font-sans text-3xl tracking-wider">
                    <span className="text-[#F1F2EE]">BRAN</span>
                    <span className="text-[#E2C27B]">IFY</span>
                  </div>
                  <div className="flex items-center uppercase font-extrabold text-zinc-400 mt-1 text-[12px] gap-2">
                    <span className="text-[#F1F2EE]">BUILD.</span>
                    <span className="text-[#E2C27B]">BRAND.</span>
                    <span className="text-[#F1F2EE]">GROW.</span>
                  </div>
                </div>
              </div>
            </button>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-sm">
              International digital agency &amp; technology partner helping ambitious startups and enterprise brands look better, work smarter, and scale faster.
            </p>

            <div className="space-y-3.5 text-xs text-zinc-300 pt-1">
              {/* Head Office (USA) */}
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-[#C9A45C]/20 space-y-1">
                <div className="flex items-center gap-1.5 text-[#E2C27B] font-extrabold uppercase text-[10px] tracking-wider">
                  <Building2 className="w-3 h-3" />
                  <span>Head Office (USA)</span>
                </div>
                <div className="flex items-start gap-2 text-zinc-300 text-[11px] leading-snug pl-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#C9A45C] shrink-0 mt-0.5" />
                  <span>111, Elm AVE, Glen Cove, New York</span>
                </div>
                <div className="flex items-center gap-2 pl-0.5 pt-0.5">
                  <Phone className="w-3 h-3 text-[#C9A45C] shrink-0" />
                  <a href="tel:+8801879176373" className="text-zinc-300 hover:text-[#E2C27B] text-[11px] font-semibold transition-colors">
                    +880 1879-176373
                  </a>
                </div>
              </div>

              {/* Bangladesh Branch */}
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-[#C9A45C]/30 transition-colors space-y-1">
                <div className="flex items-center gap-1.5 text-[#E2C27B] font-extrabold uppercase text-[10px] tracking-wider">
                  <Building2 className="w-3 h-3" />
                  <span>Bangladesh Branch</span>
                </div>
                <div className="flex items-start gap-2 text-zinc-300 text-[11px] leading-snug pl-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#C9A45C] shrink-0 mt-0.5" />
                  <span>House 18 Road -7, Gulshan 2. Dhaka, Bangladesh.</span>
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
                    className="text-zinc-300 hover:text-emerald-400 text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <span>WhatsApp: +92 332 1029333</span>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#E2C27B] shrink-0" />
                  <a href="mailto:admin@branify.store" className="text-zinc-300 hover:text-[#E2C27B] text-xs transition-colors">
                    admin@branify.store
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-[#F1F2EE] uppercase tracking-wider">Services</h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              {serviceLinks.map((item) => (
                <li key={item.label}>
                  <button onClick={() => nav(item.route)} className="hover:text-[#E2C27B] transition-colors text-left">
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Free Resources */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-[#F1F2EE] uppercase tracking-wider">Free Resources</h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              {resourceLinks.map((item) =>
                item.gold ? (
                  <li key={item.label}>
                    <button onClick={() => nav(item.route)} className="hover:text-[#FFF6E5] transition-colors text-[#E2C27B] font-bold flex items-center gap-1 text-left">
                      {item.label} <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </li>
                ) : (
                  <li key={item.label}>
                    <button onClick={() => nav(item.route)} className="hover:text-[#E2C27B] transition-colors text-left">
                      {item.label}
                    </button>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* 100+ Free Tools */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-[#F1F2EE] uppercase tracking-wider">100+ Free Tools</h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              {toolsLinks.map((item) =>
                item.gold ? (
                  <li key={item.label}>
                    <button onClick={() => nav(item.route)} className="hover:text-[#FFF6E5] transition-colors text-[#E2C27B] font-bold flex items-center gap-1 text-left">
                      {item.label} <Sparkles className="w-3 h-3 text-[#E2C27B]" />
                    </button>
                  </li>
                ) : (
                  <li key={item.label}>
                    <button onClick={() => nav(item.route)} className="hover:text-[#E2C27B] transition-colors text-left">
                      {item.label}
                    </button>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Company & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-[#F1F2EE] uppercase tracking-wider">Company &amp; Legal</h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li>
                <button onClick={() => nav('/about')} className="hover:text-[#E2C27B] transition-colors text-left">About Us</button>
              </li>
              <li>
                <button onClick={() => nav('/portfolio')} className="hover:text-[#E2C27B] transition-colors text-left">Case Studies</button>
              </li>
              <li>
                <button onClick={() => nav('/blog')} className="hover:text-[#E2C27B] transition-colors text-left">Insights Blog</button>
              </li>
              <li>
                <button onClick={() => nav('/pricing')} className="hover:text-[#E2C27B] transition-colors text-left">Transparent Pricing</button>
              </li>
              <li>
                <button
                  onClick={() => setBrandKitOpen(true)}
                  className="hover:text-[#F1F2EE] text-[#E2C27B] font-extrabold transition-colors flex items-center gap-1 cursor-pointer text-left"
                >
                  <Palette className="w-3 h-3" />
                  <span>Logo &amp; Brand Kit</span>
                </button>
              </li>
              <li>
                <button onClick={() => nav('/privacypolicy')} className="hover:text-[#E2C27B] transition-colors text-left">Privacy Policy</button>
              </li>
              <li>
                <button onClick={() => nav('/termsandconditions')} className="hover:text-[#E2C27B] transition-colors text-left">Terms of Service</button>
              </li>
              <li>
                <button onClick={() => nav('/refundpolicy')} className="hover:text-[#E2C27B] transition-colors text-left">Refund Policy</button>
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
              className="px-4 py-2.5 bg-white/[0.04] border border-[#C9A45C]/25 rounded-full text-xs text-[#F1F2EE] placeholder-zinc-500 focus:outline-none focus:border-[#C9A45C] flex-1"
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
                className="p-2.5 bg-white/[0.04] hover:bg-[#C9A45C]/20 text-zinc-400 hover:text-[#E2C27B] rounded-full border border-white/[0.08] hover:border-[#C9A45C]/40 transition-colors"
                title={label}
                aria-label={label}
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="text-center text-xs text-zinc-500 pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>© {new Date().getFullYear()} BRANIFY (branify.store). All rights reserved.</div>
          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={() => nav('/privacypolicy')} className="hover:underline cursor-pointer">Privacy</button>
            <button onClick={() => nav('/termsandconditions')} className="hover:underline cursor-pointer">Terms</button>
            <button onClick={() => nav('/disclaimer')} className="hover:underline cursor-pointer">Disclaimer</button>
            <button onClick={() => nav('/admin')} className="text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer">Admin</button>
          </div>
        </div>
      </div>

      <BrandKitModal isOpen={brandKitOpen} onClose={() => setBrandKitOpen(false)} />
    </footer>
  );
};
