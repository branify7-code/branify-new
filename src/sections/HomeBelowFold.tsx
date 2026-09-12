/* =========================================================
   HomeBelowFold — homepage sections 4–13 in one lazy chunk.
   Split out of App.tsx so the main bundle only carries the
   above-fold experience (Hero / HeroTransition / Services).
   Everything here renders below the fold on '/' and is never
   downloaded by any other route.
========================================================= */

import React from 'react';
import { TemplatesSection } from './TemplatesSection';
import { PortfolioSection } from './PortfolioSection';
import { ToolsSection } from './ToolsSection';
import { AIToolsSection } from './AIToolsSection';
import { ProcessSection } from './ProcessSection';
import { WhyBranifySection } from './WhyBranifySection';
import { StatsSection } from './StatsSection';
import { TestimonialsSection } from './TestimonialsSection';
import { FAQSection } from './FAQSection';
import { CTASection } from './CTASection';
import type { Project } from '../types';

interface HomeBelowFoldProps {
  onNavigate: (path: string) => void;
  onSelectProject: (project: Project) => void;
  onViewAllWork: () => void;
  onStartProject: () => void;
}

export const HomeBelowFold: React.FC<HomeBelowFoldProps> = ({
  onNavigate,
  onSelectProject,
  onViewAllWork,
  onStartProject,
}) => {
  return (
    <>
      {/* 4. Website Template Library showcase — featured from central registry */}
      <TemplatesSection onNavigate={onNavigate} />

      {/* 5. Selected Work / Portfolio Case Studies */}
      <PortfolioSection
        onSelectProject={onSelectProject}
        onViewAllWork={onViewAllWork}
      />

      {/* 6. Free Digital Tools Ecosystem — mirrors the /tools page */}
      <ToolsSection onNavigate={onNavigate} />

      {/* 7. AI Powered Tools Showcase — mirrors the /ai-tools page */}
      <AIToolsSection onNavigate={onNavigate} />

      {/* 8. 5-Phase Process Timeline */}
      <ProcessSection />

      {/* 9. Why Choose Branify Editorial Value Pillars */}
      <WhyBranifySection />

      {/* 10. Verified Precision Stats Counter Strip */}
      <StatsSection />

      {/* 11. Client Feedback & Executive Testimonials */}
      <TestimonialsSection />

      {/* 12. Frequently Asked Questions Accordion */}
      <FAQSection />

      {/* 13. Final Cinematic CTA Banner */}
      <CTASection
        onStartProject={onStartProject}
        onViewWork={onViewAllWork}
      />
    </>
  );
};

export default HomeBelowFold;
