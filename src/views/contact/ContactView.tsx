import React, { useState } from 'react';
import { 
  Send, Sparkles, CheckCircle2, MessageSquare, 
  Clock, ShieldCheck, Mail, MapPin, Phone, ArrowRight, Calendar
} from 'lucide-react';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 800);
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      {/* Header Breadcrumbs & Hero Title */}
      <div className="space-y-4 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-[#D4AF37]/30 text-xs font-mono text-[#F3E5AB]">
          <button 
            onClick={onNavigateHome} 
            className="text-white/60 hover:text-[#FFF5DC] transition-colors cursor-pointer"
          >
            Home
          </button>
          <span className="text-white/30">/</span>
          <span className="text-[#D4AF37]">Consultation & Project Inquiry</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-[#FFF5DC]">
          Initiate Your <br />
          <span className="text-gold-gradient">Digital Sovereignity</span>
        </h1>

        <p className="text-sm sm:text-base text-white/65 font-light leading-relaxed">
          Tell us about your brand vision, architectural requirements, or upcoming product launch. Our senior leadership responds within 24 business hours.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Side: Interactive Multi-Step Form */}
        <div className="lg:col-span-8 rounded-3xl bg-[#0F1015] border border-[#D4AF37]/30 p-6 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          {isSubmitted ? (
            <div className="text-center py-16 space-y-6 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37] text-[#D4AF37] flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(212,175,55,0.4)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">
                  Inquiry Received & Logged
                </span>
                <h2 className="font-display text-3xl font-bold text-[#FFF5DC]">
                  Thank You, {name || 'Partner'}.
                </h2>
                <p className="text-sm text-white/70 max-w-md mx-auto leading-relaxed">
                  Our principal technology team has received your project briefing. We are preparing a preliminary feasibility audit and will connect at <strong className="text-[#FFF5DC]">{email}</strong>.
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-[#D4AF37] hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Submit Another Inquiry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Step 1: Services Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#D4AF37]">
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
                            ? 'bg-[#D4AF37] text-[#08090B] font-bold border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.3)]'
                            : 'bg-white/[0.03] text-white/70 border-white/10 hover:text-white hover:border-[#D4AF37]/40'
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
                <label className="block text-xs font-mono uppercase tracking-wider text-[#D4AF37]">
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
                          ? 'bg-[#D4AF37]/20 text-[#FFF5DC] font-bold border-[#D4AF37]'
                          : 'bg-white/[0.03] text-white/70 border-white/10 hover:text-white'
                      }`}
                    >
                      {budget}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Target Timeline */}
              <div className="space-y-3">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#D4AF37]">
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
                          ? 'bg-[#D4AF37]/20 text-[#FFF5DC] font-bold border-[#D4AF37]'
                          : 'bg-white/[0.03] text-white/70 border-white/10 hover:text-white'
                      }`}
                    >
                      {timeline}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 4: Contact Details */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#D4AF37]">
                  4. Your Details & Brief
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-white/60">Your Name *</label>
                    <input
                      required
                      type="text"
                      placeholder="Alexander Vance"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-white/30 focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-white/60">Work Email *</label>
                    <input
                      required
                      type="email"
                      placeholder="alexander@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-white/30 focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-white/60">Company / Organization (Optional)</label>
                  <input
                    type="text"
                    placeholder="Acme Innovations Corp"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-white/30 focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-white/60">Project Goals & Overview</label>
                  <textarea
                    rows={4}
                    placeholder="Provide a brief summary of the objectives, target audience, and key requirements..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-4 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-white/30 focus:border-[#D4AF37] focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] disabled:opacity-50 text-[#08090B] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all cursor-pointer"
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
          <div className="rounded-3xl bg-[#0F1015] border border-white/10 p-6 sm:p-8 space-y-6">
            <h3 className="font-display text-lg font-bold text-[#FFF5DC]">
              Direct Contact Lines
            </h3>

            <div className="space-y-4 text-xs text-white/80">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-[#D4AF37] shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-white/40 block">Direct Inquiries</span>
                  <a href="mailto:hello@branify.store" className="text-white hover:text-[#D4AF37] font-mono transition-colors">
                    hello@branify.store
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-[#D4AF37] shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-white/40 block">Operating SLA</span>
                  <span>Monday – Friday | 24-Hour Response</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-[#D4AF37] shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-white/40 block">Confidentiality</span>
                  <span>Mutual NDA Executed on Request</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Schedule Call Simulation */}
          <div className="rounded-3xl bg-gradient-to-b from-[#161720] to-[#0F1015] border border-[#D4AF37]/30 p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-mono uppercase">
              <Calendar className="w-4 h-4" />
              <span>Priority Discovery</span>
            </div>
            <h4 className="font-display text-base font-bold text-[#FFF5DC]">
              Prefer a Live Call?
            </h4>
            <p className="text-xs text-white/60 leading-relaxed font-light">
              Book an immediate 30-minute technical discovery call directly with our engineering lead.
            </p>
            <a
              href="mailto:consult@branify.store?subject=Schedule%20Discovery%20Call"
              className="block w-full text-center py-3 rounded-xl bg-white/5 hover:bg-[#D4AF37] hover:text-[#08090B] border border-white/15 text-xs font-mono uppercase tracking-wider text-white transition-all cursor-pointer"
            >
              Request Calendar Invite
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
