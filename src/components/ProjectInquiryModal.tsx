import React, { useState } from 'react';
import { X, CheckCircle, ArrowRight, Sparkles, Send } from 'lucide-react';
import { servicesData } from '../data/services';
import { supabase } from '../lib/supabase';
import { mirrorLeadToPreview } from '../lib/leadCapture';
import { trackEvent } from '../lib/track';

interface ProjectInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialService?: string;
}

export const ProjectInquiryModal: React.FC<ProjectInquiryModalProps> = ({
  isOpen,
  onClose,
  initialService,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedServices, setSelectedServices] = useState<string[]>(
    initialService ? [initialService] : ['web-dev']
  );
  const [budget, setBudget] = useState('$25k — $50k');
  const [timeline, setTimeline] = useState('1–2 Months');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    projectDetails: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const inquiryRecord = {
        name: formData.name,
        email: formData.email,
        company: formData.company,
        services: selectedServices,
        budget,
        timeline,
        details: formData.projectDetails,
        source: 'inquiry_modal',
        created_at: new Date().toISOString()
      };
      await supabase.from('inquiries').insert([inquiryRecord]);
      mirrorLeadToPreview(inquiryRecord);
    } catch (err) {
      console.log('Supabase inquiry note:', err);
    }
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      trackEvent('lead_submit', { services: selectedServices, budget, source: 'inquiry_modal' });
    }, 800);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setStep(1);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/80 backdrop-blur-xl animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-inquiry-title"
    >
      <div
        className="relative w-full max-w-3xl bg-[#0F1015] border border-[#D4AF37]/30 rounded-2xl p-6 md:p-10 shadow-[0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle background ambient gold glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          id="close-inquiry-modal-btn"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full border border-white/10 hover:border-[#D4AF37]/50 text-[#F1F2EE]/60 hover:text-[#F1F2EE] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          <div className="py-12 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-2xl md:text-3xl font-bold text-[#FFF5DC]">
                Project Brief Received
              </h3>
              <p className="text-[#F1F2EE]/60 text-sm md:text-base max-w-md mx-auto">
                Thank you, {formData.name || 'valued partner'}. Our strategic team will review your requirements and respond within 24 hours with an actionable roadmap.
              </p>
            </div>
            <div className="pt-4">
              <button
                id="done-inquiry-btn"
                onClick={handleReset}
                className="px-8 py-3 rounded-full bg-[#D4AF37] hover:bg-[#E5C378] text-[#05080D] font-semibold text-sm tracking-wide transition-all shadow-[0_0_25px_rgba(212,175,55,0.3)]"
              >
                Close & Return
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="mb-8 space-y-2">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#D4AF37]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Branify Strategic Consultation</span>
              </div>
              <h2 id="modal-inquiry-title" className="font-display text-2xl md:text-3xl font-bold text-[#FFF5DC]">
                Start a New Project
              </h2>
              <p className="text-[#F1F2EE]/60 text-sm">
                Step {step} of 3 — {step === 1 ? 'Select Capabilities' : step === 2 ? 'Budget & Timeline' : 'Project & Contact Details'}
              </p>
            </div>

            {/* Step 1: Capabilities Selection */}
            {step === 1 && (
              <div className="space-y-6">
                <p className="text-xs uppercase tracking-widest text-[#F1F2EE]/50">
                  Select all services relevant to your vision:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {servicesData.map((svc) => {
                    const active = selectedServices.includes(svc.id);
                    return (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => toggleService(svc.id)}
                        className={`p-3 rounded-xl text-left border transition-all text-xs flex flex-col justify-between h-20 ${
                          active
                            ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#FFF5DC] shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                            : 'border-white/10 bg-white/[0.02] text-[#F1F2EE]/70 hover:border-white/20'
                        }`}
                      >
                        <span className="font-mono text-[10px] text-[#F1F2EE]/40">{svc.number}</span>
                        <span className="font-medium truncate">{svc.title}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    id="step1-next-btn"
                    onClick={() => setStep(2)}
                    disabled={selectedServices.length === 0}
                    className="px-6 py-3 rounded-full bg-[#D4AF37] hover:bg-[#E5C378] disabled:opacity-40 disabled:cursor-not-allowed text-[#05080D] font-semibold text-sm tracking-wide flex items-center gap-2 transition-all"
                  >
                    <span>Next: Parameters</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Budget & Timeline */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#F1F2EE]/50 mb-3">
                    Anticipated Investment Range
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {['$10k — $25k', '$25k — $50k', '$50k — $100k', '$100k+'].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBudget(b)}
                        className={`p-3 rounded-xl border text-xs font-medium text-center transition-all ${
                          budget === b
                            ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#FFF5DC]'
                            : 'border-white/10 bg-white/[0.02] text-[#F1F2EE]/70 hover:border-white/20'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#F1F2EE]/50 mb-3">
                    Target Deployment Timeline
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {['Fast Sprint (2–4 Wks)', '1–2 Months', 'Flexible / Multi-Phase'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTimeline(t)}
                        className={`p-3 rounded-xl border text-xs font-medium text-center transition-all ${
                          timeline === t
                            ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#FFF5DC]'
                            : 'border-white/10 bg-white/[0.02] text-[#F1F2EE]/70 hover:border-white/20'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    id="step2-back-btn"
                    onClick={() => setStep(1)}
                    className="px-5 py-2.5 rounded-full border border-white/20 text-[#F1F2EE]/70 hover:text-[#F1F2EE] text-xs"
                  >
                    Back
                  </button>
                  <button
                    id="step2-next-btn"
                    onClick={() => setStep(3)}
                    className="px-6 py-3 rounded-full bg-[#D4AF37] hover:bg-[#E5C378] text-[#05080D] font-semibold text-sm tracking-wide flex items-center gap-2 transition-all"
                  >
                    <span>Next: Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Contact & Project Details */}
            {step === 3 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#F1F2EE]/60 mb-1">Your Name *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Julian Hayes"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-[#D4AF37] focus:outline-none text-[#F1F2EE] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#F1F2EE]/60 mb-1">Work Email *</label>
                    <input
                      required
                      type="email"
                      placeholder="julian@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-[#D4AF37] focus:outline-none text-[#F1F2EE] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[#F1F2EE]/60 mb-1">Company / Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Luxury Ltd."
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-[#D4AF37] focus:outline-none text-[#F1F2EE] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#F1F2EE]/60 mb-1">Project Objectives & Scope</label>
                  <textarea
                    rows={3}
                    placeholder="Tell us about what you are aiming to build, key challenges, or existing benchmarks..."
                    value={formData.projectDetails}
                    onChange={(e) => setFormData({ ...formData, projectDetails: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-[#D4AF37] focus:outline-none text-[#F1F2EE] text-sm resize-none"
                  />
                </div>

                <div className="pt-4 flex justify-between items-center">
                  <button
                    id="step3-back-btn"
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 rounded-full border border-white/20 text-[#F1F2EE]/70 hover:text-[#F1F2EE] text-xs"
                  >
                    Back
                  </button>
                  <button
                    id="submit-inquiry-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 rounded-full bg-[#D4AF37] hover:bg-[#E5C378] text-[#05080D] font-semibold text-sm tracking-wide flex items-center gap-2 transition-all shadow-[0_0_25px_rgba(212,175,55,0.3)] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Dispatching Brief...</span>
                    ) : (
                      <>
                        <span>Submit Project Brief</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
