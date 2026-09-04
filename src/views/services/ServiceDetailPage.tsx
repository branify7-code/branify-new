/* =========================================================
   ServiceDetailPage — 1:1 replica of branify.store's
   /services/<slug> page (ServiceDetailPage chunk):
   hero, 4 package tiers, benefits, 5-stage framework,
   FAQ accordion, deliverables sidebar, related services
   and the service inquiry modal (with WhatsApp follow-up).
   Leads are written to the Supabase `inquiries` table (best effort,
   matching the live site) with a localStorage backup for offline safety.
========================================================= */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X, CheckCircle2, MessageCircle, FileText, ArrowLeft, Clock,
  Layers, ArrowRight, RefreshCw, Sparkles, HelpCircle, PackageCheck, ChevronDown, Send,
} from 'lucide-react';
import Seo from '../../components/Seo';
import { servicesRegistry, AgencyService, ServicePackage } from '../../data/servicesRegistry';
import { useCurrency } from '../../lib/currency';
import { supabase } from '../../lib/supabase';

const CONTACT_WHATSAPP = '+92 332 1029333';

/* ------------------------------------------------------------------ */
/* Service Inquiry Modal (live replica — dual write: best-effort       */
/* Supabase `inquiries` insert + localStorage backup lead store)       */
/* ------------------------------------------------------------------ */

interface ServiceInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: AgencyService;
  selectedPackage?: ServicePackage;
}

interface ServiceLead {
  name: string;
  email: string;
  whatsapp: string;
  company: string;
  country: string;
  service: string;
  budget: string;
  timeline: string;
  description: string;
  referenceUrl: string;
  submittedAt: string;
}

function persistLead(lead: ServiceLead): void {
  try {
    const key = 'branify-service-leads';
    const existing = JSON.parse(window.localStorage.getItem(key) || '[]');
    existing.push(lead);
    window.localStorage.setItem(key, JSON.stringify(existing));
  } catch {
    /* storage unavailable — inquiry still "succeeds" visually */
  }
}

/* Best-effort insert into the Supabase `inquiries` table (same table the
   live site uses; see supabase/schema.sql). Never blocks or fails the UX —
   the localStorage backup above already captured the lead. */
async function pushLeadToSupabase(lead: ServiceLead): Promise<void> {
  try {
    await supabase.from('inquiries').insert([
      {
        name: lead.name,
        email: lead.email,
        company: lead.company || 'Not specified',
        services: [lead.service],
        budget: lead.budget || null,
        timeline: lead.timeline || null,
        details: [
          lead.description ? `Description: ${lead.description}` : '',
          lead.whatsapp ? `WhatsApp: ${lead.whatsapp}` : '',
          lead.country ? `Country: ${lead.country}` : '',
          lead.referenceUrl ? `Reference: ${lead.referenceUrl}` : '',
        ].filter(Boolean).join('\n'),
      },
    ]);
  } catch {
    /* network/permission issue — localStorage backup already has the lead */
  }
}

