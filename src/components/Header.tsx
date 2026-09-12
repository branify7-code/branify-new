import React, { useState, useEffect, useRef } from "react";
import { useCurrency } from "../lib/currency";
import { templateCount, TEMPLATE_CATEGORIES, categoryCounts, categoryHref } from "../data/templates";
import {
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Smartphone,
  Search,
  ArrowRight,
  Globe,
  LayoutGrid,
  MousePointerClick,
  Figma,
  Palette,
  Sparkles,
  Share2,
  Presentation,
  Bot,
  TrendingUp,
  LogIn,
  LogOut,
  UserCircle,
  UserPlus,
} from "lucide-react";
import { useCustomerAuth } from "../lib/customerAuth";

export interface HeaderProps {
  currentRoute?: string;
  onNavigate?: (route: string) => void;
  onOpenInquiry?: (promoContext?: string) => void;
  onOpenPWA?: () => void;
}

interface AnnouncementMessage {
  id: string;
  spark: string;
  text: string;
  actionText: string;
  actionType: "inquiry" | "navigate";
  actionTarget: string;
  ctaText: string;
  ctaTarget: string;
}

const announcementMessages: AnnouncementMessage[] = [
  {
    id: "msg-1",
    spark: "✦",
    text: "SUMMER LAUNCH OFFER — GET 30% OFF ON WEBSITES & BRANDING",
    actionText: "CLAIM OFFER",
    actionType: "inquiry",
    actionTarget: "Promotion Code: BRANIFY2026",
    ctaText: "EXPLORE NOW",
    ctaTarget: "/contact",
  },
  {
    id: "msg-2",
    spark: "✦",
    text: "100+ FREE BROWSER UTILITIES RELEASED — NO SIGNUP REQUIRED",
    actionText: "EXPLORE TOOLS",
    actionType: "navigate",
    actionTarget: "/tools",
    ctaText: "EXPLORE NOW",
    ctaTarget: "/tools",
  },
  {
    id: "msg-3",
    spark: "✦",
    text: "FULL-STACK WEB APP FROM 100 AED — 1 YEAR DOMAIN + HOSTING INCLUDED",
    actionText: "CLAIM OFFER",
    actionType: "inquiry",
    actionTarget: "Package: 100 AED Full-Stack Web App",
    ctaText: "EXPLORE NOW",
    ctaTarget: "/services/website-development",
  },
];

/* =========================================================
   MENU DATA — mirrors the live branify.store header
========================================================= */

interface ServiceMenuItem {
  title: string;
  desc: string;
  icon: React.ElementType;
  route: string;
  badge?: string;
}

interface ServiceMenuGroup {
  heading: string;
  items: ServiceMenuItem[];
}

const serviceMenuGroups: ServiceMenuGroup[] = [
  {
    heading: "Website & Development",
    items: [
      {
        title: "Website Development",
        desc: "High-performance React, Next.js & full-stack apps",
        icon: Globe,
        route: "/services/website-development",
      },
      {
        title: "WordPress Development",
        desc: "Custom Elementor, WooCommerce & speed optimization",
        icon: LayoutGrid,
        route: "/services/wordpress-development",
      },
      {
        title: "Landing Pages",
        desc: "High-converting lead gen & launch pages",
        icon: MousePointerClick,
        route: "/services/landing-pages",
      },
    ],
  },
  {
    heading: "Design & Branding",
    items: [
      {
        title: "UI/UX Design",
        desc: "User research, wireframes & Figma prototypes",
        icon: Figma,
        route: "/services?category=ui-ux",
      },
      {
        title: "Logo Design",
        desc: "Memorable, modern & vector-perfect marks",
        icon: Palette,
        route: "/services/logo-design",
      },
      {
        title: "Brand Identity",
        desc: "Style guides, stationery & social kits",
        icon: Sparkles,
        route: "/services/brand-identity",
      },
      {
        title: "Social Media Design",
        desc: "Scroll-stopping Instagram, LinkedIn & ad creatives",
        icon: Share2,
        route: "/services/social-media-design",
      },
      {
        title: "Business Presentation",
        desc: "Investor pitch decks & corporate profiles",
        icon: Presentation,
        route: "/services/business-presentation",
      },
    ],
  },
  {
    heading: "Growth & Technology",
    items: [
      {
        title: "SEO (Search Engine Optimization)",
        desc: "Technical, on-page & keyword rankings",
        icon: Search,
        route: "/services?category=seo",
      },
      {
        title: "AI Solutions",
        desc: "Custom Gemini chatbots & LLM automation",
        icon: Bot,
        route: "/services?category=ai-solutions",
        badge: "HOT",
      },
      {
        title: "Business Consultation",
        desc: "1-on-1 strategy, tech audits & roadmaps",
        icon: TrendingUp,
        route: "/services/business-consultation",
      },
    ],
  },
];

interface PortfolioCategory {
  title: string;
  desc: string;
  route: string;
}

const portfolioCategories: PortfolioCategory[] = [
  {
    title: "All Projects",
    desc: "Browse our complete international portfolio",
    route: "/portfolio",
  },
  {
    title: "Web Development",
    desc: "React, Next.js & SaaS platforms",
    route: "/portfolio?category=web-development",
  },
  {
    title: "WordPress",
    desc: "Custom Elementor & WooCommerce stores",
    route: "/portfolio?category=wordpress",
  },
  {
    title: "UI/UX Design",
    desc: "Figma prototypes & design systems",
    route: "/portfolio?category=ui-ux-design",
  },
  {
    title: "Branding",
    desc: "Logo suites, guidelines & brand identities",
    route: "/portfolio?category=branding",
  },
  {
    title: "E-commerce",
    desc: "High-converting online store builds",
    route: "/portfolio?category=e-commerce",
  },
  {
    title: "AI Solutions",
    desc: "Custom chatbots & LLM integrations",
    route: "/portfolio?category=ai-solutions",
  },
  {
    title: "Marketing",
    desc: "SEO campaigns & direct-response pages",
    route: "/portfolio?category=marketing",
  },
];

interface ToolLink {
  label: string;
  route: string;
  badge?: string;
}

interface ToolColumn {
  heading: string;
  items: ToolLink[];
}

