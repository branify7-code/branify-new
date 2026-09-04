/* =========================================================
   Seo — 1:1 replica of branify.store's <Seo/> head manager.
   Sets document.title, meta description/keywords/robots,
   canonical + Open Graph + Twitter tags, and a single
   dynamic JSON-LD @graph (Organization, WebSite, WebPage,
   Breadcrumbs, FAQs, Service, Product, SoftwareApplication).
========================================================= */

import React, { useEffect } from 'react';
import { getSeoOverride } from '../lib/contentOverrides';

const SITE_URL = 'https://branify.store';
const DEFAULT_DESCRIPTION =
  'BRANIFY — International digital agency offering custom web development, WordPress, UI/UX design, branding, SEO, digital marketing and AI-powered digital solutions for businesses worldwide.';
const DEFAULT_KEYWORDS = [
  'BRANIFY',
  'digital agency',
  'web development',
  'custom website development',
  'business website development',
  'WordPress development',
  'UI UX design',
  'brand identity design',
  'AI automation solutions',
  'free online tools',
  'digital products',
  'templates',
];
const DEFAULT_OG_IMAGE =
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80';

export interface SeoBreadcrumb {
  name: string;
  url: string;
}

export interface SeoFaq {
  question: string;
  answer: string;
}

export interface SeoServiceSchema {
  name: string;
  description: string;
  serviceType?: string;
  areaServed?: string;
}

interface SeoProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalPath?: string;
  ogType?: string;
  ogImage?: string;
  breadcrumbs?: SeoBreadcrumb[];
  faqs?: SeoFaq[];
  serviceSchema?: SeoServiceSchema;
}

export const Seo: React.FC<SeoProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonicalPath = '',
  ogType = 'website',
  ogImage = DEFAULT_OG_IMAGE,
  breadcrumbs,
  faqs,
  serviceSchema,
}) => {
  useEffect(() => {
    const originalTitle = document.title;
    const fullTitle = title ? (title.includes('BRANIFY') ? title : `${title} | BRANIFY`) : 'BRANIFY — Build. Brand. Grow. | Digital Agency & Software Marketplace';
    document.title = fullTitle;

    const setMeta = (key: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${key}"]` : `meta[name="${key}"]`;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        if (isProperty) el.setAttribute('property', key);
        else el.setAttribute('name', key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    setMeta('description', description);
    setMeta('keywords', keywords.join(', '));
    setMeta('robots', 'index, follow');

    const path = canonicalPath === '/' || !canonicalPath ? '/' : canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
    const canonicalUrl = path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;
    setLink('canonical', canonicalUrl);

    setMeta('og:title', fullTitle, true);
    setMeta('og:description', description, true);
    setMeta('og:type', ogType, true);
    setMeta('og:url', canonicalUrl, true);
    setMeta('og:image', ogImage, true);
    setMeta('og:site_name', 'BRANIFY', true);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    setMeta('twitter:image', ogImage);

    const graph: Record<string, unknown>[] = [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'BRANIFY',
        url: SITE_URL,
        logo: `${SITE_URL}/branify-logo.png`,
        description: 'BRANIFY is an international full-stack digital agency providing custom web development, brand identity design, AI solutions, and digital products.',
        email: 'admin@branify.store',
        telephone: '+92-332-1029333',
        contactPoint: [
          { '@type': 'ContactPoint', telephone: '+92-332-1029333', contactType: 'customer service', email: 'admin@branify.store', availableLanguage: ['English', 'Bengali', 'Urdu', 'Arabic'] },
          { '@type': 'ContactPoint', telephone: '+1-581-907-2960', contactType: 'head office', email: 'admin@branify.store', availableLanguage: ['English'] },
        ],
        sameAs: [
          'https://www.instagram.com/branify001',
          'https://www.facebook.com/share/14mz5a1BDXB/',
          'https://linkedin.com/company/branify',
          'https://x.com/branify_store',
          'https://github.com/branify',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'BRANIFY',
        description: 'Custom Web Development, Brand Identity, and Digital Solutions Agency',
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
      {
        '@type': 'WebPage',
        '@id': `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: fullTitle,
        description,
        isPartOf: { '@id': `${SITE_URL}/#website` },
      },
    ];

    if (breadcrumbs && breadcrumbs.length > 0) {
      graph.push({
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: breadcrumbs.map((b, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: b.name,
          item: b.url.startsWith('http') ? b.url : `${SITE_URL}${b.url.startsWith('/') ? b.url : `/${b.url}`}`,
        })),
      });
    }

    if (faqs && faqs.length > 0) {
      graph.push({
        '@type': 'FAQPage',
        '@id': `${canonicalUrl}#faq`,
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      });
    }

    if (serviceSchema) {
      graph.push({
        '@type': 'Service',
        '@id': `${canonicalUrl}#service`,
        name: serviceSchema.name,
        description: serviceSchema.description,
        serviceType: serviceSchema.serviceType || serviceSchema.name,
        provider: { '@id': `${SITE_URL}/#organization` },
        areaServed: serviceSchema.areaServed || 'Worldwide',
      });
    }

    const jsonLd = { '@context': 'https://schema.org', '@graph': graph };
    let script = document.getElementById('dynamic-jsonld');
    if (!script) {
      script = document.createElement('script');
      script.id = 'dynamic-jsonld';
      script.setAttribute('type', 'application/ld+json');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd);

    // Admin SEO overrides (highest priority — managed from /admin SEO Center)
    try {
      const ov = getSeoOverride(typeof window !== 'undefined' ? window.location.pathname : '/');
      if (ov) {
        if (ov.title) {
          document.title = ov.title;
          setMeta('og:title', ov.title, true);
          setMeta('twitter:title', ov.title);
        }
        if (ov.description) {
          setMeta('description', ov.description);
          setMeta('og:description', ov.description, true);
          setMeta('twitter:description', ov.description);
        }
        if (ov.ogImage) {
          setMeta('og:image', ov.ogImage, true);
          setMeta('twitter:image', ov.ogImage);
        }
        if (ov.robots) setMeta('robots', ov.robots.replace(/,\s*/g, ', '));
      }
    } catch { /* overrides optional */ }

    return () => {
      document.title = originalTitle;
    };
  }, [title, description, keywords, canonicalPath, ogType, ogImage, breadcrumbs, faqs, serviceSchema]);

  return null;
};

export default Seo;
