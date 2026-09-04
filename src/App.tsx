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
import ServiceDetailPage from './views/services/ServiceDetailPage';
import { PortfolioView } from './views/portfolio/PortfolioView';
import FreeToolsView from './views/tools/FreeToolsView';
import ToolPageView from './views/tools/ToolPageView';
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

  // Legacy ?tool=<id> deep links (pre-136-tool era) → redirect to the matching real tool page
  useEffect(() => {
    const legacyToolMap: Record<string, string> = {
      'pdf-tools': 'pdf-merge-planner',
      'image-compressor': 'image-compressor',
      'meta-generator': 'meta-title-description-gen',
      'json-formatter': 'json-formatter-dev',
      'word-counter': 'word-counter',
      'text-formatter': 'case-converter',
      'password-gen': 'password-generator',
      'qr-gen': 'qr-code-generator',
      'color-converter': 'color-hex-rgb-converter',
    };
    const [path, search] = currentRoute.split('?');
    if (path === '/tools' || path === '/free-tools') {
      const legacyId = new URLSearchParams(search || '').get('tool');
      const mapped = legacyId ? legacyToolMap[legacyId] : undefined;
      if (mapped) navigateTo(`/tools/${mapped}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoute]);

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
        {pathname === '/services' && (
          <ServicesView onNavigate={navigateTo} initialCategory={queryParams.get('category')} />
        )}

        {pathname.startsWith('/services/') && (
          <ServiceDetailPage
            slug={decodeURIComponent(pathname.replace('/services/', '').split('/')[0])}
            onNavigate={navigateTo}
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

        {(pathname === '/free-tools' || pathname === '/tools') && (
          <FreeToolsView
            onNavigate={navigateTo}
            initialCategory={queryParams.get('category')}
            onOpenPWA={openPWAModal}
          />
        )}

        {(pathname.startsWith('/tools/') || pathname.startsWith('/free-tools/')) && (
          <ToolPageView
            slug={decodeURIComponent(
              (pathname.startsWith('/tools/')
                ? pathname.replace('/tools/', '')
                : pathname.replace('/free-tools/', '')
              ).split('/')[0]
            )}
            onNavigate={navigateTo}
          />
        )}

        {(pathname === '/ai-tools' || pathname.startsWith('/ai-tools/')) && <AIToolsView />}

        {pathname === '/pricing' && <ServicesView onNavigate={navigateTo} />}

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