const toolsMenuColumns: ToolColumn[] = [
  {
    heading: "PDF Tools",
    items: [
      { label: "PDF Text Extractor", route: "/tools/pdf-to-text" },
      { label: "PDF Word Counter", route: "/tools/pdf-word-counter" },
      { label: "PDF Metadata Viewer", route: "/tools/pdf-metadata-viewer" },
      { label: "PDF Page Inspector", route: "/tools/pdf-page-counter" },
      { label: "PDF Merge Planner", route: "/tools/pdf-merge-planner" },
      { label: "PDF Size Estimator", route: "/tools/pdf-size-estimator" },
      { label: "PDF to Base64", route: "/tools/pdf-to-base64" },
    ],
  },
  {
    heading: "Image Tools",
    items: [
      { label: "Image Compressor", route: "/tools/image-compressor" },
      { label: "Image Resizer", route: "/tools/image-resizer" },
      { label: "WebP Converter", route: "/tools/image-converter-webp" },
      { label: "JPG to PNG", route: "/tools/jpg-to-png" },
      { label: "PNG to JPG", route: "/tools/png-to-jpg" },
      { label: "Favicon Generator", route: "/tools/favicon-generator" },
      { label: "QR Code Generator", route: "/tools/qr-code-generator" },
    ],
  },
  {
    heading: "SEO Tools",
    items: [
      { label: "Meta Title Generator", route: "/tools/meta-title-description-gen" },
      {
        label: "SERP Snippet Preview",
        route: "/tools/serp-snippet-preview",
      },
      { label: "Keyword Density Checker", route: "/tools/keyword-density-checker-seo" },
      { label: "Sitemap Generator", route: "/tools/sitemap-xml-generator-helper" },
      { label: "Robots.txt Generator", route: "/tools/robots-txt-generator" },
      { label: "Schema Generator", route: "/tools/schema-markup-organization" },
    ],
  },
  {
    heading: "Business Tools",
    items: [
      { label: "Invoice Generator", route: "/tools/invoice-generator", badge: "FREE" },
      { label: "Profit Calculator", route: "/tools/profit-margin-calculator" },
      { label: "ROI Calculator", route: "/tools/roi-calculator" },
      { label: "VAT Calculator", route: "/tools/vat-calculator" },
      { label: "Discount Calculator", route: "/tools/discount-calculator" },
      { label: "Percentage Calculator", route: "/tools/percentage-calculator" },
    ],
  },
  {
    heading: "Developer Tools",
    items: [
      { label: "JSON Formatter", route: "/tools/json-formatter-dev" },
      { label: "JSON Minifier", route: "/tools/json-minifier" },
      { label: "Base64 Encoder", route: "/tools/base64-encoder-decoder" },
      { label: "UUID Generator", route: "/tools/uuid-generator" },
      { label: "URL Encoder", route: "/tools/url-encoder-decoder" },
      { label: "JWT Decoder", route: "/tools/jwt-decoder-inspector" },
    ],
  },
  {
    heading: "Text Tools",
    items: [
      { label: "Word Counter", route: "/tools/word-counter" },
      { label: "Character Counter", route: "/tools/character-counter" },
      { label: "Case Converter", route: "/tools/case-converter" },
      { label: "Slug Generator", route: "/tools/slug-generator" },
      { label: "Lorem Ipsum Generator", route: "/tools/lorem-ipsum-generator" },
    ],
  },
];

interface Currency {
  code: string;
  flag: string;
  symbol: string;
  region: string;
}

const currencies: Currency[] = [
  { code: "PKR", flag: "🇵🇰", symbol: "Rs", region: "Pakistan" },
  { code: "USD", flag: "🇺🇸", symbol: "$", region: "United States" },
  { code: "AED", flag: "🇦🇪", symbol: "د.إ", region: "United Arab Emirates" },
  { code: "EUR", flag: "🇪🇺", symbol: "€", region: "European Union" },
  { code: "GBP", flag: "🇬🇧", symbol: "£", region: "United Kingdom" },
  { code: "SAR", flag: "🇸🇦", symbol: "﷼", region: "Saudi Arabia" },
  { code: "HKD", flag: "🇭🇰", symbol: "HK$", region: "Hong Kong" },
];

type OpenMenu = "services" | "templates" | "portfolio" | "tools" | null;

/* =========================================================
   BRAND LOGO MARK — gold "B" emblem (same as branify.store)
========================================================= */


/* =========================================================
   HEADER
======================================================== */

