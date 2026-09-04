import React, { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  Menu,
  X,
  Smartphone,
  Search,
  ShoppingBag,
  ArrowUpRight,
} from "lucide-react";

export type DropdownItem = {
  label: string;
  href: string;
};

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
  {
    id: "msg-4",
    spark: "✦",
    text: "BUILD. BRAND. GROW. — DIGITAL SOLUTIONS FOR MODERN BUSINESSES",
    actionText: "START A PROJECT",
    actionType: "inquiry",
    actionTarget: "Inquiry: Digital Solutions",
    ctaText: "EXPLORE NOW",
    ctaTarget: "/services",
  },
];

const serviceItems: DropdownItem[] = [
  { label: "All Services", href: "/services" },
  { label: "Website Development", href: "/services/website-development" },
  { label: "UI / UX Design", href: "/services?category=ui-ux" },
  { label: "E-Commerce Stores", href: "/services?category=ecommerce" },
  { label: "Branding & Identity", href: "/services?category=branding" },
  { label: "Digital Marketing & Growth", href: "/services?category=digital-marketing" },
  { label: "AI Solutions & Agents", href: "/services?category=ai-solutions" },
];

const portfolioItems: DropdownItem[] = [
  { label: "All Projects", href: "/portfolio" },
  { label: "Alaya Luxury Spa", href: "/portfolio?project=alaya-spa" },
  { label: "Cinestream AI", href: "/portfolio?project=cinestream" },
  { label: "BlockExchange", href: "/portfolio?project=blockexchange" },
];

const toolItems: DropdownItem[] = [
  { label: "All Free Tools", href: "/tools" },
  { label: "Password Generator", href: "/tools?tool=password-gen" },
  { label: "QR Code Generator", href: "/tools?tool=qr-gen" },
  { label: "JSON Formatter", href: "/tools?tool=json-format" },
  { label: "Color Converter", href: "/tools?tool=color-convert" },
  { label: "Meta Tags Generator", href: "/tools?tool=meta-gen" },
];

const aiToolItems: DropdownItem[] = [
  { label: "All AI Tools", href: "/ai-tools" },
  { label: "AI Copywriter & Pitch", href: "/ai-tools?tool=copy-generator" },
  { label: "AI Code Auditor", href: "/ai-tools?tool=code-auditor" },
  { label: "AI Palette Generator", href: "/ai-tools?tool=palette-generator" },
  { label: "AI SEO Synthesizer", href: "/ai-tools?tool=seo-strategy" },
];

const currencies = ["PKR", "USD", "AED", "EUR", "GBP", "SAR"];

function DesktopDropdown({
  label,
  href,
  badge,
  items,
  isActive,
  onNavigateItem,
}: {
  label: string;
  href: string;
  badge?: string;
  items: DropdownItem[];
  isActive?: boolean;
  onNavigateItem?: (href: string) => void;
}) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, targetHref: string) => {
    if (onNavigateItem) {
      e.preventDefault();
      onNavigateItem(targetHref);
    }
  };

  return (
    <div className="nav-dropdown">
      <a
        href={href}
        className={`nav-link ${isActive ? "active" : ""}`}
        onClick={(e) => handleClick(e, href)}
      >
        <span>{label}</span>

        {badge && (
          <span className={`nav-badge ${label.includes("AI") ? "ai-badge" : ""}`}>
            {badge}
          </span>
        )}

        <ChevronDown size={13} strokeWidth={1.8} className="dropdown-chevron" />
      </a>

      <div className="dropdown-menu">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={(e) => handleClick(e, item.href)}
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
}

