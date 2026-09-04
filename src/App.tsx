import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import { CustomCursor } from './components/CustomCursor';
import { PWAModal } from './components/PWAModal';
import { ProjectInquiryModal } from './components/ProjectInquiryModal';
import { ToolRunnerModal } from './components/ToolRunnerModal';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { usePWA } from './hooks/usePWA';

// Views
import { ServicesView } from './views/services/ServicesView';
import { PortfolioView } from './views/portfolio/PortfolioView';
import { FreeToolsView } from './views/tools/FreeToolsView';
import { AIToolsView } from './views/ai-tools/AIToolsView';
import { ContactView } from './views/contact/ContactView';
import { AboutView } from './views/about/AboutView';
import { LegalView } from './views/policy/LegalView';

// Home Sections
import { Hero } from './sections/Hero';
import { HeroTransition } from './sections/HeroTransition';
import { ServicesSection } from './sections/ServicesSection';
import { PortfolioSection } from './sections/PortfolioSection';
import { ToolsSection } from './sections/ToolsSection';
import { AIToolsSection } from './sections/AIToolsSection';
import { ProcessSection } from './sections/ProcessSection';
import { WhyBranifySection } from './sections/WhyBranifySection';
import { StatsSection } from './sections/StatsSection';
import { TestimonialsSection } from './sections/TestimonialsSection';
import { FAQSection } from './sections/FAQSection';
import { CTASection } from './sections/CTASection';
import { Footer } from './sections/Footer';
import { Project, DigitalTool } from './types';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname + window.location.search || '/';
    }
    return '/';
  });

  const [inquiryModalOpen, setInquiryModalOpen] = useState<boolean>(false);
  const [selectedServiceForInquiry, setSelectedServiceForInquiry] = useState<string | undefined>();
  const [activeToolRunner, setActiveToolRunner] = useState<DigitalTool | null>(null);
  const [activeProjectDetail, setActiveProjectDetail] = useState<Project | null>(null);

  // PWA Hook
  const {
    isInstallable,
    isInstalled,
    isModalOpen: pwaModalOpen,
    openModal: openPWAModal,
    closeModal: closePWAModal,
    triggerInstall: triggerPWAInstall,
  } = usePWA();

  // Listen to browser forward/backward
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname + window.location.search || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentRoute(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenInquiry = (serviceId?: string) => {
    setSelectedServiceForInquiry(serviceId);
    setInquiryModalOpen(true);
  };

  const handleSelectService = (serviceId: string) => {
    navigateTo(`/services?category=${serviceId}`);
  };

  const handleSelectProject = (project: Project) => {
    setActiveProjectDetail(project);
  };

  const handleRunTool = (tool: DigitalTool) => {
    setActiveToolRunner(tool);
  };

  const handleExploreWork = () => {
    navigateTo('/portfolio');
  };

  // Route parsing
  const pathname = currentRoute.split('?')[0] || '/';
  const queryParams = new URLSearchParams(currentRoute.split('?')[1] || '');

  // Helper to map route slugs (like /services/website-development) to service ids
  const resolveServiceId = (slug?: string | null): string | undefined => {
    if (!slug) return undefined;
    const clean = slug.toLowerCase().trim();
    const map: Record<string, string> = {
      'website-development': 'web-dev',
      'web-development': 'web-dev',
      'web-dev': 'web-dev',
      'ui-ux': 'ui-ux',
      'ui-ux-design': 'ui-ux',
      'uiux': 'ui-ux',
      'ecommerce': 'ecommerce',
      'e-commerce': 'ecommerce',
      'branding': 'branding',
      'brand-identity': 'branding',
      'digital-marketing': 'digital-marketing',
      'seo': 'seo',
      'search-engine-optimization': 'seo',
      'ai-solutions': 'ai-solutions',
      'ai-automation': 'ai-solutions',
      'automation': 'automation',
      'software-dev': 'software-dev',
      'software-development': 'software-dev',
      'social-media': 'social-media',
      'social-media-management': 'social-media',
      'business-consultation': 'web-dev',
    };
    return map[clean] || clean;
  };

  return (
    <div className="relative min-h-screen bg-[#08090B] text-[#E6E1D6] selection:bg-[#D4AF37]/30 selection:text-[#FFF5DC] font-sans flex flex-col justify-between">
      {/* Luxury Custom Cursor follower */}
      <CustomCursor />

      {/* Primary Header with Announcement Bar & Dropdowns */}
      <Header
        currentRoute={currentRoute}
        onNavigate={navigateTo}
        onOpenInquiry={() => handleOpenInquiry()}
        onOpenPWA={openPWAModal}
      />

      {/* Main View Router */}
      <main className="flex-1 relative">
        {(pathname === '/services' || pathname.startsWith('/services/')) && (
          <ServicesView
            onStartInquiry={(serviceId) => handleOpenInquiry(serviceId)}
            onNavigateHome={() => navigateTo('/')}
            initialCategory={
              resolveServiceId(
                pathname.startsWith('/services/')
                  ? pathname.replace('/services/', '').split('/')[0]
                  : queryParams.get('category')
              )
            }
          />
        )}

        {(pathname === '/portfolio' || pathname.startsWith('/portfolio/')) && (
          <PortfolioView
            onSelectProject={handleSelectProject}
            onStartInquiry={(cat) => handleOpenInquiry(cat)}
            onNavigateHome={() => navigateTo('/')}
            initialProjectId={
              pathname.startsWith('/portfolio/')
                ? pathname.replace('/portfolio/', '').split('/')[0]
                : queryParams.get('project')
            }
          />
        )}

        {(pathname === '/free-tools' || pathname === '/tools' || pathname.startsWith('/tools/')) && (
          <FreeToolsView
            onRunToolModal={handleRunTool}
            onNavigateHome={() => navigateTo('/')}
            initialToolId={queryParams.get('tool')}
          />
        )}

        {(pathname === '/ai-tools' || pathname.startsWith('/ai-tools/')) && (
          <AIToolsView
            onStartInquiry={(cat) => handleOpenInquiry(cat)}
            onNavigateHome={() => navigateTo('/')}
            initialToolId={queryParams.get('tool')}
          />
        )}

        {pathname === '/pricing' && (
          <ServicesView
            onStartInquiry={(serviceId) => handleOpenInquiry(serviceId)}
            onNavigateHome={() => navigateTo('/')}
          />
        )}

        {pathname === '/contact' && (
          <ContactView onNavigateHome={() => navigateTo('/')} />
        )}

        {pathname === '/about' && (
          <AboutView
            onStartInquiry={() => handleOpenInquiry()}
            onNavigateHome={() => navigateTo('/')}
          />
        )}

        {(pathname === '/privacy' ||
          pathname === '/terms' ||
          pathname === '/refund' ||
          pathname === '/cookies' ||
          pathname === '/disclaimer') && (
          <LegalView
            onNavigateHome={() => navigateTo('/')}
            initialTab={pathname.replace('/', '') as 'privacy' | 'terms' | 'refund' | 'cookies' | 'disclaimer'}
          />
        )}

        {/* Homepage Single-View Experience when pathname === '/' */}
        {pathname === '/' && (
          <div>
            {/* 1. Hero Experience with 3D Cosmic Particle Dome & Horizon */}
            <Hero
              onStartProject={() => handleOpenInquiry()}
              onExploreWork={handleExploreWork}
            />

            {/* 2. Hero Editorial Transition Statement */}
            <HeroTransition />

            {/* 3. Specialized Digital Services (01 to 10) */}
            <ServicesSection onSelectService={handleSelectService} />

            {/* 4. Selected Work / Portfolio Case Studies */}
            <PortfolioSection
              onSelectProject={handleSelectProject}
              onViewAllWork={handleExploreWork}
            />

            {/* 5. Free Digital Tools Ecosystem */}
            <ToolsSection onRunTool={handleRunTool} />

            {/* 6. AI Powered Tools Showcase */}
            <AIToolsSection onOpenInquiry={(cat) => handleOpenInquiry(cat)} />

            {/* 7. 5-Phase Process Timeline */}
            <ProcessSection />

            {/* 8. Why Choose Branify Editorial Value Pillars */}
            <WhyBranifySection />

            {/* 9. Verified Precision Stats Counter Strip */}
            <StatsSection />

            {/* 10. Client Feedback & Executive Testimonials */}
            <TestimonialsSection />

            {/* 11. Frequently Asked Questions Accordion */}
            <FAQSection />

            {/* 12. Final Cinematic CTA Banner */}
            <CTASection
              onStartProject={() => handleOpenInquiry()}
              onViewWork={handleExploreWork}
            />
          </div>
        )}
      </main>

      {/* Global Footer */}
      <Footer
        onNavigate={navigateTo}
        onOpenPWA={openPWAModal}
        isPWAInstalled={isInstalled}
      />

      {/* Interactive Modals */}
      <PWAModal
        isOpen={pwaModalOpen}
        onClose={closePWAModal}
        onNativeInstall={triggerPWAInstall}
        isInstallable={isInstallable}
      />

      <ProjectInquiryModal
        isOpen={inquiryModalOpen}
        onClose={() => setInquiryModalOpen(false)}
        initialService={selectedServiceForInquiry}
      />

      <ToolRunnerModal
        isOpen={!!activeToolRunner}
        tool={activeToolRunner}
        onClose={() => setActiveToolRunner(null)}
      />

      <ProjectDetailModal
        isOpen={!!activeProjectDetail}
        project={activeProjectDetail}
        onClose={() => setActiveProjectDetail(null)}
        onStartInquiry={(category) => handleOpenInquiry(category)}
      />
    </div>
  );
}