export default function Header({
  currentRoute = "/",
  onNavigate,
  onOpenInquiry,
  onOpenPWA,
}: HeaderProps) {
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMobileMenu, setOpenMobileMenu] = useState<string | null>(null);
  const [mobileRegionOpen, setMobileRegionOpen] = useState(false);
  // Currency is shared app-wide via lib/currency (synced with the services pages)
  const { currency: sharedCurrency, setCurrencyCode } = useCurrency();
  const currencyIndex = Math.max(0, currencies.findIndex((c) => c.code === sharedCurrency));
  const setCurrencyIndex = (idx: number) => {
    const code = currencies[idx]?.code;
    if (code) setCurrencyCode(code);
  };
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  // Customer authentication (public site) — separate from the admin portal
  const { user: customerUser, signOut: customerSignOut } = useCustomerAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const [announcementVisible, setAnnouncementVisible] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return sessionStorage.getItem("branify_announcement_closed") !== "true";
      } catch {
        return true;
      }
    }
    return true;
  });
  const [currentMsgIndex, setCurrentMsgIndex] = useState(0);
  const [announcementClosing, setAnnouncementClosing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const currencyMenuRef = useRef<HTMLDivElement>(null);

  const pathname = currentRoute.split("?")[0] || "/";
  const templateCategoryCounts = categoryCounts();
  const isAboutActive = pathname === "/about";
  const isHomeActive = pathname === "/";
  const isServicesActive =
    pathname === "/services" || pathname.startsWith("/services/");
  const isPortfolioActive =
    pathname === "/portfolio" || pathname.startsWith("/portfolio/");
  const isToolsActive =
    pathname === "/tools" ||
    pathname === "/free-tools" ||
    pathname.startsWith("/tools/");
  const isAiToolsActive =
    pathname === "/ai-tools" || pathname.startsWith("/ai-tools/");
  const isBlogActive =
    pathname === "/blog" || pathname.startsWith("/blog/");
  const isTemplatesActive =
    pathname === "/templates" || pathname.startsWith("/templates/");
  const isContactActive = pathname === "/contact";

  const currency = currencies[currencyIndex];
  const currentMsg = announcementMessages[currentMsgIndex];

  // Announcement rotation timer: 4.5 seconds per message, pauses on hover
  useEffect(() => {
    if (!announcementVisible || isHovered) return;

    const interval = setInterval(() => {
      setCurrentMsgIndex((prev) => (prev + 1) % announcementMessages.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [announcementVisible, isHovered]);

  // Clear pending close timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimer.current) {
        window.clearTimeout(closeTimer.current);
      }
    };
  }, []);

  // ESC closes menus, then dismisses the announcement bar (matches its tooltip)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (mobileOpen) {
          setMobileOpen(false);
          setOpenMobileMenu(null);
        } else if (currencyDropdownOpen) {
          setCurrencyDropdownOpen(false);
        } else if (announcementVisible) {
          handleCloseAnnouncement();
        } else {
          setOpenMenu(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileOpen, currencyDropdownOpen, announcementVisible]);

  // Close currency dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        currencyMenuRef.current &&
        !currencyMenuRef.current.contains(e.target as Node)
      ) {
        setCurrencyDropdownOpen(false);
      }
    };
    if (currencyDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [currencyDropdownOpen]);

  // Close account dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(e.target as Node)
      ) {
        setAccountOpen(false);
      }
    };
    if (accountOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [accountOpen]);

  const openPanel = (menu: Exclude<OpenMenu, null>) => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpenMenu(menu);
  };

  const schedulePanelClose = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
    }
    closeTimer.current = window.setTimeout(() => {
      setOpenMenu(null);
    }, 160);
  };

  const handleNav = (route: string) => {
    setOpenMenu(null);
    setMobileOpen(false);
    setOpenMobileMenu(null);
    if (onNavigate) {
      onNavigate(route);
    } else {
      window.location.href = route;
    }
  };

  const handleNavClick = (
    e: React.MouseEvent,
    route: string
  ) => {
    e.preventDefault();
    handleNav(route);
  };

  // ---- Customer authentication helpers (public site; admin stays separate) ----
  // Carry the visitor's current page through login/register so they land back
  // where they started (e.g. /contact?template=… context is preserved).
  const authRouteWithRedirect = (base: string) => {
    const from = currentRoute || "/";
    const isAuthPage =
      from.startsWith("/login") ||
      from.startsWith("/register") ||
      from.startsWith("/forgot-password") ||
      from.startsWith("/reset-password") ||
      from.startsWith("/account");
    return isAuthPage || from === "/" ? base : `${base}?redirect=${encodeURIComponent(from)}`;
  };

  const handleAccountNav = (route: string) => {
    setAccountOpen(false);
    setMobileOpen(false);
    handleNav(route);
  };

  const handleCustomerSignOut = async () => {
    setAccountOpen(false);
    setMobileOpen(false);
    await customerSignOut(); // Supabase signOut — customer session only
    if (onNavigate && (pathname === "/account" || pathname === "/login" || pathname === "/register")) {
      onNavigate("/"); // return to a sensible public page
    }
  };

  const customerInitials = (() => {
    const n = (customerUser?.name || "").trim();
    if (n) {
      return (
        n
          .split(/\s+/)
          .slice(0, 2)
          .map((p) => p[0]?.toUpperCase() || "")
          .join("") || "B"
      );
    }
    return (customerUser?.email || "B").slice(0, 2).toUpperCase();
  })();

  const handleConsultClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setOpenMenu(null);
    setMobileOpen(false);
    if (onOpenInquiry) {
      onOpenInquiry();
    } else if (onNavigate) {
      onNavigate("/contact");
    }
  };

  const handleInstallClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileOpen(false);
    if (onOpenPWA) {
      onOpenPWA();
    } else if (onNavigate) {
      onNavigate("/install");
    }
  };

  const selectCurrency = (code: string) => {
    const idx = currencies.findIndex((c) => c.code === code);
    if (idx !== -1) {
      setCurrencyIndex(idx);
    }
    setCurrencyDropdownOpen(false);
  };

  const handleCloseAnnouncement = () => {
    if (announcementClosing) return;
    setAnnouncementClosing(true);
    window.setTimeout(() => {
      setAnnouncementVisible(false);
      try {
        sessionStorage.setItem("branify_announcement_closed", "true");
      } catch {}
    }, 340);
  };

  const handleActionClick = (msg: AnnouncementMessage) => {
    if (msg.actionType === "inquiry" && onOpenInquiry) {
      onOpenInquiry(msg.actionTarget);
    } else if (onNavigate) {
      onNavigate(msg.actionTarget);
    }
  };

  const handleCtaClick = (
    e: React.MouseEvent,
    msg: AnnouncementMessage
  ) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(msg.ctaTarget);
    }
  };

  const toggleMobileMenu = (menu: string) => {
    setOpenMobileMenu((current) => (current === menu ? null : menu));
  };

  const navLinkClass = (isActive: boolean) =>
    `px-2.5 xl:px-1.5 py-1.5 rounded-lg transition-colors relative flex items-center cursor-pointer ${
      isActive
        ? "text-[#8F6B2D] font-bold bg-[#C9A45C]/10 border border-[#C9A45C]/25 shadow-sm"
        : "border border-transparent hover:text-[#8F6B2D] hover:bg-[#F8FAFC]"
    }`;

  const activeUnderline = (
    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-[#FFF6E5] via-[#E2C27B] to-[#C9A45C] rounded-full"></span>
  );

  return (
    <>
      {/* =========================================
          ANNOUNCEMENT BAR (Auto-Rotating, Zero Layout Shift)
      ========================================== */}
      {announcementVisible && (
        <div
          className={`announcement-bar ${announcementClosing ? "is-closing" : ""}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          role="region"
          aria-label="Announcements & Special Offers"
        >
          <div className="announcement-inner">
            <div
              key={currentMsg.id}
              className="announcement-animated-item"
            >
              <div className="announcement-message">
                <span className="announcement-spark" aria-hidden="true">
                  {currentMsg.spark}
                </span>

                <span className="announcement-text">
                  {currentMsg.text}
                </span>

                <span className="announcement-dot" aria-hidden="true">
                  •
                </span>

                <strong
                  onClick={() => handleActionClick(currentMsg)}
                  className="announcement-action cursor-pointer hover:underline"
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleActionClick(currentMsg);
                    }
                  }}
                >
                  {currentMsg.actionText}
                </strong>
              </div>

              <a
                href={currentMsg.ctaTarget}
                className="announcement-cta"
                onClick={(e) => handleCtaClick(e, currentMsg)}
              >
                {currentMsg.ctaText}
              </a>
            </div>
          </div>

          <button
            type="button"
            className="announcement-close"
            aria-label="Close announcement"
            title="Dismiss announcement (Esc)"
            onClick={handleCloseAnnouncement}
          >
            <X size={14} />
          </button>
        </div>
      )}

      <header
        className="sticky top-0 left-0 right-0 w-full z-40 bg-white/95 backdrop-blur-xl border-b border-[#C9A45C]/20 transition-all"
        onMouseLeave={schedulePanelClose}
      >
      <div className="w-full px-3 min-[420px]:px-4 sm:px-6 lg:px-8 xl:px-8 2xl:px-12 h-20 flex items-center justify-between gap-2 min-[420px]:gap-3 lg:gap-4 2xl:gap-5">
        {/* ============ OFFICIAL LOGO ============ */}
        <button
          type="button"
          className="focus:outline-none shrink-0 cursor-pointer transition-transform duration-300 hover:scale-[1.03]"
          aria-label="BRANIFY Home"
          onClick={(e) => handleNavClick(e, "/")}
        >
          <img
            src="/brand/branify-logo.png"
            alt="BRANIFY — Build. Brand. Grow."
            width={1672}
            height={941}
            className="h-10 w-auto lg:h-11"
            style={{
              filter:
                'drop-shadow(0 1px 1px rgba(15, 23, 42, 0.32)) drop-shadow(0 2px 4px rgba(15, 23, 42, 0.2))',
            }}
          />
        </button>

        {/* ============ DESKTOP NAV ============ */}
        <nav
          className="hidden xl:flex items-center gap-0.5 text-[12px] font-semibold text-slate-600 tracking-wide uppercase font-sans"
          aria-label="Main Navigation"
        >
          {/* HOME (direct link) */}
          <button
            type="button"
            className={navLinkClass(isHomeActive)}
            onMouseEnter={() => schedulePanelClose()}
            onClick={(e) => handleNavClick(e, "/")}
          >
            <span>HOME</span>
            {isHomeActive && activeUnderline}
          </button>

          {/* SERVICES */}
          <button
            type="button"
            className={`${navLinkClass(isServicesActive)} gap-1 whitespace-nowrap`}
            aria-expanded={openMenu === "services"}
            onMouseEnter={() => openPanel("services")}
            onFocus={() => openPanel("services")}
            onClick={(e) => handleNavClick(e, "/services")}
          >
            <span>SERVICES</span>
            <ChevronDown
              size={14}
              strokeWidth={2}
              className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 text-slate-500 ${
                openMenu === "services" ? "rotate-180" : ""
              }`}
            />
            {isServicesActive && activeUnderline}
          </button>

          {/* TEMPLATES */}
          <button
            type="button"
            className={`${navLinkClass(isTemplatesActive)} gap-1 whitespace-nowrap`}
            aria-expanded={openMenu === "templates"}
            onMouseEnter={() => openPanel("templates")}
            onFocus={() => openPanel("templates")}
            onClick={(e) => handleNavClick(e, "/templates")}
          >
            <span>TEMPLATES</span>
            <ChevronDown
              size={14}
              strokeWidth={2}
              className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 text-slate-500 ${
                openMenu === "templates" ? "rotate-180" : ""
              }`}
            />
            <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-[#C9A45C]/20 text-[#8F6B2D] border border-[#C9A45C]/35 rounded-full shrink-0 shadow-sm font-mono 2xl:hidden">
              {templateCount()}
            </span>
            {isTemplatesActive && activeUnderline}
          </button>

          {/* PORTFOLIO */}
          <button
            type="button"
            className={`${navLinkClass(isPortfolioActive)} gap-1.5 whitespace-nowrap`}
            aria-expanded={openMenu === "portfolio"}
            onMouseEnter={() => openPanel("portfolio")}
            onFocus={() => openPanel("portfolio")}
            onClick={(e) => handleNavClick(e, "/portfolio")}
          >
            <span>PORTFOLIO</span>
            <ChevronDown
              size={14}
              strokeWidth={2}
              className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 text-slate-500 ${
                openMenu === "portfolio" ? "rotate-180" : ""
              }`}
            />
            {isPortfolioActive && activeUnderline}
          </button>

          {/* FREE TOOLS */}
          <button
            type="button"
            className={`${navLinkClass(isToolsActive)} gap-1.5 whitespace-nowrap`}
            aria-expanded={openMenu === "tools"}
            onMouseEnter={() => openPanel("tools")}
            onFocus={() => openPanel("tools")}
            onClick={(e) => handleNavClick(e, "/tools")}
          >
            <span>FREE TOOLS</span>
            <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-[#C9A45C]/20 text-[#8F6B2D] border border-[#C9A45C]/35 rounded-full shrink-0 shadow-sm font-mono">
              100+
            </span>
            <ChevronDown
              size={14}
              strokeWidth={2}
              className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 text-slate-500 ${
                openMenu === "tools" ? "rotate-180" : ""
              }`}
            />
            {isToolsActive && activeUnderline}
          </button>

          {/* AI TOOLS (direct link) */}
          <button
            type="button"
            className={`${navLinkClass(isAiToolsActive)} gap-1.5 whitespace-nowrap`}
            onMouseEnter={() => schedulePanelClose()}
            onClick={(e) => handleNavClick(e, "/ai-tools")}
          >
            <span>AI TOOLS</span>
            <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-gradient-to-r from-[#FFF6E5] to-[#C9A45C] text-[#090A0C] rounded-full shrink-0 shadow-sm font-mono">
              27+
            </span>
            {isAiToolsActive && activeUnderline}
          </button>

          {/* BLOG (direct link) */}
          <button
            type="button"
            className={navLinkClass(isBlogActive)}
            onMouseEnter={() => schedulePanelClose()}
            onClick={(e) => handleNavClick(e, "/blog")}
          >
            <span>BLOG</span>
            {isBlogActive && activeUnderline}
          </button>

          {/* ABOUT */}
          <button
            type="button"
            className={navLinkClass(isAboutActive)}
            onMouseEnter={() => schedulePanelClose()}
            onClick={(e) => handleNavClick(e, "/about")}
          >
            <span>ABOUT</span>
            {isAboutActive && activeUnderline}
          </button>

          {/* CONTACT */}
          <button
            type="button"
            className={navLinkClass(isContactActive)}
            onMouseEnter={() => schedulePanelClose()}
            onClick={(e) => handleNavClick(e, "/contact")}
          >
            CONTACT
            {isContactActive && activeUnderline}
          </button>
        </nav>

        {/* ============ RIGHT ACTIONS ============ */}
        <div className="flex items-center gap-2 shrink-0">
          {/* INSTALL APP */}
          <button
            type="button"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A45C]/10 hover:bg-[#C9A45C]/20 text-[#8F6B2D] border border-[#C9A45C]/30 hover:border-[#C9A45C]/50 rounded-full text-xs font-bold transition-all shadow-sm group cursor-pointer"
            title="Install BRANIFY App on your Device"
            aria-label="Install App"
            onClick={handleInstallClick}
          >
            <Smartphone
              size={14}
              strokeWidth={2}
              className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-[#8F6B2D]"
            />
          </button>

          {/* SEARCH / CURRENCY / CART PILL */}
          <div
            className="relative flex items-center gap-1.5 bg-[#F8FAFC] border border-[#C9A45C]/25 rounded-full px-2.5 py-1"
            ref={currencyMenuRef}
          >
            <button
              type="button"
              className="flex items-center gap-1 px-2 py-1 hover:bg-[#C9A45C]/10 rounded-full text-xs font-bold text-slate-700 transition-all cursor-pointer group"
              aria-label="Select Currency and Country Region"
              title={`Currency: ${currency.code} (${currency.region})`}
              aria-expanded={currencyDropdownOpen}
              onClick={() => setCurrencyDropdownOpen((prev) => !prev)}
            >
              <span className="text-sm">{currency.flag}</span>
              <span className="text-[#111827] group-hover:text-[#8F6B2D] transition-colors">
                {currency.code}
              </span>
              <ChevronDown
                size={12}
                strokeWidth={2}
                className={`w-3 h-3 text-slate-500 group-hover:text-[#8F6B2D] transition-transform ${
                  currencyDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* CURRENCY DROPDOWN */}
            {currencyDropdownOpen && (
              <div
                className="absolute top-full right-0 mt-2 w-52 bg-[#F8FAFC] border border-[#C9A45C]/30 rounded-2xl shadow-2xl shadow-black/80 p-2 z-50 mega-panel-enter"
                role="listbox"
                aria-label="Currencies"
              >
                {currencies.map((curr) => (
                  <button
                    key={curr.code}
                    type="button"
                    role="option"
                    aria-selected={curr.code === currency.code}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      curr.code === currency.code
                        ? "bg-[#C9A45C]/15 text-[#8F6B2D]"
                        : "text-slate-600 hover:bg-[#F8FAFC] hover:text-[#8F6B2D]"
                    }`}
                    onClick={() => selectCurrency(curr.code)}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">{curr.flag}</span>
                      {curr.code}
                      <span className="text-slate-500 font-normal">
                        {curr.symbol}
                      </span>
                    </span>
                    {curr.code === currency.code && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CUSTOMER ACCOUNT — Login/Register (logged out) or Account menu (logged in).
              Deliberately quieter than the gold consultation CTA. */}
          <div className="relative shrink-0" ref={accountMenuRef}>
            <button
              type="button"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#F8FAFC] hover:bg-[#C9A45C]/10 text-slate-700 hover:text-[#8F6B2D] border border-[#C9A45C]/25 hover:border-[#C9A45C]/50 rounded-full text-xs font-bold transition-all cursor-pointer max-w-[10rem]"
              title={customerUser ? "My Account" : "Login or Create Account"}
              aria-label={customerUser ? "My Account" : "Login or Create Account"}
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen((prev) => !prev)}
            >
              {customerUser ? (
                <span className="w-5 h-5 rounded-full bg-[#C9A45C]/20 border border-[#C9A45C]/45 text-[9px] font-black text-[#8F6B2D] flex items-center justify-center shrink-0">
                  {customerInitials}
                </span>
              ) : (
                <UserCircle
                  size={16}
                  strokeWidth={2}
                  className="w-4 h-4 text-[#8F6B2D] shrink-0"
                />
              )}
              <span className="hidden lg:inline-block truncate">
                {customerUser ? customerUser.name || "My Account" : "Account"}
              </span>
            </button>

            {accountOpen && (
              <div
                className="absolute top-full right-0 mt-2 w-60 bg-[#F8FAFC] border border-[#C9A45C]/30 rounded-2xl shadow-2xl shadow-black/80 p-2 z-50 mega-panel-enter"
                role="menu"
                aria-label="Account Menu"
              >
                {customerUser ? (
                  <>
                    <div className="px-3 py-2.5 border-b border-[#C9A45C]/20 mb-1.5">
                      <p className="text-xs font-bold text-[#111827] truncate">
                        {customerUser.name || "BRANIFY Customer"}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{customerUser.email}</p>
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-[#8F6B2D] hover:bg-white transition-colors cursor-pointer text-left"
                      onClick={() => handleAccountNav("/account")}
                    >
                      <UserCircle size={15} strokeWidth={2} className="text-[#8F6B2D]" />
                      My Account
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-red-600 hover:bg-white transition-colors cursor-pointer text-left"
                      onClick={handleCustomerSignOut}
                    >
                      <LogOut size={15} strokeWidth={2} className="text-slate-400" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-[#8F6B2D] hover:bg-white transition-colors cursor-pointer text-left"
                      onClick={() => handleAccountNav(authRouteWithRedirect("/login"))}
                    >
                      <LogIn size={15} strokeWidth={2} className="text-[#8F6B2D]" />
                      Login
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-[#8F6B2D] hover:bg-white transition-colors cursor-pointer text-left"
                      onClick={() => handleAccountNav(authRouteWithRedirect("/register"))}
                    >
                      <UserPlus size={15} strokeWidth={2} className="text-[#8F6B2D]" />
                      Create Account
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* BOOK A CONSULTATION */}
          <button
            type="button"
            className="hidden 2xl:inline-flex items-center gap-1.5 px-4 2xl:px-4 py-2.5 btn-gold-primary rounded-full uppercase tracking-wider text-[11px] lg:text-xs font-extrabold whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A45C] cursor-pointer"
            aria-label="Book a Consultation"
            onClick={handleConsultClick}
          >
            BOOK A CONSULTATION
          </button>

          {/* MOBILE MENU BUTTON */}
          <button
            type="button"
            className="xl:hidden p-2 text-slate-600 hover:text-[#111827] bg-[#F8FAFC] border border-[#C9A45C]/25 rounded-xl shrink-0 cursor-pointer"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? (
              <X size={20} strokeWidth={2} className="w-5 h-5 text-[#8F6B2D]" />
            ) : (
              <Menu
                size={20}
                strokeWidth={2}
                className="w-5 h-5 text-[#8F6B2D]"
              />
            )}
          </button>
        </div>
      </div>

      {/* =========================================
          MEGA MENU: SERVICES
      ========================================== */}
      {openMenu === "services" && (
        <div
          className="absolute top-full left-0 w-full bg-[#F8FAFC]/98 backdrop-blur-2xl border-b border-[#C9A45C]/25 shadow-2xl shadow-black/90 z-50 mega-panel-enter"
          role="menu"
          onMouseEnter={() => openPanel("services")}
          onMouseLeave={schedulePanelClose}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {serviceMenuGroups.map((group) => (
                <div key={group.heading} className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#C9A45C]/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E2C27B]"></span>
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#8F6B2D]">
                      {group.heading}
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.title}>
                          <button
                            type="button"
                            className="w-full text-left p-2.5 rounded-xl transition-all duration-200 group hover:bg-[#F8FAFC] border border-transparent hover:border-[#C9A45C]/30 flex items-start gap-3 cursor-pointer"
                            onClick={(e) => handleNavClick(e, item.route)}
                          >
                            <div className="p-2 rounded-lg bg-[#F8FAFC] group-hover:bg-[#C9A45C]/15 border border-[#C9A45C]/15 group-hover:border-[#C9A45C]/40 transition-colors mt-0.5">
                              <Icon
                                size={16}
                                strokeWidth={2}
                                className="w-4 h-4 text-[#8F6B2D]"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-bold text-slate-700 group-hover:text-[#8F6B2D] transition-colors">
                                  {item.title}
                                </span>
                                {item.badge && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-gradient-to-r from-[#FFF6E5] to-[#C9A45C] text-[#090A0C] rounded font-mono">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 group-hover:text-slate-600">
                                {item.desc}
                              </p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-[#C9A45C]/20 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#F8FAFC] p-4 rounded-xl border border-[#C9A45C]/25">
              <div>
                <div className="text-sm font-extrabold text-[#111827] flex items-center gap-2">
                  <span className="text-[#111827]">Need a Custom Solution?</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Get a tailored project roadmap &amp; fixed quote in 24 hours.
                </p>
              </div>
              <button
                type="button"
                className="px-6 py-2.5 btn-gold-primary uppercase tracking-wider rounded-xl text-xs flex items-center gap-2 shrink-0 font-extrabold cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  setOpenMenu(null);
                  if (onOpenInquiry) {
                    onOpenInquiry();
                  } else {
                    handleNav("/contact");
                  }
                }}
              >
                <span>Talk to BRANIFY →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          MEGA MENU: TEMPLATES
      ========================================== */}
      {openMenu === "templates" && (
        <div
          className="absolute top-full left-0 w-full bg-[#F8FAFC]/98 backdrop-blur-2xl border-b border-[#C9A45C]/25 shadow-2xl shadow-black/90 z-50 mega-panel-enter"
          role="menu"
          onMouseEnter={() => openPanel("templates")}
          onMouseLeave={schedulePanelClose}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1">
              {TEMPLATE_CATEGORIES.map((cat) => {
                const n = templateCategoryCounts[cat.slug] || 0;
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    className="w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 group hover:bg-[#F8FAFC] border border-transparent hover:border-[#C9A45C]/30 flex items-center justify-between gap-3 cursor-pointer"
                    onClick={(e) => handleNavClick(e, categoryHref(cat.slug))}
                  >
                    <span className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-slate-700 group-hover:text-[#8F6B2D] transition-colors truncate">
                        {cat.name}
                      </span>
                      <span className="text-[11px] text-slate-500 group-hover:text-slate-500 truncate">
                        {cat.tagline}
                      </span>
                    </span>
                    <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-[#C9A45C]/15 text-[#8F6B2D] border border-[#C9A45C]/30 rounded-full shrink-0 font-mono">
                      {n}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-[#C9A45C]/20 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#F8FAFC] p-4 rounded-xl border border-[#C9A45C]/25">
              <div>
                <div className="text-sm font-extrabold text-[#111827] flex items-center gap-2">
                  <span className="text-[#111827]">{templateCount()} ready-made templates</span>
                  <span className="text-slate-500">·</span>
                  <span>{TEMPLATE_CATEGORIES.length} industries</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Every template ships responsive, editable and launch-ready.
                </p>
              </div>
              <button
                type="button"
                className="px-6 py-2.5 btn-gold-primary uppercase tracking-wider rounded-xl text-xs flex items-center gap-2 shrink-0 font-extrabold cursor-pointer"
                onClick={(e) => handleNavClick(e, "/templates")}
              >
                <span>Browse All Templates →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          MEGA MENU: PORTFOLIO
      ========================================== */}
      {openMenu === "portfolio" && (
        <div
          className="absolute top-full left-0 w-full bg-[#F8FAFC]/98 backdrop-blur-2xl border-b border-[#C9A45C]/25 shadow-2xl shadow-black/90 z-50 mega-panel-enter"
          role="menu"
          onMouseEnter={() => openPanel("portfolio")}
          onMouseLeave={schedulePanelClose}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-4">
                <div className="pb-2 border-b border-[#C9A45C]/20">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#8F6B2D]">
                    Filter Portfolio By Category
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {portfolioCategories.map((cat) => (
                    <button
                      key={cat.title}
                      type="button"
                      className="p-3 bg-[#F8FAFC] hover:bg-[#F8FAFC] border border-[#C9A45C]/15 hover:border-[#C9A45C]/50 rounded-xl text-left transition-all group cursor-pointer"
                      onClick={(e) => handleNavClick(e, cat.route)}
                    >
                      <div className="text-xs font-bold text-slate-700 group-hover:text-[#8F6B2D] transition-colors">
                        {cat.title}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                        {cat.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#0E141D] to-[#06080C] p-5 rounded-2xl border border-[#C9A45C]/25 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-gradient-to-r from-[#FFF6E5] to-[#C9A45C] text-[#090A0C] text-[10px] font-black rounded-md">
                      FEATURED CASE STUDY
                    </span>
                    <span className="text-[10px] text-[#8F6B2D] font-mono">
                      REAL ESTATE &amp; WEB
                    </span>
                  </div>
                  <h4 className="text-base font-black text-[#111827] leading-snug mb-2 font-serif-luxury">
                    Property Atlas: Luxury Real Estate &amp; Digital Experience
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    Bespoke property showcase with high-resolution visual
                    viewports, spec sheets, and seamless client consultation
                    funnel.
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#8F6B2D] hover:text-[#111827] transition-colors cursor-pointer"
                  onClick={(e) => handleNavClick(e, "/portfolio")}
                >
                  <span>Read Full Case Study</span>
                  <ArrowRight size={14} strokeWidth={2} className="w-3.5 h-3.5 text-[#8F6B2D]" />
                </button>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#C9A45C]/20 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#F8FAFC] p-4 rounded-xl border border-[#C9A45C]/25">
              <div>
                <div className="text-sm font-extrabold text-[#111827] flex items-center gap-2">
                  <span className="text-[#111827]">
                    Want to See Case Studies &amp; Client Results?
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Explore detailed breakdown of challenges, tech stacks, and ROI
                  generated.
                </p>
              </div>
              <button
                type="button"
                className="px-6 py-2.5 btn-gold-primary uppercase tracking-wider rounded-xl text-xs flex items-center gap-2 shrink-0 font-extrabold cursor-pointer"
                onClick={(e) => handleNavClick(e, "/portfolio")}
              >
                <span>View Portfolio &amp; Case Studies →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          MEGA MENU: FREE TOOLS
      ========================================== */}
      {openMenu === "tools" && (
        <div
          className="absolute top-full left-0 w-full bg-[#F8FAFC]/98 backdrop-blur-2xl border-b border-[#C9A45C]/25 shadow-2xl shadow-black/90 z-50 mega-panel-enter"
          role="menu"
          onMouseEnter={() => openPanel("tools")}
          onMouseLeave={schedulePanelClose}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {toolsMenuColumns.map((column) => (
                <div key={column.heading} className="space-y-3">
                  <div className="pb-1.5 border-b border-[#C9A45C]/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E2C27B]"></span>
                    <h3 className="text-[11px] font-black uppercase tracking-wider text-[#8F6B2D]">
                      {column.heading}
                    </h3>
                  </div>
                  <ul className="space-y-1">
                    {column.items.map((item) => (
                      <li key={item.label}>
                        <button
                          type="button"
                          className="w-full text-left py-1 px-1.5 rounded hover:bg-[#F8FAFC] transition-colors text-xs text-slate-600 hover:text-[#8F6B2D] flex items-center justify-between cursor-pointer"
                          onClick={(e) => handleNavClick(e, item.route)}
                        >
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span className="text-[8px] px-1 bg-[#C9A45C]/20 text-[#8F6B2D] font-bold rounded border border-[#C9A45C]/30">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-[#C9A45C]/20 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#F8FAFC] p-4 rounded-xl border border-[#C9A45C]/25">
              <div>
                <div className="text-sm font-extrabold text-[#111827] flex items-center gap-2">
                  <span className="text-[#111827]">
                    Explore 100+ Free Online Browser Tools
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  100% Client-side processing. No server uploads. Instant
                  results.
                </p>
              </div>
              <button
                type="button"
                className="px-6 py-2.5 btn-gold-primary uppercase tracking-wider rounded-xl text-xs flex items-center gap-2 shrink-0 font-extrabold cursor-pointer"
                onClick={(e) => handleNavClick(e, "/tools")}
              >
                <span>Explore 100+ Free Tools →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          MOBILE MENU
      ========================================== */}
      {mobileOpen && (
        <div className="xl:hidden bg-[#F8FAFC] border-b border-[#C9A45C]/25 px-4 py-6 space-y-3 max-h-[85vh] overflow-y-auto mobile-menu-slide">
          <div className="space-y-1">
            {/* HOME (direct) */}
            <button
              type="button"
              className="w-full text-left px-4 py-3 rounded-xl transition-colors font-bold text-sm flex items-center justify-between uppercase tracking-wider text-slate-700 hover:bg-[#F8FAFC] cursor-pointer"
              onClick={(e) => handleNavClick(e, "/")}
            >
              <span>Home</span>
              <ChevronRight size={16} strokeWidth={2} className="w-4 h-4 text-slate-500" />
            </button>

            {/* SERVICES ACCORDION */}
            <div className="rounded-xl overflow-hidden border border-[#C9A45C]/15 bg-[#F8FAFC]">
              <div className="flex items-center justify-between p-1">
                <button
                  type="button"
                  className={`flex-1 text-left px-3 py-2.5 font-bold text-sm transition-colors uppercase tracking-wider cursor-pointer ${
                    openMobileMenu === "services"
                      ? "text-[#8F6B2D]"
                      : "text-slate-700"
                  }`}
                  onClick={(e) => handleNavClick(e, "/services")}
                >
                  Services
                </button>
                <button
                  type="button"
                  className="p-2.5 text-slate-500 hover:text-[#111827] hover:bg-[#141B26] rounded-lg transition-colors cursor-pointer"
                  aria-label="Toggle Services Submenu"
                  aria-expanded={openMobileMenu === "services"}
                  onClick={() => toggleMobileMenu("services")}
                >
                  <ChevronDown
                    size={16}
                    strokeWidth={2}
                    className={`w-4 h-4 transition-transform duration-200 ${
                      openMobileMenu === "services" ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {openMobileMenu === "services" && (
                <div className="px-3 pb-3 space-y-3">
                  {serviceMenuGroups.map((group) => (
                    <div key={group.heading}>
                      <div className="text-[10px] font-black uppercase tracking-widest text-[#8F6B2D] pt-2 pb-1">
                        {group.heading}
                      </div>
                      <ul className="space-y-0.5">
                        {group.items.map((item) => (
                          <li key={item.title}>
                            <button
                              type="button"
                              className="w-full text-left py-1.5 px-2 rounded-lg text-xs text-slate-600 hover:text-[#8F6B2D] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                              onClick={(e) => handleNavClick(e, item.route)}
                            >
                              {item.title}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* TEMPLATES (direct link) */}
            <button
              type="button"
              className={`w-full text-left px-4 py-3 rounded-xl transition-colors font-bold text-sm flex items-center justify-between uppercase tracking-wider cursor-pointer ${
                isTemplatesActive ? "text-[#8F6B2D] bg-[#F8FAFC]" : "text-slate-700 hover:bg-[#F8FAFC]"
              }`}
              onClick={(e) => handleNavClick(e, "/templates")}
            >
              <span className="flex items-center gap-2">
                Templates
                <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-[#C9A45C]/20 text-[#8F6B2D] border border-[#C9A45C]/35 rounded-full font-mono">
                  {templateCount()}
                </span>
              </span>
              <ChevronRight size={16} strokeWidth={2} className="w-4 h-4 text-slate-500" />
            </button>

            {/* PORTFOLIO ACCORDION */}
            <div className="rounded-xl overflow-hidden border border-[#C9A45C]/15 bg-[#F8FAFC]">
              <div className="flex items-center justify-between p-1">
                <button
                  type="button"
                  className={`flex-1 text-left px-3 py-2.5 font-bold text-sm transition-colors uppercase tracking-wider cursor-pointer ${
                    openMobileMenu === "portfolio"
                      ? "text-[#8F6B2D]"
                      : "text-slate-700"
                  }`}
                  onClick={(e) => handleNavClick(e, "/portfolio")}
                >
                  Portfolio
                </button>
                <button
                  type="button"
                  className="p-2.5 text-slate-500 hover:text-[#111827] hover:bg-[#141B26] rounded-lg transition-colors cursor-pointer"
                  aria-label="Toggle Portfolio Submenu"
                  aria-expanded={openMobileMenu === "portfolio"}
                  onClick={() => toggleMobileMenu("portfolio")}
                >
                  <ChevronDown
                    size={16}
                    strokeWidth={2}
                    className={`w-4 h-4 transition-transform duration-200 ${
                      openMobileMenu === "portfolio" ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {openMobileMenu === "portfolio" && (
                <div className="px-3 pb-3">
                  <ul className="space-y-0.5">
                    {portfolioCategories.map((cat) => (
                      <li key={cat.title}>
                        <button
                          type="button"
                          className="w-full text-left py-1.5 px-2 rounded-lg text-xs text-slate-600 hover:text-[#8F6B2D] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                          onClick={(e) => handleNavClick(e, cat.route)}
                        >
                          {cat.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* FREE TOOLS ACCORDION */}
            <div className="rounded-xl overflow-hidden border border-[#C9A45C]/15 bg-[#F8FAFC]">
              <div className="flex items-center justify-between p-1">
                <button
                  type="button"
                  className={`flex-1 text-left px-3 py-2.5 font-bold text-sm transition-colors uppercase tracking-wider cursor-pointer ${
                    openMobileMenu === "tools"
                      ? "text-[#8F6B2D]"
                      : "text-slate-700"
                  }`}
                  onClick={(e) => handleNavClick(e, "/tools")}
                >
                  Free Tools
                </button>
                <button
                  type="button"
                  className="p-2.5 text-slate-500 hover:text-[#111827] hover:bg-[#141B26] rounded-lg transition-colors cursor-pointer"
                  aria-label="Toggle Free Tools Submenu"
                  aria-expanded={openMobileMenu === "tools"}
                  onClick={() => toggleMobileMenu("tools")}
                >
                  <ChevronDown
                    size={16}
                    strokeWidth={2}
                    className={`w-4 h-4 transition-transform duration-200 ${
                      openMobileMenu === "tools" ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {openMobileMenu === "tools" && (
                <div className="px-3 pb-3 space-y-3">
                  {toolsMenuColumns.map((column) => (
                    <div key={column.heading}>
                      <div className="text-[10px] font-black uppercase tracking-widest text-[#8F6B2D] pt-2 pb-1">
                        {column.heading}
                      </div>
                      <ul className="space-y-0.5">
                        {column.items.map((item) => (
                          <li key={item.label}>
                            <button
                              type="button"
                              className="w-full text-left py-1.5 px-2 rounded-lg text-xs text-slate-600 hover:text-[#8F6B2D] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                              onClick={(e) => handleNavClick(e, item.route)}
                            >
                              {item.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI TOOLS (direct) */}
            <button
              type="button"
              className="w-full text-left px-4 py-3 rounded-xl transition-colors font-bold text-sm flex items-center justify-between uppercase tracking-wider text-slate-700 hover:bg-[#F8FAFC] cursor-pointer"
              onClick={(e) => handleNavClick(e, "/ai-tools")}
            >
              <span>AI Tools</span>
              <ChevronRight size={16} strokeWidth={2} className="w-4 h-4 text-slate-500" />
            </button>

            {/* BLOG (direct) */}
            <button
              type="button"
              className="w-full text-left px-4 py-3 rounded-xl transition-colors font-bold text-sm flex items-center justify-between uppercase tracking-wider text-slate-700 hover:bg-[#F8FAFC] cursor-pointer"
              onClick={(e) => handleNavClick(e, "/blog")}
            >
              <span>Blog</span>
              <ChevronRight size={16} strokeWidth={2} className="w-4 h-4 text-slate-500" />
            </button>

            {/* ABOUT */}
            <button
              type="button"
              className="w-full text-left px-4 py-3 rounded-xl transition-colors font-bold text-sm flex items-center justify-between uppercase tracking-wider text-slate-700 hover:bg-[#F8FAFC] cursor-pointer"
              onClick={(e) => handleNavClick(e, "/about")}
            >
              <span>About</span>
              <ChevronRight size={16} strokeWidth={2} className="w-4 h-4 text-slate-500" />
            </button>

            {/* CONTACT */}
            <button
              type="button"
              className="w-full text-left px-4 py-3 rounded-xl transition-colors font-bold text-sm flex items-center justify-between uppercase tracking-wider text-slate-700 hover:bg-[#F8FAFC] cursor-pointer"
              onClick={(e) => handleNavClick(e, "/contact")}
            >
              <span>Contact</span>
              <ChevronRight size={16} strokeWidth={2} className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* MOBILE BOTTOM ACTIONS */}
          <div className="pt-4 border-t border-[#C9A45C]/20 space-y-3">
            {/* CUSTOMER ACCOUNT CARD (mobile) */}
            {customerUser ? (
              <div className="w-full rounded-xl bg-[#F8FAFC] border border-[#C9A45C]/25 p-3 space-y-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-9 h-9 rounded-full bg-[#C9A45C]/15 border border-[#C9A45C]/40 text-[11px] font-black text-[#8F6B2D] flex items-center justify-center shrink-0">
                    {customerInitials}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#111827] truncate">
                      {customerUser.name || "My Account"}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{customerUser.email}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="py-2.5 rounded-lg bg-[#C9A45C]/15 border border-[#C9A45C]/40 text-[#8F6B2D] text-[11px] font-bold uppercase tracking-wider hover:bg-[#C9A45C]/25 transition-colors cursor-pointer"
                    onClick={() => handleAccountNav("/account")}
                  >
                    My Account
                  </button>
                  <button
                    type="button"
                    className="py-2.5 rounded-lg bg-white border border-[#E2E8F0] text-slate-600 text-[11px] font-bold uppercase tracking-wider hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer"
                    onClick={handleCustomerSignOut}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="py-3 rounded-xl bg-[#F8FAFC] border border-[#C9A45C]/30 text-[#8F6B2D] text-xs font-extrabold uppercase tracking-wider hover:bg-[#C9A45C]/10 transition-colors cursor-pointer"
                  onClick={() => handleAccountNav(authRouteWithRedirect("/login"))}
                >
                  Login
                </button>
                <button
                  type="button"
                  className="py-3 rounded-xl bg-white border border-[#E2E8F0] text-slate-700 text-xs font-extrabold uppercase tracking-wider hover:text-[#8F6B2D] hover:border-[#C9A45C]/40 transition-colors cursor-pointer"
                  onClick={() => handleAccountNav(authRouteWithRedirect("/register"))}
                >
                  Register
                </button>
              </div>
            )}

            {/* INSTALL APP CARD */}
            <button
              type="button"
              className="w-full p-3 rounded-xl bg-[#C9A45C]/10 border border-[#C9A45C]/30 hover:bg-[#C9A45C]/20 flex items-center justify-between text-left transition-colors text-[#8F6B2D] cursor-pointer"
              onClick={handleInstallClick}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">📲</span>
                <div>
                  <div className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                    <span>Install BRANIFY App</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-gradient-to-r from-[#FFF6E5] to-[#C9A45C] text-[#090A0C] rounded font-black uppercase">
                      PWA
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Install for offline access &amp; full-screen UI
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-[#8F6B2D]">
                Install →
              </span>
            </button>

            {/* REGION / CURRENCY CARD */}
            <div className="w-full rounded-xl bg-[#F8FAFC] border border-[#C9A45C]/25 hover:border-[#C9A45C]/50 transition-colors">
              <button
                type="button"
                className="w-full p-3 flex items-center justify-between text-left transition-colors cursor-pointer"
                aria-expanded={mobileRegionOpen}
                onClick={() => setMobileRegionOpen((prev) => !prev)}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{currency.flag}</span>
                  <div>
                    <div className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                      <span>{currency.code}</span>
                      <span className="text-slate-500">({currency.symbol})</span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-semibold uppercase">
                        Auto
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Region: {currency.region}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-[#8F6B2D] font-semibold">
                  Change Region →
                </span>
              </button>

              {mobileRegionOpen && (
                <div className="px-3 pb-3 grid grid-cols-2 gap-1.5">
                  {currencies.map((curr) => (
                    <button
                      key={curr.code}
                      type="button"
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        curr.code === currency.code
                          ? "bg-[#C9A45C]/15 text-[#8F6B2D]"
                          : "text-slate-600 hover:bg-[#F8FAFC] hover:text-[#8F6B2D]"
                      }`}
                      onClick={() => selectCurrency(curr.code)}
                    >
                      <span>{curr.flag}</span>
                      {curr.code}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* BOOK A CONSULTATION */}
            <button
              type="button"
              className="w-full py-3.5 btn-gold-primary font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A45C] cursor-pointer"
              aria-label="Book a Consultation"
              onClick={handleConsultClick}
            >
              <span>BOOK A CONSULTATION</span>
              <ArrowRight size={16} strokeWidth={2} className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
    </>
  );
}
