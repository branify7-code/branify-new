import React from 'react';
import Seo from '../../components/Seo';

/* ------------------------------------------------------------------ */
/* LegalPageView — dedicated page per legal document, replica of      */
/* branify.store's legal pages (← Back to Home, big title card).      */
/* Canonical routes requested by the owner:                           */
/*   /privacypolicy  /termsandconditions  /refundpolicy               */
/*   /disclaimer      /cookiespolicy                                  */
/* Legacy aliases (/privacy, /terms, /refund, /cookies) redirect.     */
/* ------------------------------------------------------------------ */

interface LegalDoc {
  slug: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  /** undefined → use the shared BRANIFY compliance body (like live) */
  customBody?: Array<{ heading?: string; text: string }>;
}

const SHARED_BODY: Array<{ heading: string; text: string }> = [
  {
    heading: '',
    text: 'At BRANIFY (branify.store), we are committed to upholding transparency, data privacy, and ethical software development standards for all international clients and store visitors.',
  },
  {
    heading: '1. Information Collection & Usage',
    text: 'We collect personal information necessary to deliver custom web services, invoice processing, and instant digital asset downloads (such as your name, email address, and project brief requirements). We never sell or rent your personal information to third parties.',
  },
  {
    heading: '2. Digital Store & Instant Downloads',
    text: 'All digital products, including AI Prompt Kits, Canva Design Templates, and Notion Workspaces, are delivered electronically via email and instant portal access upon order confirmation.',
  },
  {
    heading: '3. Refund & Satisfaction Guarantee',
    text: 'Because digital assets are delivered instantly in full source format, sales of digital downloads are final once delivered. For custom agency services (Website Development, Branding, AI Solutions), refunds are governed by the custom milestone agreement signed prior to project commencement.',
  },
  {
    heading: '4. Questions & Legal Inquiries',
    text: 'For any questions, copyright notices, custom SLA agreements, or data removal requests, please reach our executive compliance desk directly at [admin@branify.store](mailto:admin@branify.store).',
  },
];

const LEGAL_DOCS: Record<string, LegalDoc> = {
  '/privacypolicy': {
    slug: '/privacypolicy',
    title: 'Privacy Policy',
    seoTitle: 'Privacy Policy | BRANIFY',
    seoDescription:
      'How BRANIFY collects, uses, and protects personal information for international web development, branding, and digital product clients.',
  },
  '/termsandconditions': {
    slug: '/termsandconditions',
    title: 'Terms of Service',
    seoTitle: 'Terms of Service | BRANIFY',
    seoDescription:
      'The terms and conditions that govern the use of BRANIFY digital services, downloads, and the branify.store website.',
  },
  '/refundpolicy': {
    slug: '/refundpolicy',
    title: 'Refund & Cancellation Policy',
    seoTitle: 'Refund & Cancellation Policy | BRANIFY',
    seoDescription:
      'BRANIFY refund and cancellation terms for instant digital downloads and custom agency service engagements.',
  },
  '/disclaimer': {
    slug: '/disclaimer',
    title: 'Legal Disclaimer',
    seoTitle: 'Legal Disclaimer | BRANIFY',
    seoDescription:
      'Legal disclaimer and trademark notices covering BRANIFY case studies, portfolio content, and digital publications.',
  },
  '/cookiespolicy': {
    slug: '/cookiespolicy',
    title: 'Cookies Policy',
    seoTitle: 'Cookies Policy | BRANIFY',
    seoDescription:
      'How BRANIFY uses cookies and local browser storage for Progressive Web App caching and site preferences.',
    customBody: [
      {
        heading: '',
        text: 'BRANIFY uses strictly essential local browser storage items necessary for Progressive Web App offline caching, theme synchronization, and announcement bar dismissal state.',
      },
      {
        heading: '1. Essential Storage Only',
        text: 'We do not utilize invasive third-party cross-site advertising trackers or behavioral pixels. You can manage or purge local storage at any time via your browser settings.',
      },
      {
        heading: '2. Questions & Legal Inquiries',
        text: 'For any questions, copyright notices, custom SLA agreements, or data removal requests, please reach our executive compliance desk directly at [admin@branify.store](mailto:admin@branify.store).',
      },
    ],
  },
};

export const LEGAL_CANONICAL_PATHS = Object.keys(LEGAL_DOCS);

/* Old repo-era URLs → canonical owner-requested slugs. */
export const LEGACY_LEGAL_REDIRECTS: Record<string, string> = {
  '/privacy': '/privacypolicy',
  '/privacy-policy': '/privacypolicy',
  '/terms': '/termsandconditions',
  '/terms-and-conditions': '/termsandconditions',
  '/refund': '/refundpolicy',
  '/refund-policy': '/refundpolicy',
  '/cookies': '/cookiespolicy',
};

interface LegalPageViewProps {
  /** canonical path, e.g. '/privacypolicy' */
  docPath: string;
  onNavigateHome: () => void;
}

function renderText(text: string): React.ReactNode {
  // Supports the single [label](mailto:…) mailto link used in the body.
  const m = text.match(/\[([^\]]+)\]\((mailto:[^)]+)\)/);
  if (!m) return text;
  const [full, label, href] = m;
  const [before, after] = text.split(full);
  return (
    <>
      {before}
      <a href={href} className="text-[#F27D26] hover:underline font-bold">
        {label}
      </a>
      {after}
    </>
  );
}

export const LegalPageView: React.FC<LegalPageViewProps> = ({ docPath, onNavigateHome }) => {
  const doc = LEGAL_DOCS[docPath] || LEGAL_DOCS['/privacypolicy'];
  const body = doc.customBody || SHARED_BODY;

  return (
    <>
      <Seo title={doc.seoTitle} description={doc.seoDescription} canonicalPath={doc.slug} />
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          ← Back to Home
        </button>

        <div className="bg-[#080808] border border-white/10 rounded-3xl p-8 sm:p-12 space-y-6 shadow-2xl">
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">{doc.title}</h1>
          <div className="text-xs text-zinc-500 font-bold uppercase">Last Updated: January 1, 2026</div>
          <div className="text-xs text-zinc-300 leading-relaxed space-y-4 font-normal">
            {body.map((section, i) => (
              <React.Fragment key={i}>
                {section.heading ? (
                  <h3 className="text-sm font-bold text-white uppercase pt-2">{section.heading}</h3>
                ) : null}
                <p>{renderText(section.text)}</p>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default LegalPageView;
