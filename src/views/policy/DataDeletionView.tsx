/* =========================================================
   DataDeletionView — /data-deletion
   Official BRANIFY "User Data Deletion" instructions page.
   Used as the Meta/Facebook "User Data Deletion" URL for
   BRANIFY AI Marketing integrations. Public, no login.

   Design: 1:1 with the BRANIFY light premium system
   (breadcrumb pill, display hero with gold gradient, white
   rounded cards, gold CTAs) — same vocabulary as ContactView
   and BlogView. Not a generic legal template.
========================================================= */

import React from 'react';
import {
  ArrowRight, Clock, Database, Facebook, FileText, Instagram,
  Mail, ShieldCheck, Trash2, Globe,
} from 'lucide-react';
import Seo from '../../components/Seo';

interface DataDeletionViewProps {
  onNavigate: (path: string) => void;
}

const REQUEST_MAILTO = 'mailto:admin@branify.store?subject=Data%20Deletion%20Request';

export const DataDeletionView: React.FC<DataDeletionViewProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen">
      <Seo
        title="User Data Deletion | BRANIFY"
        description="Learn how to request deletion of personal data associated with BRANIFY services and connected Meta accounts."
        canonicalPath="/data-deletion"
        robots="index, follow"
      />

      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Hero */}
        <div className="max-w-3xl mx-auto text-center mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E2E8F0] shadow-[0_2px_10px_rgba(15,23,42,0.04)] text-xs font-mono text-[#8F6B2D] mb-6">
            <button
              onClick={() => onNavigate('/')}
              className="text-[#64748B] hover:text-[#111827] transition-colors cursor-pointer"
            >
              Home
            </button>
            <span className="text-[#CBD5E1]">/</span>
            <span className="text-[#8F6B2D]">User Data Deletion</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] leading-[1.08] text-[#111827] mb-5">
            User <span className="text-gold-gradient">Data Deletion</span>
          </h1>
          <p className="text-sm sm:text-lg text-[#475569] font-light leading-relaxed max-w-2xl mx-auto">
            Your privacy matters to us. This page explains how you can request deletion of
            personal data associated with your use of BRANIFY services.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={REQUEST_MAILTO}
              className="btn-gold-primary rounded-full text-xs font-black uppercase px-7 py-3 inline-flex items-center gap-2 tracking-wider cursor-pointer"
              aria-label="Request data deletion by email"
            >
              Request Data Deletion <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={() => onNavigate('/privacypolicy')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-[#E2E8F0] text-xs font-mono font-semibold text-[#334155] hover:border-[#5B5FEF]/50 hover:text-[#5B5FEF] transition-colors cursor-pointer shadow-[0_2px_10px_rgba(15,23,42,0.04)]"
            >
              <FileText className="w-3.5 h-3.5" /> View Privacy Policy
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          {/* Section 1 — Request Data Deletion */}
          <article className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-10 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.15)]">
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C9A45C]/10 border border-[#C9A45C]/40 text-[#8F6B2D]">
                <Trash2 className="w-5 h-5" />
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
                Request Data Deletion
              </h2>
            </div>
            <div className="text-sm text-[#334155] leading-relaxed space-y-4">
              <p>
                If you would like BRANIFY to delete personal information associated with your
                account, services, or connected integrations, you can submit a deletion request.
              </p>
              <p>
                To request deletion, contact BRANIFY using the official contact details shown on
                our website.
              </p>
              <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:p-5">
                <p className="text-xs font-mono uppercase tracking-widest text-[#64748B] mb-1.5">Primary contact</p>
                <a
                  href={REQUEST_MAILTO}
                  className="inline-flex items-center gap-2 font-mono text-sm font-bold text-[#8F6B2D] hover:text-[#5B5FEF] transition-colors"
                >
                  <Mail className="w-4 h-4" /> admin@branify.store
                </a>
              </div>
              <div>
                <p className="font-semibold text-[#111827] mb-2">When writing, please also provide:</p>
                <ul className="space-y-2">
                  {[
                    'Your full name',
                    'The email address associated with your account',
                    'A clear request asking for deletion of your personal data',
                    'Any relevant information that helps us identify your account or connected service',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A45C]" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>

          {/* Section 2 — Meta / Facebook / Instagram */}
          <article className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-10 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.15)]">
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C9A45C]/10 border border-[#C9A45C]/40 text-[#8F6B2D]">
                <span className="flex items-center gap-0.5" aria-hidden="true">
                  <Facebook className="w-4 h-4" />
                  <Instagram className="w-4 h-4" />
                </span>
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
                Meta / Facebook / Instagram Data
              </h2>
            </div>
            <div className="text-sm text-[#334155] leading-relaxed space-y-4">
              <p>
                If you have connected your Facebook or Instagram account to a BRANIFY application
                or integration, you may request deletion of data that BRANIFY has stored or
                processed in connection with that integration.
              </p>
              <p>
                Once a valid deletion request is received, BRANIFY will review the request and
                delete applicable personal data from its systems where required and applicable.
              </p>
            </div>
          </article>

          {/* Section 3 — What Happens After Your Request */}
          <article className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-10 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.15)]">
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C9A45C]/10 border border-[#C9A45C]/40 text-[#8F6B2D]">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
                What Happens After Your Request
              </h2>
            </div>
            <p className="text-sm text-[#334155] leading-relaxed mb-4">
              After receiving a valid request:
            </p>
            <ol className="space-y-3">
              {[
                'We will review the request.',
                'We may verify the requester\u2019s identity or account information when reasonably necessary to prevent unauthorized deletion.',
                'We will identify applicable personal data associated with the request.',
                'We will delete applicable data where required.',
                'We will notify the requester when the deletion process has been completed, subject to applicable legal or operational requirements.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C9A45C]/15 border border-[#C9A45C]/40 text-[11px] font-black text-[#8F6B2D]"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm text-[#334155] leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </article>

          {/* Section 4 — Data We May Retain */}
          <article className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-10 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.15)]">
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C9A45C]/10 border border-[#C9A45C]/40 text-[#8F6B2D]">
                <Database className="w-5 h-5" />
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
                Data We May Retain
              </h2>
            </div>
            <div className="text-sm text-[#334155] leading-relaxed space-y-4">
              <p>
                Some information may need to be retained where required by law, for legitimate
                security purposes, fraud prevention, dispute resolution, accounting, or other
                lawful obligations.
              </p>
              <p>
                Only information that is required to be retained will be kept, and it will be
                handled according to the BRANIFY Privacy Policy.
              </p>
            </div>
          </article>

          {/* Section 5 — Processing Time */}
          <article className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-10 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.15)]">
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C9A45C]/10 border border-[#C9A45C]/40 text-[#8F6B2D]">
                <Clock className="w-5 h-5" />
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
                Processing Time
              </h2>
            </div>
            <p className="text-sm text-[#334155] leading-relaxed mb-3">
              Deletion requests are generally reviewed as soon as reasonably possible.
            </p>
            <p className="text-sm text-[#334155] leading-relaxed mb-2">
              The actual processing time may depend on:
            </p>
            <ul className="space-y-2">
              {[
                'the complexity of the request',
                'identity/account verification',
                'the systems involved',
                'applicable legal requirements',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-[#334155]">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A45C]" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          {/* Section 6 — Contact BRANIFY */}
          <article className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-10 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.15)]">
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C9A45C]/10 border border-[#C9A45C]/40 text-[#8F6B2D]">
                <Globe className="w-5 h-5" />
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
                Contact BRANIFY
              </h2>
            </div>
            <p className="text-sm text-[#334155] leading-relaxed mb-4">For data deletion requests, contact:</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:p-5">
                <p className="text-xs font-mono uppercase tracking-widest text-[#64748B] mb-1.5">Website</p>
                <a
                  href="https://branify.store"
                  className="font-mono text-sm font-bold text-[#8F6B2D] hover:text-[#5B5FEF] transition-colors break-all"
                >
                  https://branify.store
                </a>
              </div>
              <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:p-5">
                <p className="text-xs font-mono uppercase tracking-widest text-[#64748B] mb-1.5">Email</p>
                <a
                  href={REQUEST_MAILTO}
                  className="font-mono text-sm font-bold text-[#8F6B2D] hover:text-[#5B5FEF] transition-colors break-all"
                >
                  admin@branify.store
                </a>
              </div>
            </div>
            <div className="mt-6 text-center">
              <a
                href={REQUEST_MAILTO}
                className="btn-gold-primary rounded-full text-xs font-black uppercase px-7 py-3 inline-flex items-center gap-2 tracking-wider cursor-pointer"
                aria-label="Request data deletion by email"
              >
                Request Data Deletion <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </article>

          {/* Section 7 — Privacy Policy */}
          <div className="bg-[#080B14] border border-white/[0.08] rounded-3xl p-6 sm:p-8 text-center">
            <p className="text-sm sm:text-base font-bold text-[#F1F2EE] mb-2">
              How BRANIFY handles your information
            </p>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-xl mx-auto mb-6">
              For more information about how BRANIFY collects, uses, stores, and protects personal
              information, please review our Privacy Policy.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('/privacypolicy')}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full border border-[#C9A45C]/40 text-xs font-black uppercase tracking-widest text-[#E7C978] hover:border-[#C9A45C] hover:bg-[#C9A45C]/10 transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" /> View Privacy Policy
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DataDeletionView;
