import React, { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { faqsData } from '../data/faqs';

export const FAQSection: React.FC = () => {
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="faq" className="relative py-28 sm:py-36 bg-white text-[#111827] overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-mesh-radial pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-[420px] h-[360px] bg-[#EEF2FF] rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="eyebrow-label justify-center">
            <Sparkles className="w-3.5 h-3.5" />
            <span>// Clarity & Advisory</span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-[-0.03em] text-[#111827]">
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg text-[#64748B] max-w-xl mx-auto leading-relaxed">
            Everything you need to know about our engagement models, technical standards, and delivery pipeline.
          </p>
        </div>

        {/* Editorial Accordion — full-width rows divided by hairlines, no boxed cards */}
        <div className="divide-y divide-[#E2E8F0] border-y border-[#E2E8F0]">
          {faqsData.map((faq) => {
            const isOpen = openFaqId === faq.id;

            return (
              <div
                key={faq.id}
                id={`faq-item-${faq.id}`}
                className="transition-all duration-300"
              >
                <button
                  type="button"
                  id={`faq-toggle-${faq.id}`}
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full py-6 text-left flex items-center justify-between gap-6 cursor-pointer group"
                  aria-expanded={isOpen}
                >
                  <span
                    className={`font-display text-lg sm:text-xl font-bold transition-colors ${
                      isOpen ? 'text-[#8F6B2D]' : 'text-[#111827] group-hover:text-[#334155]'
                    }`}
                  >
                    {faq.question}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
                      isOpen
                        ? 'bg-[#C9A45C]/10 text-[#8F6B2D] border border-[#C9A45C]/30 rotate-180'
                        : 'bg-white text-[#64748B] border border-[#E2E8F0] group-hover:border-[#C9A45C]/40 group-hover:text-[#8F6B2D]'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="pb-6 pr-10 sm:pr-16 text-sm sm:text-base text-[#475569] leading-relaxed animate-fade-in">
                    <p>{faq.answer}</p>
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