export default function Header({
  currentRoute = "/",
  onNavigate,
  onOpenInquiry,
  onOpenPWA,
}: HeaderProps) {
  // Check sessionStorage for announcement bar closed status
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
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMobileMenu, setOpenMobileMenu] = useState<string | null>(null);
  const [currencyIndex, setCurrencyIndex] = useState(0);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const currencyMenuRef = useRef<HTMLDivElement>(null);

  // Rotation timer: 4.5 seconds per message, pauses on hover
  useEffect(() => {
    if (!announcementVisible || isHovered) return;

    const interval = setInterval(() => {
      setCurrentMsgIndex((prev) => (prev + 1) % announcementMessages.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [announcementVisible, isHovered]);

  // Scroll detection for sticky header refinement
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard accessibility: ESC closes announcement or mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (mobileOpen) {
          setMobileOpen(false);
        } else if (currencyDropdownOpen) {
          setCurrencyDropdownOpen(false);
        } else if (announcementVisible) {
          handleCloseAnnouncement();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [announcementVisible, mobileOpen, currencyDropdownOpen]);

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

  const handleCloseAnnouncement = () => {
    setAnnouncementVisible(false);
    try {
      sessionStorage.setItem("branify_announcement_closed", "true");
    } catch {}
  };

  const toggleMobileMenu = (menu: string) => {
    setOpenMobileMenu((current) => (current === menu ? null : menu));
  };

  const closeMobile = () => {
    setMobileOpen(false);
    setOpenMobileMenu(null);
  };

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(href);
    }
    closeMobile();
  };

  const handleConsultClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onOpenInquiry) {
      e.preventDefault();
      onOpenInquiry();
    } else if (onNavigate) {
      e.preventDefault();
      onNavigate("/contact");
    }
    closeMobile();
  };

  const handleInstallClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onOpenPWA) {
      e.preventDefault();
      onOpenPWA();
    } else if (onNavigate) {
      e.preventDefault();
      onNavigate("/install");
    }
    closeMobile();
  };

  const handleActionClick = (msg: AnnouncementMessage) => {
    if (msg.actionType === "inquiry" && onOpenInquiry) {
      onOpenInquiry(msg.actionTarget);
    } else if (onNavigate) {
      onNavigate(msg.actionTarget);
    }
  };

  const handleCtaClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    msg: AnnouncementMessage
  ) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(msg.ctaTarget);
    }
  };

  const cycleCurrency = () => {
    setCurrencyIndex((prev) => (prev + 1) % currencies.length);
  };

  const selectCurrency = (curr: string) => {
    const idx = currencies.indexOf(curr);
    if (idx !== -1) {
      setCurrencyIndex(idx);
    }
    setCurrencyDropdownOpen(false);
  };

  // Determine active route state
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

  const currentMsg = announcementMessages[currentMsgIndex];

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

      {/* =========================================
          HEADER (Sticky with Smooth Backdrop Blur)
      ========================================== */}
      <header className={`site-header ${scrolled ? "scrolled" : ""}`}>
        <div className="header-inner">
          {/* LOGO */}
          <a
            href="/"
            className="brand-logo-link"
            aria-label="BRANIFY Home"
            onClick={(e) => handleNavClick(e, "/")}
          >
            <img
              src="/brand/branify-logo.png"
              alt="BRANIFY — Build. Brand. Grow."
              className="brand-logo-image"
            />
          </a>

          {/* DESKTOP NAV */}
          <nav className="desktop-nav" aria-label="Primary navigation">
            <a
              href="/"
              className={`nav-link ${isHomeActive ? "active" : ""}`}
              onClick={(e) => handleNavClick(e, "/")}
            >
              HOME
            </a>

            <a
              href="/about"
              className={`nav-link ${isAboutActive ? "active" : ""}`}
              onClick={(e) => handleNavClick(e, "/about")}
            >
              ABOUT
            </a>

            <DesktopDropdown
              label="SERVICES"
              href="/services"
              items={serviceItems}
              isActive={isServicesActive}
              onNavigateItem={onNavigate}
            />

            <DesktopDropdown
              label="PORTFOLIO"
              href="/portfolio"
              items={portfolioItems}
              isActive={isPortfolioActive}
              onNavigateItem={onNavigate}
            />

            <DesktopDropdown
              label="FREE TOOLS"
              href="/tools"
              badge="100+"
              items={toolItems}
              isActive={isToolsActive}
              onNavigateItem={onNavigate}
            />

            <DesktopDropdown
              label="AI TOOLS"
              href="/ai-tools"
              badge="27+"
              items={aiToolItems}
              isActive={isAiToolsActive}
              onNavigateItem={onNavigate}
            />

            <a
              href="/contact"
              className={`nav-link ${isContactActive ? "active" : ""}`}
              onClick={(e) => handleNavClick(e, "/contact")}
            >
              CONTACT
            </a>
          </nav>

          {/* HEADER ACTIONS */}
          <div className="header-actions">
            {/* INSTALL APP */}
            <a
              href="/install"
              className="install-btn"
              onClick={handleInstallClick}
              title="Install BRANIFY PWA App"
            >
              <Smartphone size={14} strokeWidth={1.8} />
              <span>Install App</span>
            </a>

            {/* CURRENCY SELECTOR */}
            <div className="currency-selector-wrap" ref={currencyMenuRef}>
              <button
                type="button"
                className="currency-btn"
                aria-label="Currency selector"
                aria-haspopup="listbox"
                aria-expanded={currencyDropdownOpen}
                onClick={() => setCurrencyDropdownOpen((prev) => !prev)}
                title="Select Currency"
              >
                <Search size={13} strokeWidth={1.8} />
                <span>{currencies[currencyIndex]}</span>
                <ChevronDown size={11} strokeWidth={1.8} />
                <ShoppingBag size={13} strokeWidth={1.8} />
              </button>

              {currencyDropdownOpen && (
                <div
                  className="currency-dropdown-menu"
                  role="listbox"
                  aria-label="Currencies"
                >
                  {currencies.map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      role="option"
                      aria-selected={curr === currencies[currencyIndex]}
                      className={`currency-option ${
                        curr === currencies[currencyIndex] ? "selected" : ""
                      }`}
                      onClick={() => selectCurrency(curr)}
                    >
                      <span>{curr}</span>
                      {curr === currencies[currencyIndex] && (
                        <span className="curr-check">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* BOOK A CONSULTATION CTA */}
            <a
              href="/contact"
              className="consult-btn"
              onClick={handleConsultClick}
            >
              <span>BOOK A CONSULTATION</span>
              <ArrowUpRight size={14} strokeWidth={2.2} />
            </a>

            {/* MOBILE MENU BUTTON */}
            <button
              type="button"
              className="mobile-menu-btn"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((value) => !value)}
            >
              {mobileOpen ? (
                <X size={21} strokeWidth={1.8} />
              ) : (
                <Menu size={21} strokeWidth={1.8} />
              )}
            </button>
          </div>
        </div>

        {/* =========================================
            MOBILE MENU (Slide-down with Submenus)
        ========================================== */}
        <div
          className={`mobile-menu ${
            mobileOpen ? "mobile-menu-open" : ""
          }`}
        >
          <nav className="mobile-nav" aria-label="Mobile navigation">
            <a
              href="/"
              className={`mobile-nav-link ${isHomeActive ? "active" : ""}`}
              onClick={(e) => handleNavClick(e, "/")}
            >
              HOME
            </a>

            <a
              href="/about"
              className={`mobile-nav-link ${isAboutActive ? "active" : ""}`}
              onClick={(e) => handleNavClick(e, "/about")}
            >
              ABOUT
            </a>

            {/* SERVICES */}
            <div className="mobile-nav-group">
              <button
                type="button"
                className="mobile-nav-toggle"
                onClick={() => toggleMobileMenu("services")}
                aria-expanded={openMobileMenu === "services"}
              >
                <span>SERVICES</span>
                <ChevronDown
                  size={15}
                  className={
                    openMobileMenu === "services"
                      ? "mobile-chevron-open"
                      : ""
                  }
                />
              </button>

              {openMobileMenu === "services" && (
                <div className="mobile-submenu">
                  {serviceItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* PORTFOLIO */}
            <div className="mobile-nav-group">
              <button
                type="button"
                className="mobile-nav-toggle"
                onClick={() => toggleMobileMenu("portfolio")}
                aria-expanded={openMobileMenu === "portfolio"}
              >
                <span>PORTFOLIO</span>
                <ChevronDown
                  size={15}
                  className={
                    openMobileMenu === "portfolio"
                      ? "mobile-chevron-open"
                      : ""
                  }
                />
              </button>

              {openMobileMenu === "portfolio" && (
                <div className="mobile-submenu">
                  {portfolioItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* FREE TOOLS */}
            <div className="mobile-nav-group">
              <button
                type="button"
                className="mobile-nav-toggle"
                onClick={() => toggleMobileMenu("tools")}
                aria-expanded={openMobileMenu === "tools"}
              >
                <span className="mobile-nav-label-with-badge">
                  FREE TOOLS
                  <span className="nav-badge">100+</span>
                </span>

                <ChevronDown
                  size={15}
                  className={
                    openMobileMenu === "tools"
                      ? "mobile-chevron-open"
                      : ""
                  }
                />
              </button>

              {openMobileMenu === "tools" && (
                <div className="mobile-submenu">
                  {toolItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* AI TOOLS */}
            <div className="mobile-nav-group">
              <button
                type="button"
                className="mobile-nav-toggle"
                onClick={() => toggleMobileMenu("ai-tools")}
                aria-expanded={openMobileMenu === "ai-tools"}
              >
                <span className="mobile-nav-label-with-badge">
                  AI TOOLS
                  <span className="nav-badge ai-badge">27+</span>
                </span>

                <ChevronDown
                  size={15}
                  className={
                    openMobileMenu === "ai-tools"
                      ? "mobile-chevron-open"
                      : ""
                  }
                />
              </button>

              {openMobileMenu === "ai-tools" && (
                <div className="mobile-submenu">
                  {aiToolItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <a
              href="/contact"
              className={`mobile-nav-link ${isContactActive ? "active" : ""}`}
              onClick={(e) => handleNavClick(e, "/contact")}
            >
              CONTACT
            </a>

            {/* MOBILE CURRENCY QUICK SELECT */}
            <div className="mobile-currency-row">
              <span className="mobile-curr-label">Currency:</span>
              <div className="mobile-curr-pills">
                {currencies.map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    className={`mobile-curr-pill ${
                      curr === currencies[currencyIndex] ? "active" : ""
                    }`}
                    onClick={() => selectCurrency(curr)}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            {/* MOBILE ACTIONS */}
            <div className="mobile-actions">
              <a
                href="/install"
                className="mobile-action-btn"
                onClick={handleInstallClick}
              >
                <Smartphone size={15} />
                INSTALL APP
              </a>

              <a
                href="/contact"
                className="mobile-action-btn mobile-consult"
                onClick={handleConsultClick}
              >
                <span>BOOK A CONSULTATION</span>
                <ArrowUpRight size={15} />
              </a>
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}
