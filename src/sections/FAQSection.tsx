import React, { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { faqsData } from '../data/faqs';

export const FAQSection: React.FC = () => {
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="faq" className="relative py-28 sm:py-36 bg-[#0B0C10] text-white overflow-hidden border-t border-white/[0.06]">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-mesh-radial pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-3 mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-[#D4AF37]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>// Clarity & Advisory</span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-[#FFF5DC]">
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg text-white/60 font-light max-w-xl mx-auto">
            Everything you need to know about our engagement models, technical standards, and delivery pipeline.
          </p>
        </div>

        {/* Accordion Stack */}
        <div className="space-y-4">
          {faqsData.map((faq) => {
            const isOpen = openFaqId === faq.id;

            return (
              <div
                key={faq.id}
                id={`faq-item-${faq.id}`}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? 'bg-[#0E0F14] border-[#D4AF37]/50 shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
                    : 'bg-[#0E0F14]/50 border-white/[0.08] hover:border-white/20'
                }`}
              >
                <button
                  type="button"
                  id={`faq-toggle-${faq.id}`}
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="font-display text-lg sm:text-xl font-bold text-[#FFF5DC]">
                    {faq.question}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
                      isOpen
                        ? 'bg-[#D4AF37] text-[#08090B] rotate-180'
                        : 'bg-white/5 text-white/60'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-0 text-sm sm:text-base text-white/70 font-light leading-relaxed border-t border-white/[0.04] animate-fade-in">
                    <p className="pt-4">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