const ServiceInquiryModal: React.FC<ServiceInquiryModalProps> = ({ isOpen, onClose, service, selectedPackage }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [company, setCompany] = useState('');
  const [serviceName, setServiceName] = useState(service ? service.name : 'Website Development');
  const [packageTier, setPackageTier] = useState(selectedPackage ? selectedPackage.name : 'Client On-Demand');
  const [budget, setBudget] = useState('Flexible / Custom');
  const [timeline, setTimeline] = useState('1–2 Weeks');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (service) setServiceName(service.name);
    setPackageTier(selectedPackage ? selectedPackage.name : 'Client On-Demand');
  }, [service, selectedPackage, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setIsSubmitted(false);
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !description.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    setIsSubmitting(true);
    // Persist the lead: Supabase `inquiries` (best effort) + local backup
    const lead: ServiceLead = {
      name: name.trim(),
      email: email.trim(),
      whatsapp: whatsapp.trim(),
      company: company.trim(),
      country: 'International',
      service: `${serviceName} — [Package: ${packageTier}]`,
      budget,
      timeline,
      description: description.trim(),
      referenceUrl: referenceUrl.trim(),
      submittedAt: new Date().toISOString(),
    };
    persistLead(lead);
    void pushLeadToSupabase(lead);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const waNumber = CONTACT_WHATSAPP.replace(/[^0-9]/g, '');
  const waMessage = encodeURIComponent(
    `Hello BRANIFY Team! I just submitted an inquiry for "${serviceName}" [${packageTier}].\n\n` +
      `Name: ${name}\nEmail: ${email}\nBudget: ${budget}\nTimeline: ${timeline}\n\nProject details: ${description}`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#080808] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          <div className="text-center py-8 space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Inquiry Received Successfully!</h3>
              <p className="text-zinc-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                Thank you, <strong className="text-white">{name}</strong>. Our senior technical strategist is reviewing your requirements for{' '}
                <strong className="text-[#F27D26]">
                  {serviceName} ({packageTier})
                </strong>
                . We will email your tailored proposal and quotation shortly.
              </p>
            </div>
            <div className="p-4 bg-zinc-950 border border-white/10 rounded-2xl space-y-3 max-w-md mx-auto">
              <div className="text-xs font-bold text-zinc-300">Want an instant response or immediate consultation?</div>
              <a
                href={`https://wa.me/${waNumber}?text=${waMessage}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] text-black font-extrabold text-xs uppercase tracking-widest rounded-full transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <MessageCircle className="w-4 h-4" />
                Chat Direct on WhatsApp Now
              </a>
            </div>
            <button
              onClick={() => {
                setIsSubmitted(false);
                onClose();
              }}
              className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold uppercase tracking-wider rounded-full border border-white/10 transition-colors"
            >
              Done &amp; Close
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-2 pr-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[#F27D26] text-[10px] font-extrabold uppercase tracking-widest">
                <FileText className="w-3.5 h-3.5 text-[#F27D26]" />
                {packageTier === 'Client On-Demand' ? 'Custom Scope Inquiry' : 'Service Quotation Request'}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">{service ? service.name : 'Service Inquiry'}</h2>
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                {packageTier === 'Client On-Demand'
                  ? 'Describe your exact project specifications and our senior solutions architects will formulate a tailored package and quotation.'
                  : `Requesting proposal for the ${packageTier} package. Tell us about your goals and we will get back to you with timelines and quotes.`}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                    Full Name <span className="text-[#F27D26]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#F27D26] transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                    Work Email <span className="text-[#F27D26]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@company.com"
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#F27D26] transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">WhatsApp / Phone Number</label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+1 555 019 2834"
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#F27D26] transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">Company / Brand Name</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Acme Media / Your Brand"
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#F27D26] transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">Service Required</label>
                  <select
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#5A8DFF] transition-colors"
                  >
                    {servicesRegistry.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">Package Tier</label>
                  <select
                    value={packageTier}
                    onChange={(e) => setPackageTier(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#F27D26] transition-colors"
                  >
                    <option value="Basic">Basic Package</option>
                    <option value="Professional">Professional Package</option>
                    <option value="Premium">Premium Package</option>
                    <option value="Client On-Demand">Client On-Demand (Bespoke)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">Estimated Budget ({'USD'})</label>
                  <select
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#F27D26] transition-colors"
                  >
                    <option value="Under $500">Under $500</option>
                    <option value="$500 – $1,000">$500 – $1,000</option>
                    <option value="$1,000 – $2,500">$1,000 – $2,500</option>
                    <option value="$2,500 – $5,000">$2,500 – $5,000</option>
                    <option value="$5,000+">$5,000+ (Enterprise)</option>
                    <option value="Flexible / Custom">Flexible / Needs Discussion</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">Desired Timeline</label>
                  <select
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#F27D26] transition-colors"
                  >
                    <option value="Urgent (< 1 Week)">Urgent (&lt; 1 Week)</option>
                    <option value="1–2 Weeks">1–2 Weeks</option>
                    <option value="2–4 Weeks">2–4 Weeks</option>
                    <option value="1–2 Months">1–2 Months</option>
                    <option value="Flexible">Flexible Schedule</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                  Existing Website / Benchmark Reference (Optional)
                </label>
                <input
                  type="url"
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#F27D26] transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                  Project Description &amp; Requirements <span className="text-[#F27D26]">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe your core goals, desired pages/features, target audience, and any specific technology or design requirements..."
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#F27D26] transition-colors resize-none"
                />
              </div>

              {errorMessage && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs font-bold text-red-400">{errorMessage}</div>
              )}

              <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#F27D26]" />
                  NDA &amp; Confidentiality Guaranteed
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold uppercase tracking-wider rounded-full border border-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none px-7 py-3 bg-[#F27D26] hover:bg-orange-500 text-black font-black text-xs uppercase tracking-widest rounded-full transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Submit Inquiry
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Service Detail Page                                                 */
/* ------------------------------------------------------------------ */

interface ServiceDetailPageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export const ServiceDetailPage: React.FC<ServiceDetailPageProps> = ({ slug, onNavigate }) => {
  const { currency, currencyInfo, format } = useCurrency();
  // Live behavior: unknown slugs (e.g. shopify-website-development) fall back to the first service
  const service = servicesRegistry.find((s) => s.slug === slug) || servicesRegistry[0];

  const [openFaq, setOpenFaq] = useState<number>(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | undefined>(undefined);

  useEffect(() => {
    setOpenFaq(0);
  }, [slug]);

  const handlePackageAction = (pkg: ServicePackage) => {
    setSelectedPackage(pkg);
    setModalOpen(true);
  };

  const openCustomQuote = () => {
    const onDemand = service.packages.find((p) => p.tier === 'on_demand') || service.packages[0];
    setSelectedPackage(onDemand);
    setModalOpen(true);
  };

  const related = useMemo(() => servicesRegistry.filter((s) => s.id !== service.id).slice(0, 3), [service.id]);

  const seoTitle = service.slug === 'website-development' ? 'Website Development Services | BRANIFY' : `${service.name} Services | BRANIFY`;
  const seoDescription =
    service.slug === 'website-development'
      ? 'Professional website development for businesses, startups and brands. Fast, responsive and scalable websites built by BRANIFY.'
      : `${service.shortDescription || service.tagline} Professional packages with fast delivery, responsive UX, and scalable architecture.`;

  const serviceType =
    service.category === 'web' ? 'Web Development & Design' : service.category === 'design' ? 'Brand & Graphic Design' : 'Digital Growth & AI Services';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <Seo
        title={seoTitle}
        description={seoDescription}
        canonicalPath={`/services/${service.slug}`}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Services', url: '/services' },
          { name: service.name, url: `/services/${service.slug}` },
        ]}
        faqs={service.faqs.map((f) => ({ question: f.question, answer: f.answer }))}
        serviceSchema={{
          name: service.name,
          description: service.fullDescription || service.shortDescription,
          serviceType,
        }}
      />

      {/* Back */}
      <button
        onClick={() => onNavigate('/services')}
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4 text-[#5A8DFF]" />
        Back to All Services
      </button>

      {/* Hero */}
      <div className="bg-[#080808] border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/10 text-[#5A8DFF] text-xs font-extrabold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-[#5A8DFF]" />
            {service.category.toUpperCase()} SERVICE
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-full text-xs text-zinc-300">
            <span>{currencyInfo.flag}</span>
            <span>
              Pricing converted to <strong className="text-white">{currency}</strong>
            </span>
          </div>
        </div>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter">{service.name}</h1>
        <p className="text-zinc-300 text-sm sm:text-base leading-relaxed max-w-4xl">{service.tagline}</p>
        <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-4xl">{service.fullDescription}</p>
        <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <div className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Standard Timeline</div>
              <div className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                <Clock className="w-4 h-4 text-[#5A8DFF]" />
                {service.deliveryTimeline}
              </div>
            </div>
            <div className="h-8 w-px bg-white/10 hidden sm:block" />
            <div>
              <div className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Pricing Structure</div>
              <div className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                <Layers className="w-4 h-4 text-[#5A8DFF]" />
                4 Transparent Packages
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={openCustomQuote}
              className="flex-1 sm:flex-none px-6 py-3.5 btn-gradient-primary text-black font-extrabold text-xs uppercase tracking-widest rounded-full shadow-lg transition-all flex items-center justify-center gap-2"
            >
              Request Custom Quote
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Packages */}
      <div className="space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white text-[10px] font-extrabold uppercase tracking-widest">
            Service Packages
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">Choose Your Preferred Scope</h2>
          <p className="text-zinc-400 text-xs sm:text-sm">
            All 4 tiers are engineered to fit distinct stages of growth — from initial launches to bespoke enterprise systems.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
          {service.packages.map((pkg) => {
            const isHighlighted = pkg.highlight || pkg.tier === 'professional';
            const isOnDemand = pkg.tier === 'on_demand';
            const hasPrice = pkg.priceUSD > 0;
            return (
              <div
                key={pkg.id}
                className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 ${
                  isHighlighted
                    ? 'bg-gradient-to-b from-[#0e1626] to-[#0a0a0d] border-2 border-[#5A8DFF] shadow-2xl shadow-[#5A8DFF]/15 scale-[1.02] z-10'
                    : isOnDemand
                      ? 'bg-gradient-to-b from-zinc-900/90 to-[#080808] border border-[#5A8DFF]/30'
                      : 'bg-[#080808] border border-white/10 hover:border-white/20'
                }`}
              >
                {pkg.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md ${
                        isHighlighted ? 'bg-[#5A8DFF] text-black font-extrabold' : 'bg-zinc-800 border border-white/10 text-zinc-300'
                      }`}
                    >
                      {pkg.badge}
                    </span>
                  </div>
                )}
                <div className="space-y-6 pt-2">
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{pkg.name}</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed min-h-[36px]">{pkg.description}</p>
                  </div>
                  <div className="p-4 bg-zinc-950/80 border border-white/10 rounded-2xl space-y-1">
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{isOnDemand ? 'Pricing Model' : 'Investment'}</div>
                    {isOnDemand ? (
                      <div className="text-xl font-black text-white uppercase">Custom Quote</div>
                    ) : hasPrice ? (
                      <div className="space-y-0.5">
                        <div className="text-2xl sm:text-3xl font-black text-[#5A8DFF]">{format(pkg.priceUSD)}</div>
                        <div className="text-[10px] text-zinc-400 font-medium">
                          Converted to {currency} ({currencyInfo.symbol.trim()})
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <div className="text-lg font-extrabold text-white">Contact for Quote</div>
                        <div className="text-[10px] text-zinc-500">Flat-rate pricing on request</div>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px]">
                    <div className="p-2.5 bg-zinc-950 rounded-xl border border-white/5 space-y-0.5">
                      <div className="text-zinc-500 font-bold uppercase text-[9px] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#5A8DFF]" />
                        Timeline
                      </div>
                      <div className="font-extrabold text-zinc-200">{pkg.deliveryTime}</div>
                    </div>
                    <div className="p-2.5 bg-zinc-950 rounded-xl border border-white/5 space-y-0.5">
                      <div className="text-zinc-500 font-bold uppercase text-[9px] flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 text-[#5A8DFF]" />
                        Revisions
                      </div>
                      <div className="font-extrabold text-zinc-200">{pkg.revisions}</div>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Included In This Tier:</div>
                    <ul className="space-y-2 text-xs">
                      {pkg.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-zinc-300 font-medium leading-tight">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#5A8DFF] shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="pt-6 mt-6 border-t border-white/10">
                  <button
                    onClick={() => handlePackageAction(pkg)}
                    className={`w-full py-3.5 rounded-full font-extrabold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${
                      isHighlighted
                        ? 'btn-gradient-primary text-black'
                        : isOnDemand
                          ? 'bg-white hover:bg-zinc-200 text-black'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-white border border-white/10'
                    }`}
                  >
                    {isOnDemand ? 'Request Custom Quote' : hasPrice ? `Order Package (${format(pkg.priceUSD)})` : 'Inquire for Quote'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Benefits / Process / FAQ + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Why choose */}
          <div className="bg-[#080808] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#5A8DFF]" />
              Why Choose BRANIFY For {service.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {service.benefits.map((benefit, i) => (
                <div key={i} className="p-4 bg-zinc-950 border border-white/10 rounded-2xl text-xs font-semibold text-zinc-200 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#5A8DFF]/10 border border-[#5A8DFF]/30 flex items-center justify-center shrink-0 text-[#5A8DFF] font-bold text-[11px]">
                    ✓
                  </div>
                  <span className="mt-0.5">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 5-stage framework */}
          <div className="bg-[#080808] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Our 5-Stage Execution Framework</h2>
            <div className="space-y-3">
              {service.processSteps.map((step, i) => (
                <div key={i} className="p-4 bg-zinc-950 border border-white/10 rounded-2xl flex items-start gap-4 hover:border-white/20 transition-colors">
                  <span className="text-lg font-black text-[#5A8DFF] shrink-0 font-mono">{step.step}</span>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">{step.title}</h3>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-[#080808] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#5A8DFF]" />
              Frequently Asked Questions
            </h2>
            <div className="space-y-2.5">
              {service.faqs.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={i} className="bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden transition-colors">
                    <button
                      onClick={() => setOpenFaq(isOpen ? -1 : i)}
                      className="w-full p-4 text-left text-xs font-bold text-white flex items-center justify-between gap-3 uppercase tracking-wide"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[#5A8DFF]' : ''}`} />
                    </button>
                    {isOpen && <div className="px-4 pb-4 text-xs text-zinc-400 border-t border-white/10 pt-3 leading-relaxed">{faq.answer}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#080808] border border-white/10 rounded-3xl p-6 space-y-6 sticky top-28">
            <div className="space-y-4">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-[#5A8DFF]" />
                Final Deliverables
              </h3>
              <ul className="space-y-2.5 text-xs text-zinc-300">
                {service.deliverables.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 font-medium leading-snug">
                    <CheckCircle2 className="w-4 h-4 text-[#5A8DFF] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {service.techStack && (
              <div className="pt-5 border-t border-white/10 space-y-3">
                <div className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Technologies &amp; Frameworks</div>
                <div className="flex flex-wrap gap-1.5">
                  {service.techStack.map((tech, i) => (
                    <span key={i} className="px-2.5 py-1 bg-zinc-950 border border-white/10 rounded-lg text-[11px] font-bold text-zinc-300 uppercase font-mono">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-5 border-t border-white/10 space-y-3">
              <div className="text-xs font-bold text-white">Need a bespoke scope or NDA?</div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Our solutions engineering team can craft a custom contract, milestone billing plan, and dedicated SLA for your team.
              </p>
              <button
                onClick={openCustomQuote}
                className="w-full py-3 btn-gradient-primary text-black font-extrabold text-xs uppercase tracking-widest rounded-full transition-colors flex items-center justify-center gap-1.5 shadow-lg"
              >
                Inquire With Requirements
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Related services */}
      <div className="pt-12 border-t border-white/10 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Explore Other Agency Services</h3>
            <p className="text-zinc-400 text-xs">Complete digital ecosystem support under one trusted roof.</p>
          </div>
          <button
            onClick={() => onNavigate('/services')}
            className="text-xs font-bold uppercase tracking-wider text-[#5A8DFF] hover:text-[#3B6EF6] transition-colors flex items-center gap-1"
          >
            All {servicesRegistry.length} Services
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {related.map((rel) => (
            <div
              key={rel.id}
              onClick={() => onNavigate(`/services/${rel.slug}`)}
              className="p-6 bg-[#080808] border border-white/10 hover:border-[#5A8DFF]/40 rounded-3xl space-y-4 cursor-pointer group transition-all"
            >
              <div className="text-xs font-extrabold text-[#5A8DFF] uppercase tracking-widest">{rel.category}</div>
              <h4 className="text-base font-black text-white uppercase tracking-tight group-hover:text-[#5A8DFF] transition-colors">{rel.name}</h4>
              <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed">{rel.shortDescription}</p>
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-medium">4 Tier Options</span>
                <span className="text-[#5A8DFF] font-bold flex items-center gap-1 uppercase tracking-wider text-[11px]">
                  Explore
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ServiceInquiryModal isOpen={modalOpen} onClose={() => setModalOpen(false)} service={service} selectedPackage={selectedPackage} />
    </div>
  );
};

export default ServiceDetailPage;
