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

  const tabCls = (active: boolean) =>
    `px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
      active
        ? 'bg-[#5B5FEF] text-white font-semibold shadow-[0_8px_20px_-8px_rgba(91,95,239,0.55)]'
        : 'text-[#475569] hover:text-[#111827] hover:bg-white'
    }`;

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
      {/* Header & Breadcrumb */}
      <div className="space-y-4">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 text-xs font-mono text-[#8F6B2D] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Homepage</span>
        </button>

        <div className="space-y-2">
          <span className="eyebrow-label">
            Compliance & Transparency
          </span>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#111827]">
            Legal Governance & Policies
          </h1>
          <p className="text-xs text-[#94A3B8] font-mono">
            Last Updated: January 1, 2026 | Effective for all global operations
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-2 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
        <button
          onClick={() => setActiveTab('privacy')}
          className={tabCls(activeTab === 'privacy')}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Privacy Policy</span>
        </button>

        <button
          onClick={() => setActiveTab('terms')}
          className={tabCls(activeTab === 'terms')}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Terms of Service</span>
        </button>

        <button
          onClick={() => setActiveTab('refund')}
          className={tabCls(activeTab === 'refund')}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refund & SOW Policy</span>
        </button>

        <button
          onClick={() => setActiveTab('cookies')}
          className={tabCls(activeTab === 'cookies')}
        >
          <Cookie className="w-3.5 h-3.5" />
          <span>Cookie Policy</span>
        </button>

        <button
          onClick={() => setActiveTab('disclaimer')}
          className={tabCls(activeTab === 'disclaimer')}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Disclaimer & IP</span>
        </button>
      </div>

      {/* Legal Content Body — clean typographic page */}
      <div className="max-w-3xl text-sm text-[#334155] leading-relaxed space-y-8 border-t border-[#E2E8F0] pt-10">
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-[#111827]">
              1. Global Privacy Policy
            </h2>
            <p>
              At Branify (&ldquo;the Studio&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;), we take client confidentiality and user data sovereignty with supreme gravity. This Privacy Policy details the exact mechanisms through which data is handled across our digital properties and services.
            </p>
            <h3 className="font-display text-lg font-bold text-[#111827]">
              Data Collection & Zero-Tracker Philosophy
            </h3>
            <p>
              We do not sell, broker, or monetize client data. Our free developer utilities operate strictly client-side inside your browser sandbox using web crypto APIs without sending your inputs, passwords, or JSON payloads to remote telemetry servers.
            </p>
            <h3 className="font-display text-lg font-bold text-[#111827]">
              Client Briefings & Inquiries
            </h3>
            <p>
              When you submit a project inquiry, your contact name, work email, and technical specifications are transmitted over encrypted TLS 1.3 channels solely to evaluate feasibility and draft preliminary master service agreements.
            </p>
            <h3 className="font-display text-lg font-bold text-[#111827]">
              GDPR, CCPA & International Compliance
            </h3>
            <p>
              All European Union and California statutory rights regarding data deletion, access, and export are honored within 48 hours upon written notice to admin@branify.store.
            </p>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-[#111827]">
              2. Terms of Service
            </h2>
            <p>
              By accessing the Branify ecosystem, deploying our digital utilities, or entering into a Statement of Work (SOW), you agree to be bound by these Terms of Service.
            </p>
            <h3 className="font-display text-lg font-bold text-[#111827]">
              Intellectual Property Assignment
            </h3>
            <p>
              Upon complete settlement of contractual fees outlined in an executed SOW, 100% of custom visual assets, production codebase, and intellectual property developed specifically for the client are assigned in full to the client.
            </p>
            <h3 className="font-display text-lg font-bold text-[#111827]">
              Service Level Agreements & Guarantees
            </h3>
            <p>
              Branify commits to high-performance delivery benchmarks (including Core Web Vitals targets, WCAG AA compliance, and production security audits) as specified in individual client contracts.
            </p>
          </div>
        )}

        {activeTab === 'refund' && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-[#111827]">
              3. Refund & Milestone Policy
            </h2>
            <p>
              Because our studio provides bespoke engineering, architectural advisory, and custom creative design, service engagements are structured across verified milestone gates.
            </p>
            <h3 className="font-display text-lg font-bold text-[#111827]">
              Discovery & Feasibility Phase
            </h3>
            <p>
              Initial sprint deposits cover technical research, architectural discovery, and spatial prototyping. If a project is cancelled prior to development commencement, unutilized sprint allocations are refunded minus documented engineering hours.
            </p>
            <h3 className="font-display text-lg font-bold text-[#111827]">
              Milestone Sign-Offs
            </h3>
            <p>
              Once a milestone (e.g. Design Approval, Alpha Release, Final Production Sign-off) is approved by the client, associated tranche payments are considered fulfilled.
            </p>
          </div>
        )}

        {activeTab === 'cookies' && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-[#111827]">
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
            <h2 className="font-display text-2xl font-bold text-[#111827]">
              5. Legal Disclaimer & Trademarks
            </h2>
            <p>
              All trademarks, product names, and company logos referenced in our portfolio case studies are the property of their respective owners. Case studies document real architectural and engineering engagements executed by Branify and its team.
            </p>
            <p>
              For legal inquiries, copyright notices, or formal correspondence, contact admin@branify.store.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
