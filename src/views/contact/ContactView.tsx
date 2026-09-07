import React, { useEffect, useState } from 'react';
import { 
  Send, Sparkles, CheckCircle2, MessageSquare, 
  Clock, ShieldCheck, Mail, MapPin, Phone, ArrowRight, Calendar
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { trackEvent } from '../../lib/track';
import { mirrorLeadToPreview } from '../../lib/leadCapture';
import { getTemplateBySlug, getCategoryBySlug } from '../../data/templates';

interface ContactViewProps {
  onNavigateHome: () => void;
}

export const ContactView: React.FC<ContactViewProps> = ({ onNavigateHome }) => {
  const [selectedServices, setSelectedServices] = useState<string[]>(['Web Development']);
  const [selectedBudget, setSelectedBudget] = useState<string>('$15k – $35k');
  const [selectedTimeline, setSelectedTimeline] = useState<string>('1 – 2 Months');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lead capture context: /contact?template=<slug> (template detail CTA),
  // /contact?category=<slug> (category "Request Custom Design") or
  // /contact?source=… (library/home CTAs). Prefills the message so the
  // sales inbox knows exactly which template the lead is interested in.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const templateSlug = params.get('template');
      const categorySlug = params.get('category');
      if (templateSlug) {
        const t = getTemplateBySlug(templateSlug);
        if (t) {
          setSelectedServices((prev) => (prev.includes('Web Development') ? prev : [...prev, 'Web Development']));
          setMessage(`I'd like to start with the "${t.name}" website template (${t.category}).\n\nPlease tailor it to my brand and share the next steps.`);
        }
      } else if (categorySlug) {
        const c = getCategoryBySlug(categorySlug);
        if (c) {
          setSelectedServices((prev) => (prev.includes('Web Development') ? prev : [...prev, 'Web Development']));
          setMessage(`I'm interested in a website for my ${c.name.toLowerCase()} business${categorySlug.endsWith('-food') || categorySlug === 'catering-services' ? '' : ''}. A template from your ${c.name} collection could be a great starting point.`);
        }
      }
    } catch { /* prefill is best-effort */ }
  }, []);

  const availableServices = [
    'Web Development',
    'UI / UX Design',
    'E-Commerce Store',
    'Branding & Identity',
    'AI Solutions & Agents',
    'Digital Marketing & SEO',
    'Mobile Application',
    'Cloud & DevOps'
  ];

  const budgetOptions = [
    '$5,000 – $15,000',
    '$15,000 – $35,000',
    '$35,000 – $75,000',
    '$75,000+ Enterprise'
  ];

  const timelineOptions = [
    'Immediate (Under 3 weeks)',
    '1 – 2 Months',
    '3 – 6 Months',
    'Flexible / Exploration'
  ];

  const toggleService = (service: string) => {
    if (selectedServices.includes(service)) {
      if (selectedServices.length > 1) {
        setSelectedServices(selectedServices.filter((s) => s !== service));
      }
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setIsSubmitting(true);

    try {
      const inquiryRecord = {
        name,
        email,
        company: company || 'Not specified',
        services: selectedServices,
        budget: selectedBudget,
        timeline: selectedTimeline,
        details: message || 'Direct Contact Form Inquiry',
        source: 'contact_form',
        created_at: new Date().toISOString()
      };
      await supabase.from('inquiries').insert([inquiryRecord]);
      mirrorLeadToPreview(inquiryRecord);
    } catch (err) {
      console.log('Supabase contact note:', err);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      trackEvent('contact_submit', { services: selectedServices, budget: selectedBudget, source: 'contact_form' });
    }, 800);
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      {/* Header Breadcrumbs & Hero Title */}
      <div className="space-y-6 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E2E8F0] shadow-[0_2px_10px_rgba(15,23,42,0.04)] text-xs font-mono text-[#8F6B2D]">
          <button 
            onClick={onNavigateHome} 
            className="text-[#64748B] hover:text-[#111827] transition-colors cursor-pointer"
          >
            Home
          </button>
          <span className="text-[#CBD5E1]">/</span>
          <span className="text-[#8F6B2D]">Consultation & Project Inquiry</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] leading-[1.08] text-[#111827]">
          Initiate Your <br />
          <span className="text-gold-gradient">Digital Sovereignity</span>
        </h1>

        <p className="text-sm sm:text-lg text-[#475569] font-light leading-relaxed">
          Tell us about your brand vision, architectural requirements, or upcoming product launch. Our senior leadership responds within 24 business hours.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Side: Interactive Multi-Step Form */}
        <div className="lg:col-span-8 rounded-3xl bg-white border border-[#E2E8F0] p-6 sm:p-10 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.15)]">
          {isSubmitted ? (
            <div className="text-center py-16 space-y-6 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-[#C9A45C]/10 border border-[#C9A45C]/40 text-[#8F6B2D] flex items-center justify-center mx-auto shadow-[0_10px_30px_-12px_rgba(201,164,92,0.45)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-widest text-[#8F6B2D]">
                  Inquiry Received & Logged
                </span>
                <h2 className="font-display text-3xl font-bold text-[#111827]">
                  Thank You, {name || 'Partner'}.
                </h2>
                <p className="text-sm text-[#475569] max-w-md mx-auto leading-relaxed">
                  Our principal technology team has received your project briefing. We are preparing a preliminary feasibility audit and will connect at <strong className="text-[#111827]">{email}</strong>.
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="px-6 py-3 rounded-xl bg-white border border-[#E2E8F0] text-xs font-mono text-[#334155] hover:border-[#5B5FEF]/50 hover:text-[#5B5FEF] transition-colors cursor-pointer shadow-[0_2px_10px_rgba(15,23,42,0.04)]"
                >
                  Submit Another Inquiry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Step 1: Services Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#8F6B2D]">
                  1. Select Capabilities Needed
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableServices.map((service) => {
                    const isSelected = selectedServices.includes(service);
                    return (
                      <button
                        type="button"
                        key={service}
                        onClick={() => toggleService(service)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-mono tracking-wider transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-[#5B5FEF] text-white font-bold border-[#5B5FEF] shadow-[0_8px_20px_-8px_rgba(91,95,239,0.55)]'
                            : 'bg-white text-[#475569] border-[#E2E8F0] hover:text-[#5B5FEF] hover:border-[#5B5FEF]/50'
                        }`}
                      >
                        {service}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Budget Brackets */}
              <div className="space-y-3">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#8F6B2D]">
                  2. Anticipated Investment Bracket
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {budgetOptions.map((budget) => (
                    <button
                      type="button"
                      key={budget}
                      onClick={() => setSelectedBudget(budget)}
                      className={`p-3 rounded-xl text-xs font-mono tracking-wider text-left transition-all cursor-pointer border ${
                        selectedBudget === budget
                          ? 'bg-[#EEF2FF] text-[#111827] font-bold border-[#5B5FEF]/60'
                          : 'bg-white text-[#475569] border-[#E2E8F0] hover:text-[#111827] hover:border-[#CBD5E1]'
                      }`}
                    >
                      {budget}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Target Timeline */}
              <div className="space-y-3">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#8F6B2D]">
                  3. Launch Timeline
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {timelineOptions.map((timeline) => (
                    <button
                      type="button"
                      key={timeline}
                      onClick={() => setSelectedTimeline(timeline)}
                      className={`p-3 rounded-xl text-xs font-mono tracking-wider text-left transition-all cursor-pointer border ${
                        selectedTimeline === timeline
                          ? 'bg-[#EEF2FF] text-[#111827] font-bold border-[#5B5FEF]/60'
                          : 'bg-white text-[#475569] border-[#E2E8F0] hover:text-[#111827] hover:border-[#CBD5E1]'
                      }`}
                    >
                      {timeline}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 4: Contact Details */}
              <div className="space-y-4 pt-4 border-t border-[#E2E8F0]">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#8F6B2D]">
                  4. Your Details & Brief
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-[#64748B]">Your Name *</label>
                    <input
                      required
                      type="text"
                      placeholder="Alexander Vance"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl input-light text-xs placeholder-[#94A3B8]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-[#64748B]">Work Email *</label>
                    <input
                      required
                      type="email"
                      placeholder="alexander@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl input-light text-xs placeholder-[#94A3B8]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#64748B]">Company / Organization (Optional)</label>
                  <input
                    type="text"
                    placeholder="Acme Innovations Corp"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl input-light text-xs placeholder-[#94A3B8]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#64748B]">Project Goals & Overview</label>
                  <textarea
                    rows={4}
                    placeholder="Provide a brief summary of the objectives, target audience, and key requirements..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-4 rounded-xl input-light text-xs placeholder-[#94A3B8] resize-none leading-relaxed"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] disabled:opacity-50 text-[#05080D] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_14px_30px_-12px_rgba(201,164,92,0.55)] transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Transmitting Brief...</span>
                ) : (
                  <>
                    <span>Submit Project Inquiry</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right Side: Studio Coordinates & Direct Links */}
        <div className="lg:col-span-4 space-y-6">
          {/* Direct Channels Card */}
          <div className="rounded-3xl bg-gradient-to-b from-[#F0F6FF] to-white border border-[#E2E8F0] p-6 sm:p-8 space-y-6">
            <h3 className="font-display text-lg font-bold text-[#111827]">
              Direct Contact Lines
            </h3>

            <div className="space-y-4 text-xs text-[#334155]">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#5B5FEF] shrink-0 shadow-sm">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">Direct Inquiries</span>
                  <a href="mailto:hello@branify.store" className="text-[#111827] hover:text-[#5B5FEF] font-mono transition-colors">
                    hello@branify.store
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#5B5FEF] shrink-0 shadow-sm">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">Operating SLA</span>
                  <span>Monday – Friday | 24-Hour Response</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#5B5FEF] shrink-0 shadow-sm">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">Confidentiality</span>
                  <span>Mutual NDA Executed on Request</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Schedule Call Simulation */}
          <div className="rounded-3xl bg-gradient-to-b from-[#EEF2FF] to-white border border-[#E2E8F0] p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-[#5B5FEF] text-xs font-mono uppercase">
              <Calendar className="w-4 h-4" />
              <span>Priority Discovery</span>
            </div>
            <h4 className="font-display text-base font-bold text-[#111827]">
              Prefer a Live Call?
            </h4>
            <p className="text-xs text-[#475569] leading-relaxed">
              Book an immediate 30-minute technical discovery call directly with our engineering lead.
            </p>
            <a
              href="mailto:consult@branify.store?subject=Schedule%20Discovery%20Call"
              className="block w-full text-center py-3 rounded-xl bg-white hover:border-[#5B5FEF]/50 hover:text-[#5B5FEF] border border-[#E2E8F0] text-xs font-mono uppercase tracking-wider text-[#334155] transition-all cursor-pointer shadow-[0_2px_10px_rgba(15,23,42,0.04)]"
            >
              Request Calendar Invite
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
