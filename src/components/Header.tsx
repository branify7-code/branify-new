import React, { useState, useEffect, useRef } from "react";
import { useCurrency } from "../lib/currency";
import {
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Smartphone,
  Search,
  ShoppingBag,
  ArrowRight,
  Globe,
  LayoutGrid,
  ShoppingCart,
  MousePointerClick,
  Figma,
  Palette,
  Sparkles,
  Share2,
  Presentation,
  Bot,
  TrendingUp,
} from "lucide-react";

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
        title: "Shopify Website Development",
        desc: "Custom theme design, store setup & app integrations",
        icon: ShoppingBag,
        route: "/services/shopify-website-development",
      },
      {
        title: "E-Commerce Website Development",
        desc: "Full-stack, WooCommerce & headless online stores",
        icon: ShoppingCart,
        route: "/services/e-commerce-website-development",
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

type OpenMenu = "services" | "portfolio" | "tools" | null;

/* =========================================================
   BRAND LOGO MARK — gold "B" emblem (same as branify.store)
========================================================= */

function BranifyLogoMark() {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-9 h-9 transition-all duration-500"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="branify-gold-grad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#FFF9EB">
            <animate
              attributeName="stop-color"
              values="#FFF9EB;#DFBA73;#FFF9EB"
              dur="4s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="35%" stopColor="#E2C27B"></stop>
          <stop offset="70%" stopColor="#C9A45C"></stop>
          <stop offset="100%" stopColor="#8A6827"></stop>
        </linearGradient>
        <linearGradient
          id="branify-silver-grad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#F5F5F2"></stop>
          <stop offset="50%" stopColor="#C9A45C"></stop>
          <stop offset="100%" stopColor="#8A6827"></stop>
        </linearGradient>
        <filter
          id="gold-glow"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feGaussianBlur stdDeviation="3.5" result="blur"></feGaussianBlur>
          <feComposite in="SourceGraphic" in2="blur" operator="over"></feComposite>
        </filter>
      </defs>
      <circle
        cx="60"
        cy="60"
        r="48"
        fill="none"
        stroke="url(#branify-gold-grad)"
        strokeWidth="1"
        strokeDasharray="6 6"
        opacity="0.25"
        className="origin-center animate-[spin_20s_linear_infinite]"
      ></circle>
      <path
        d="M 18 36 L 42 14 H 80 C 98 14 110 25 110 41 C 110 54 99 63 83 67 L 40 40 L 18 36 Z"
        fill="url(#branify-gold-grad)"
        filter="url(#gold-glow)"
      ></path>
      <path
        d="M 48 26 H 75 C 83 26 89 30 89 37 C 89 44 83 48 73 48 L 41 28 L 48 26 Z"
        fill="#07090D"
      ></path>
      <path
        d="M 38 41 L 83 67 L 76 72 L 30 46 Z"
        fill="#07090D"
      ></path>
      <path
        d="M 14 78 L 52 53 H 84 C 102 53 114 64 114 80 C 114 98 98 106 74 106 H 32 C 22 106 18 98 28 98 L 72 98 C 86 98 94 91 94 80 C 94 69 86 63 70 63 L 40 81 L 14 78 Z"
        fill="url(#branify-silver-grad)"
      ></path>
    </svg>
  );
}

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
  const [isHovered, setIsHovered] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const currencyMenuRef = useRef<HTMLDivElement>(null);

  const pathname = currentRoute.split("?")[0] || "/";
  const isHomeActive = pathname === "/";
  const isAboutActive = pathname === "/about";
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

  // ESC closes menus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (mobileOpen) {
          setMobileOpen(false);
          setOpenMobileMenu(null);
        } else if (currencyDropdownOpen) {
          setCurrencyDropdownOpen(false);
        } else {
          setOpenMenu(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, currencyDropdownOpen]);

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
    setAnnouncementVisible(false);
    try {
      sessionStorage.setItem("branify_announcement_closed", "true");
    } catch {}
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
    `px-3 py-1.5 rounded-lg transition-colors relative flex items-center cursor-pointer ${
      isActive
        ? "text-[#E2C27B] font-bold bg-[#C9A45C]/10 border border-[#C9A45C]/25 shadow-sm"
        : "border border-transparent hover:text-[#E2C27B] hover:bg-white/[0.04]"
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
          className="announcement-bar"
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
        className="sticky top-0 left-0 right-0 w-full z-40 bg-[#06080C]/95 backdrop-blur-xl border-b border-[#C9A45C]/20 transition-all"
        onMouseLeave={schedulePanelClose}
      >
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 h-20 flex items-center justify-between gap-3 lg:gap-5">
        {/* ============ LOGO LOCKUP ============ */}
        <button
          type="button"
          className="focus:outline-none shrink-0 cursor-pointer"
          aria-label="BRANIFY Home"
          onClick={(e) => handleNavClick(e, "/")}
        >
          <div className="flex items-center gap-3 group ">
            <div className="relative shrink-0 transition-transform duration-300 group-hover:scale-105">
              <BranifyLogoMark />
            </div>
            <div className="flex flex-col justify-center">
              <div className="font-black uppercase flex items-center leading-none font-sans text-2xl tracking-wider">
                <span className="text-white">BRAN</span>
                <span className="text-[#E2C27B]">IFY</span>
              </div>
              <div className="flex items-center uppercase font-extrabold text-zinc-400 mt-1 text-[10px] gap-1.5">
                <span className="text-white">BUILD.</span>
                <span className="text-[#E2C27B]">BRAND.</span>
                <span className="text-white">GROW.</span>
              </div>
            </div>
          </div>
        </button>

        {/* ============ DESKTOP NAV ============ */}
        <nav
          className="hidden xl:flex items-center gap-1 lg:gap-1.5 2xl:gap-2 text-[13px] font-semibold text-zinc-300 tracking-wide uppercase font-sans"
          aria-label="Main Navigation"
        >
          {/* HOME */}
          <button
            type="button"
            className={navLinkClass(isHomeActive)}
            onClick={(e) => handleNavClick(e, "/")}
          >
            <span>HOME</span>
            {isHomeActive && activeUnderline}
          </button>

          {/* ABOUT */}
          <button
            type="button"
            className={navLinkClass(isAboutActive)}
            onClick={(e) => handleNavClick(e, "/about")}
          >
            <span>ABOUT</span>
            {isAboutActive && activeUnderline}
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
              className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 text-zinc-400 ${
                openMenu === "services" ? "rotate-180" : ""
              }`}
            />
            {isServicesActive && activeUnderline}
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
              className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 text-zinc-400 ${
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
            <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-[#C9A45C]/20 text-[#E2C27B] border border-[#C9A45C]/35 rounded-full shrink-0 shadow-sm font-mono">
              100+
            </span>
            <ChevronDown
              size={14}
              strokeWidth={2}
              className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 text-zinc-400 ${
                openMenu === "tools" ? "rotate-180" : ""
              }`}
            />
            {isToolsActive && activeUnderline}
          </button>

          {/* AI TOOLS (direct link) */}
          <button
            type="button"
            className={`${navLinkClass(isAiToolsActive)} gap-1.5 whitespace-nowrap`}
            onClick={(e) => handleNavClick(e, "/ai-tools")}
          >
            <span>AI TOOLS</span>
            <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-gradient-to-r from-[#FFF6E5] to-[#C9A45C] text-[#05080C] rounded-full shrink-0 shadow-sm font-mono">
              27+
            </span>
            {isAiToolsActive && activeUnderline}
          </button>

          {/* CONTACT */}
          <button
            type="button"
            className={navLinkClass(isContactActive)}
            onClick={(e) => handleNavClick(e, "/contact")}
          >
            CONTACT
            {isContactActive && activeUnderline}
          </button>
        </nav>

        {/* ============ RIGHT ACTIONS ============ */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* INSTALL APP */}
          <button
            type="button"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A45C]/10 hover:bg-[#C9A45C]/20 text-[#E2C27B] border border-[#C9A45C]/30 hover:border-[#C9A45C]/50 rounded-full text-xs font-bold transition-all shadow-sm group cursor-pointer"
            title="Install BRANIFY App on your Device"
            aria-label="Install App"
            onClick={handleInstallClick}
          >
            <Smartphone
              size={14}
              strokeWidth={2}
              className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-[#E2C27B]"
            />
            <span className="hidden lg:inline-block">Install App</span>
          </button>

          {/* SEARCH / CURRENCY / CART PILL */}
          <div
            className="flex items-center gap-1.5 bg-[#0B0F15] border border-[#C9A45C]/25 rounded-full px-2.5 py-1"
            ref={currencyMenuRef}
          >
            <button
              type="button"
              className="p-1.5 text-zinc-300 hover:text-[#E2C27B] hover:bg-[#C9A45C]/10 rounded-full transition-colors flex items-center gap-1 text-xs cursor-pointer"
              title="Search Services, Portfolio, Tools... (⌘K)"
              aria-label="Search"
            >
              <Search size={16} strokeWidth={2} className="w-4 h-4" />
            </button>

            <button
              type="button"
              className="flex items-center gap-1 px-2 py-1 hover:bg-[#C9A45C]/10 rounded-full text-xs font-bold text-zinc-200 transition-all cursor-pointer group"
              aria-label="Select Currency and Country Region"
              title={`Currency: ${currency.code} (${currency.region})`}
              aria-expanded={currencyDropdownOpen}
              onClick={() => setCurrencyDropdownOpen((prev) => !prev)}
            >
              <span className="text-sm">{currency.flag}</span>
              <span className="text-white group-hover:text-[#E2C27B] transition-colors">
                {currency.code}
              </span>
              <ChevronDown
                size={12}
                strokeWidth={2}
                className={`w-3 h-3 text-zinc-400 group-hover:text-[#E2C27B] transition-transform ${
                  currencyDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <button
              type="button"
              className="p-1.5 text-zinc-300 hover:text-[#E2C27B] hover:bg-[#C9A45C]/10 rounded-full transition-colors relative cursor-pointer"
              title="View Cart"
              aria-label="Shopping Cart"
            >
              <ShoppingBag size={16} strokeWidth={2} className="w-4 h-4" />
            </button>

            {/* CURRENCY DROPDOWN */}
            {currencyDropdownOpen && (
              <div
                className="absolute top-full right-0 mt-2 w-52 bg-[#0B0F15] border border-[#C9A45C]/30 rounded-2xl shadow-2xl shadow-black/80 p-2 z-50 mega-panel-enter"
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
                        ? "bg-[#C9A45C]/15 text-[#E2C27B]"
                        : "text-zinc-300 hover:bg-[#101620] hover:text-[#E2C27B]"
                    }`}
                    onClick={() => selectCurrency(curr.code)}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">{curr.flag}</span>
                      {curr.code}
                      <span className="text-zinc-500 font-normal">
                        {curr.symbol}
                      </span>
                    </span>
                    {curr.code === currency.code && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* BOOK A CONSULTATION */}
          <button
            type="button"
            className="hidden sm:inline-flex items-center gap-1.5 px-5 lg:px-6 py-2.5 btn-gold-primary rounded-full uppercase tracking-wider text-[11px] lg:text-xs font-extrabold whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A45C] cursor-pointer"
            aria-label="Book a Consultation"
            onClick={handleConsultClick}
          >
            BOOK A CONSULTATION
          </button>

          {/* MOBILE MENU BUTTON */}
          <button
            type="button"
            className="xl:hidden p-2 text-zinc-300 hover:text-white bg-[#0B0F15] border border-[#C9A45C]/25 rounded-xl shrink-0 cursor-pointer"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? (
              <X size={20} strokeWidth={2} className="w-5 h-5 text-[#E2C27B]" />
            ) : (
              <Menu
                size={20}
                strokeWidth={2}
                className="w-5 h-5 text-[#E2C27B]"
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
          className="absolute top-full left-0 w-full bg-[#07090D]/98 backdrop-blur-2xl border-b border-[#C9A45C]/25 shadow-2xl shadow-black/90 z-50 mega-panel-enter"
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
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#E2C27B]">
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
                            className="w-full text-left p-2.5 rounded-xl transition-all duration-200 group hover:bg-[#101620] border border-transparent hover:border-[#C9A45C]/30 flex items-start gap-3 cursor-pointer"
                            onClick={(e) => handleNavClick(e, item.route)}
                          >
                            <div className="p-2 rounded-lg bg-[#0B0F15] group-hover:bg-[#C9A45C]/15 border border-[#C9A45C]/15 group-hover:border-[#C9A45C]/40 transition-colors mt-0.5">
                              <Icon
                                size={16}
                                strokeWidth={2}
                                className="w-4 h-4 text-[#E2C27B]"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-bold text-zinc-100 group-hover:text-[#E2C27B] transition-colors">
                                  {item.title}
                                </span>
                                {item.badge && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-gradient-to-r from-[#FFF6E5] to-[#C9A45C] text-[#05080C] rounded font-mono">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1 group-hover:text-zinc-300">
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

            <div className="mt-8 pt-6 border-t border-[#C9A45C]/20 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0B0F15] p-4 rounded-xl border border-[#C9A45C]/25">
              <div>
                <div className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span className="text-[#FFF6E5]">Need a Custom Solution?</span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
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
          MEGA MENU: PORTFOLIO
      ========================================== */}
      {openMenu === "portfolio" && (
        <div
          className="absolute top-full left-0 w-full bg-[#07090D]/98 backdrop-blur-2xl border-b border-[#C9A45C]/25 shadow-2xl shadow-black/90 z-50 mega-panel-enter"
          role="menu"
          onMouseEnter={() => openPanel("portfolio")}
          onMouseLeave={schedulePanelClose}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-4">
                <div className="pb-2 border-b border-[#C9A45C]/20">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#E2C27B]">
                    Filter Portfolio By Category
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {portfolioCategories.map((cat) => (
                    <button
                      key={cat.title}
                      type="button"
                      className="p-3 bg-[#0B0F15] hover:bg-[#101620] border border-[#C9A45C]/15 hover:border-[#C9A45C]/50 rounded-xl text-left transition-all group cursor-pointer"
                      onClick={(e) => handleNavClick(e, cat.route)}
                    >
                      <div className="text-xs font-bold text-zinc-200 group-hover:text-[#E2C27B] transition-colors">
                        {cat.title}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
                        {cat.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#0E141D] to-[#06080C] p-5 rounded-2xl border border-[#C9A45C]/25 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-gradient-to-r from-[#FFF6E5] to-[#C9A45C] text-[#05080C] text-[10px] font-black rounded-md">
                      FEATURED CASE STUDY
                    </span>
                    <span className="text-[10px] text-[#C9A45C] font-mono">
                      REAL ESTATE &amp; WEB
                    </span>
                  </div>
                  <h4 className="text-base font-black text-white leading-snug mb-2 font-serif-luxury">
                    Property Atlas: Luxury Real Estate &amp; Digital Experience
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    Bespoke property showcase with high-resolution visual
                    viewports, spec sheets, and seamless client consultation
                    funnel.
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#E2C27B] hover:text-white transition-colors cursor-pointer"
                  onClick={(e) => handleNavClick(e, "/portfolio")}
                >
                  <span>Read Full Case Study</span>
                  <ArrowRight size={14} strokeWidth={2} className="w-3.5 h-3.5 text-[#E2C27B]" />
                </button>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#C9A45C]/20 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0B0F15] p-4 rounded-xl border border-[#C9A45C]/25">
              <div>
                <div className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span className="text-[#FFF6E5]">
                    Want to See Case Studies &amp; Client Results?
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
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
          className="absolute top-full left-0 w-full bg-[#07090D]/98 backdrop-blur-2xl border-b border-[#C9A45C]/25 shadow-2xl shadow-black/90 z-50 mega-panel-enter"
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
                    <h3 className="text-[11px] font-black uppercase tracking-wider text-[#E2C27B]">
                      {column.heading}
                    </h3>
                  </div>
                  <ul className="space-y-1">
                    {column.items.map((item) => (
                      <li key={item.label}>
                        <button
                          type="button"
                          className="w-full text-left py-1 px-1.5 rounded hover:bg-[#101620] transition-colors text-xs text-zinc-300 hover:text-[#E2C27B] flex items-center justify-between cursor-pointer"
                          onClick={(e) => handleNavClick(e, item.route)}
                        >
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span className="text-[8px] px-1 bg-[#C9A45C]/20 text-[#E2C27B] font-bold rounded border border-[#C9A45C]/30">
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

            <div className="mt-8 pt-6 border-t border-[#C9A45C]/20 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0B0F15] p-4 rounded-xl border border-[#C9A45C]/25">
              <div>
                <div className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span className="text-[#FFF6E5]">
                    Explore 100+ Free Online Browser Tools
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
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
        <div className="xl:hidden bg-[#07090D] border-b border-[#C9A45C]/25 px-4 py-6 space-y-3 max-h-[85vh] overflow-y-auto mobile-menu-slide">
          <div className="space-y-1">
            {/* HOME */}
            <button
              type="button"
              className="w-full text-left px-4 py-3 rounded-xl transition-colors font-bold text-sm flex items-center justify-between uppercase tracking-wider text-zinc-200 hover:bg-[#101620] cursor-pointer"
              onClick={(e) => handleNavClick(e, "/")}
            >
              <span>Home</span>
              <ChevronRight size={16} strokeWidth={2} className="w-4 h-4 text-zinc-500" />
            </button>

            {/* ABOUT */}
            <button
              type="button"
              className="w-full text-left px-4 py-3 rounded-xl transition-colors font-bold text-sm flex items-center justify-between uppercase tracking-wider text-zinc-200 hover:bg-[#101620] cursor-pointer"
              onClick={(e) => handleNavClick(e, "/about")}
            >
              <span>About</span>
              <ChevronRight size={16} strokeWidth={2} className="w-4 h-4 text-zinc-500" />
            </button>

            {/* SERVICES ACCORDION */}
            <div className="rounded-xl overflow-hidden border border-[#C9A45C]/15 bg-[#0B0F15]">
              <div className="flex items-center justify-between p-1">
                <button
                  type="button"
                  className={`flex-1 text-left px-3 py-2.5 font-bold text-sm transition-colors uppercase tracking-wider cursor-pointer ${
                    openMobileMenu === "services"
                      ? "text-[#E2C27B]"
                      : "text-zinc-200"
                  }`}
                  onClick={(e) => handleNavClick(e, "/services")}
                >
                  Services
                </button>
                <button
                  type="button"
                  className="p-2.5 text-zinc-400 hover:text-white hover:bg-[#141B26] rounded-lg transition-colors cursor-pointer"
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
                      <div className="text-[10px] font-black uppercase tracking-widest text-[#E2C27B] pt-2 pb-1">
                        {group.heading}
                      </div>
                      <ul className="space-y-0.5">
                        {group.items.map((item) => (
                          <li key={item.title}>
                            <button
                              type="button"
                              className="w-full text-left py-1.5 px-2 rounded-lg text-xs text-zinc-300 hover:text-[#E2C27B] hover:bg-[#101620] transition-colors cursor-pointer"
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

            {/* PORTFOLIO ACCORDION */}
            <div className="rounded-xl overflow-hidden border border-[#C9A45C]/15 bg-[#0B0F15]">
              <div className="flex items-center justify-between p-1">
                <button
                  type="button"
                  className={`flex-1 text-left px-3 py-2.5 font-bold text-sm transition-colors uppercase tracking-wider cursor-pointer ${
                    openMobileMenu === "portfolio"
                      ? "text-[#E2C27B]"
                      : "text-zinc-200"
                  }`}
                  onClick={(e) => handleNavClick(e, "/portfolio")}
                >
                  Portfolio
                </button>
                <button
                  type="button"
                  className="p-2.5 text-zinc-400 hover:text-white hover:bg-[#141B26] rounded-lg transition-colors cursor-pointer"
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
                          className="w-full text-left py-1.5 px-2 rounded-lg text-xs text-zinc-300 hover:text-[#E2C27B] hover:bg-[#101620] transition-colors cursor-pointer"
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
            <div className="rounded-xl overflow-hidden border border-[#C9A45C]/15 bg-[#0B0F15]">
              <div className="flex items-center justify-between p-1">
                <button
                  type="button"
                  className={`flex-1 text-left px-3 py-2.5 font-bold text-sm transition-colors uppercase tracking-wider cursor-pointer ${
                    openMobileMenu === "tools"
                      ? "text-[#E2C27B]"
                      : "text-zinc-200"
                  }`}
                  onClick={(e) => handleNavClick(e, "/tools")}
                >
                  Free Tools
                </button>
                <button
                  type="button"
                  className="p-2.5 text-zinc-400 hover:text-white hover:bg-[#141B26] rounded-lg transition-colors cursor-pointer"
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
                      <div className="text-[10px] font-black uppercase tracking-widest text-[#E2C27B] pt-2 pb-1">
                        {column.heading}
                      </div>
                      <ul className="space-y-0.5">
                        {column.items.map((item) => (
                          <li key={item.label}>
                            <button
                              type="button"
                              className="w-full text-left py-1.5 px-2 rounded-lg text-xs text-zinc-300 hover:text-[#E2C27B] hover:bg-[#101620] transition-colors cursor-pointer"
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
              className="w-full text-left px-4 py-3 rounded-xl transition-colors font-bold text-sm flex items-center justify-between uppercase tracking-wider text-zinc-200 hover:bg-[#101620] cursor-pointer"
              onClick={(e) => handleNavClick(e, "/ai-tools")}
            >
              <span>AI Tools</span>
              <ChevronRight size={16} strokeWidth={2} className="w-4 h-4 text-zinc-500" />
            </button>

            {/* CONTACT */}
            <button
              type="button"
              className="w-full text-left px-4 py-3 rounded-xl transition-colors font-bold text-sm flex items-center justify-between uppercase tracking-wider text-zinc-200 hover:bg-[#101620] cursor-pointer"
              onClick={(e) => handleNavClick(e, "/contact")}
            >
              <span>Contact</span>
              <ChevronRight size={16} strokeWidth={2} className="w-4 h-4 text-zinc-500" />
            </button>
          </div>

          {/* MOBILE BOTTOM ACTIONS */}
          <div className="pt-4 border-t border-[#C9A45C]/20 space-y-3">
            {/* INSTALL APP CARD */}
            <button
              type="button"
              className="w-full p-3 rounded-xl bg-[#C9A45C]/10 border border-[#C9A45C]/30 hover:bg-[#C9A45C]/20 flex items-center justify-between text-left transition-colors text-[#E2C27B] cursor-pointer"
              onClick={handleInstallClick}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">📲</span>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Install BRANIFY App</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-gradient-to-r from-[#FFF6E5] to-[#C9A45C] text-[#05080C] rounded font-black uppercase">
                      PWA
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Install for offline access &amp; full-screen UI
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-[#E2C27B]">
                Install →
              </span>
            </button>

            {/* REGION / CURRENCY CARD */}
            <div className="w-full rounded-xl bg-[#0B0F15] border border-[#C9A45C]/25 hover:border-[#C9A45C]/50 transition-colors">
              <button
                type="button"
                className="w-full p-3 flex items-center justify-between text-left transition-colors cursor-pointer"
                aria-expanded={mobileRegionOpen}
                onClick={() => setMobileRegionOpen((prev) => !prev)}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{currency.flag}</span>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{currency.code}</span>
                      <span className="text-zinc-400">({currency.symbol})</span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-semibold uppercase">
                        Auto
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      Region: {currency.region}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-[#E2C27B] font-semibold">
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
                          ? "bg-[#C9A45C]/15 text-[#E2C27B]"
                          : "text-zinc-300 hover:bg-[#101620] hover:text-[#E2C27B]"
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
