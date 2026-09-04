import React, { useState, useEffect, Suspense, lazy } from 'react';
import Header from './components/Header';
import { CustomCursor } from './components/CustomCursor';
import { PWAModal } from './components/PWAModal';
import { ProjectInquiryModal } from './components/ProjectInquiryModal';
import { ToolRunnerModal } from './components/ToolRunnerModal';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { usePWA } from './hooks/usePWA';
import { trackEvent, trackNotFound } from './lib/track';
import { getSeoOverride, getRedirectTarget } from './lib/contentOverrides';

// Views
import { ServicesView } from './views/services/ServicesView';
import ServiceDetailPage from './views/services/ServiceDetailPage';
import { PortfolioView } from './views/portfolio/PortfolioView';
import FreeToolsView from './views/tools/FreeToolsView';
import ToolPageView from './views/tools/ToolPageView';
import { AIToolsView } from './views/ai-tools/AIToolsView';
import { ContactView } from './views/contact/ContactView';
import { AboutView } from './views/about/AboutView';
import { LegalPageView, LEGACY_LEGAL_REDIRECTS } from './views/policy/LegalPageView';
import { FreeTemplatesView } from './views/templates/FreeTemplatesView';
import { FreeTemplateDetailPage } from './views/templates/FreeTemplateDetailPage';
import { BlogIndex, BlogPostPage } from './views/blog/BlogView';
import { NotFoundView } from './views/NotFoundView';
import { WhatsAppFab } from './components/WhatsAppFab';
import { freeTemplates } from './data/freeTemplatesRegistry';

// Admin dashboard — lazy-loaded, never downloaded by public pages
const AdminApp = lazy(() => import('./admin/AdminApp'));

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

// Known public SPA routes (everything else → 404 view + monitor log)
const PUBLIC_ROUTE_PREFIXES = [
  '/', '/services', '/portfolio', '/tools', '/free-tools', '/ai-tools', '/pricing',
  '/contact', '/about', '/privacypolicy', '/termsandconditions', '/refundpolicy',
  '/cookiespolicy', '/disclaimer', '/free-templates', '/blog', '/admin',
];
function isKnownRoute(pathname: string): boolean {
  return PUBLIC_ROUTE_PREFIXES.some((p) => (p === '/' ? pathname === '/' : pathname === p || pathname.startsWith(`${p}/`)));
}

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

  // Admin SEO overrides (priority #1) — applied on EVERY route change AFTER the
  // views' own <Seo>/document.title effects, so an override always wins. Pages
  // without a <Seo> mount (About, Contact, Portfolio, tool pages…) are covered
  // too. No-op when no override exists for the path.
  useEffect(() => {
    try {
      const path = window.location.pathname;
      const ov = getSeoOverride(path);
      if (!ov) return;
      if (ov.title) document.title = ov.title;
      if (ov.description) {
        document.querySelector('meta[name="description"]')?.setAttribute('content', ov.description);
        document.querySelector('meta[property="og:description"]')?.setAttribute('content', ov.description);
        document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', ov.description);
      }
      if (ov.ogImage) {
        document.querySelector('meta[property="og:image"]')?.setAttribute('content', ov.ogImage);
        document.querySelector('meta[name="twitter:image"]')?.setAttribute('content', ov.ogImage);
      }
      if (ov.robots) {
        document.querySelector('meta[name="robots"]')?.setAttribute('content', ov.robots.replace(/,\s*/g, ', '));
      }
    } catch { /* overrides are optional */ }
  }, [currentRoute]);

  // Redirects (legacy aliases + admin Redirect Manager) then 404 logging.
  // A path that matches an active admin redirect is rewritten in place
  // (replaceState — 301-style: no extra history entry) and never counts as 404.
  useEffect(() => {
    const [path] = currentRoute.split('?');
    if (!path) return;
    const target = LEGACY_LEGAL_REDIRECTS[path] || getRedirectTarget(path);
    if (target && target !== path) {
      const search = window.location.search || '';
      window.history.replaceState({}, '', `${target}${search}`);
      setCurrentRoute(`${target}${search}`);
      return;
    }
    if (path !== '/' && !isKnownRoute(path)) trackNotFound(path);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoute]);
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
    trackEvent('tool_launch', { tool: tool.id, name: tool.name });
    setActiveToolRunner(tool);
  };

  const handleExploreWork = () => {
    navigateTo('/portfolio');
  };

  // Route parsing
  const pathname = currentRoute.split('?')[0] || '/';
  const queryParams = new URLSearchParams(currentRoute.split('?')[1] || '');
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const isKnown = isKnownRoute(pathname);

  return (
    <div className="relative min-h-screen bg-[#08090B] text-[#E6E1D6] selection:bg-[#D4AF37]/30 selection:text-[#FFF5DC] font-sans flex flex-col justify-between">
      {/* Admin app — full control surface, replaces the public chrome entirely */}
      {isAdminRoute && (
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center bg-[#020407]">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#C9A45C]">Loading admin…</span>
            </div>
          }
        >
          <AdminApp />
        </Suspense>
      )}

      {!isAdminRoute && (
        <>
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

        {/* Legal pages — dedicated page per policy at owner-requested URLs */}
        {(pathname === '/privacypolicy' ||
          pathname === '/termsandconditions' ||
          pathname === '/refundpolicy' ||
          pathname === '/cookiespolicy' ||
          pathname === '/disclaimer') && (
          <LegalPageView docPath={pathname} onNavigateHome={() => navigateTo('/')} />
        )}

        {/* Free Templates directory + category/slug detail pages */}
        {pathname === '/free-templates' && (
          <FreeTemplatesView onNavigate={navigateTo} initialCategory={queryParams.get('category') || undefined} />
        )}

        {pathname.startsWith('/free-templates/') &&
          (() => {
            const seg = decodeURIComponent(pathname.replace('/free-templates/', '').split('/')[0]);
            const asSlug = freeTemplates.find((t) => t.slug === seg);
            if (asSlug) {
              return <FreeTemplateDetailPage slug={asSlug.slug} onNavigate={navigateTo} />;
            }
            return <FreeTemplatesView onNavigate={navigateTo} initialCategory={seg} />;
          })()}

        {/* Insights Blog */}
        {pathname === '/blog' && <BlogIndex onNavigate={navigateTo} />}

        {pathname.startsWith('/blog/') && (
          <BlogPostPage
            slug={decodeURIComponent(pathname.replace('/blog/', '').split('/')[0])}
            onNavigate={navigateTo}
          />
        )}

        {/* Admin Portal — protected, lazy-loaded control center (rendered above as a full-screen app) */}

        {/* Unknown routes → real 404 page */}
        {!isKnown && (
          <NotFoundView
            path={pathname}
            onNavigateHome={() => navigateTo('/')}
            onExploreTools={() => navigateTo('/tools')}
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

      {/* Floating WhatsApp chat button (app-wide, like live) */}
      <WhatsAppFab />

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
        </>
      )}
    </div>
  );
}
