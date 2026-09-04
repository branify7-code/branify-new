import React, { useState } from 'react';
import { ShieldCheck, FileText, ArrowLeft, Lock, RefreshCw, Cookie, AlertCircle } from 'lucide-react';

interface LegalViewProps {
  onNavigateHome: () => void;
  initialTab?: 'privacy' | 'terms' | 'refund' | 'cookies' | 'disclaimer';
}

export const LegalView: React.FC<LegalViewProps> = ({
  onNavigateHome,
  initialTab = 'privacy',
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'refund' | 'cookies' | 'disclaimer'>(initialTab);

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
      {/* Header & Breadcrumb */}
      <div className="space-y-4">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 text-xs font-mono text-[#D4AF37] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Homepage</span>
        </button>

        <div className="space-y-2">
          <span className="text-xs font-mono uppercase text-[#D4AF37] tracking-widest">
            Compliance & Transparency
          </span>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black uppercase text-[#FFF5DC]">
            Legal Governance & Policies
          </h1>
          <p className="text-xs text-white/50 font-mono">
            Last Updated: January 1, 2026 | Effective for all global operations
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-2 rounded-2xl bg-[#0F1015] border border-white/10">
        <button
          onClick={() => setActiveTab('privacy')}
          className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'privacy'
              ? 'bg-[#D4AF37] text-[#08090B] font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)]'
              : 'text-white/70 hover:text-white'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Privacy Policy</span>
        </button>

        <button
          onClick={() => setActiveTab('terms')}
          className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'terms'
              ? 'bg-[#D4AF37] text-[#08090B] font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)]'
              : 'text-white/70 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Terms of Service</span>
        </button>

        <button
          onClick={() => setActiveTab('refund')}
          className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'refund'
              ? 'bg-[#D4AF37] text-[#08090B] font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)]'
              : 'text-white/70 hover:text-white'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refund & SOW Policy</span>
        </button>

        <button
          onClick={() => setActiveTab('cookies')}
          className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'cookies'
              ? 'bg-[#D4AF37] text-[#08090B] font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)]'
              : 'text-white/70 hover:text-white'
          }`}
        >
          <Cookie className="w-3.5 h-3.5" />
          <span>Cookie Policy</span>
        </button>

        <button
          onClick={() => setActiveTab('disclaimer')}
          className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'disclaimer'
              ? 'bg-[#D4AF37] text-[#08090B] font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)]'
              : 'text-white/70 hover:text-white'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Disclaimer & IP</span>
        </button>
      </div>

      {/* Legal Content Body */}
      <div className="rounded-3xl bg-[#0F1015] border border-white/10 p-8 sm:p-12 text-sm text-white/80 font-light leading-relaxed space-y-8">
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-[#FFF5DC]">
              1. Global Privacy Policy
            </h2>
            <p>
              At Branify (&ldquo;the Studio&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;), we take client confidentiality and user data sovereignty with supreme gravity. This Privacy Policy details the exact mechanisms through which data is handled across our digital properties and services.
            </p>
            <h3 className="font-display text-lg font-bold text-[#D4AF37]">
              Data Collection & Zero-Tracker Philosophy
            </h3>
            <p>
              We do not sell, broker, or monetize client data. Our free developer utilities operate strictly client-side inside your browser sandbox using web crypto APIs without sending your inputs, passwords, or JSON payloads to remote telemetry servers.
            </p>
            <h3 className="font-display text-lg font-bold text-[#D4AF37]">
              Client Briefings & Inquiries
            </h3>
            <p>
              When you submit a project inquiry, your contact name, work email, and technical specifications are transmitted over encrypted TLS 1.3 channels solely to evaluate feasibility and draft preliminary master service agreements.
            </p>
            <h3 className="font-display text-lg font-bold text-[#D4AF37]">
              GDPR, CCPA & International Compliance
            </h3>
            <p>
              All European Union and California statutory rights regarding data deletion, access, and export are honored within 48 hours upon written notice to privacy@branify.store.
            </p>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-[#FFF5DC]">
              2. Terms of Service
            </h2>
            <p>
              By accessing the Branify ecosystem, deploying our digital utilities, or entering into a Statement of Work (SOW), you agree to be bound by these Terms of Service.
            </p>
            <h3 className="font-display text-lg font-bold text-[#D4AF37]">
              Intellectual Property Assignment
            </h3>
            <p>
              Upon complete settlement of contractual fees outlined in an executed SOW, 100% of custom visual assets, production codebase, and intellectual property developed specifically for the client are assigned in full to the client.
            </p>
            <h3 className="font-display text-lg font-bold text-[#D4AF37]">
              Service Level Agreements & Guarantees
            </h3>
            <p>
              Branify commits to high-performance delivery benchmarks (including Core Web Vitals targets, WCAG AA compliance, and production security audits) as specified in individual client contracts.
            </p>
          </div>
        )}

        {activeTab === 'refund' && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-[#FFF5DC]">
              3. Refund & Milestone Policy
            </h2>
            <p>
              Because our studio provides bespoke engineering, architectural advisory, and custom creative design, service engagements are structured across verified milestone gates.
            </p>
            <h3 className="font-display text-lg font-bold text-[#D4AF37]">
              Discovery & Feasibility Phase
            </h3>
            <p>
              Initial sprint deposits cover technical research, architectural discovery, and spatial prototyping. If a project is cancelled prior to development commencement, unutilized sprint allocations are refunded minus documented engineering hours.
            </p>
            <h3 className="font-display text-lg font-bold text-[#D4AF37]">
              Milestone Sign-Offs
            </h3>
            <p>
              Once a milestone (e.g. Design Approval, Alpha Release, Final Production Sign-off) is approved by the client, associated tranche payments are considered fulfilled.
            </p>
          </div>
        )}

        {activeTab === 'cookies' && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-[#FFF5DC]">
              4. Cookie & Local Storage Policy
            </h2>
            <p>
              Branify uses strictly essential local browser storage items necessary for Progressive Web App offline caching, theme synchronization, and announcement bar dismissal state.
            </p>
            <p>
              We do not utilize invasive third-party cross-site advertising trackers or behavioral pixels. You can manage or purge local storage at any time via your browser settings.
            </p>
          </div>
        )}

        {activeTab === 'disclaimer' && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-[#FFF5DC]">
              5. Legal Disclaimer & Trademarks
            </h2>
            <p>
              All trademarks, product names, and company logos referenced in our portfolio case studies are the property of their respective owners. Case studies document real architectural and engineering engagements executed by Branify and its team.
            </p>
            <p>
              For legal inquiries, copyright notices, or formal correspondence, contact legal@branify.store.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
