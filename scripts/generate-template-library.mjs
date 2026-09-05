// =============================================================================
// BRANIFY — TEMPLATE LIBRARY GENERATOR
// Reads the extracted Flow AI mockup ZIP and produces:
//   1. public/templates/{slug}.webp      — 800w card thumbnail (lazy-loaded)
//   2. public/templates/{slug}-full.jpg  — 1200w preview + OG image
//   3. src/data/templates/templates.ts   — generated template registry
// One source of truth: this script curates name/slug/category/description from
// the ACTUAL supplied files (70 mockups). Re-run after adding new mockups.
// Usage: bun scripts/generate-template-library.mjs [sourceDir]
// =============================================================================
import { execFileSync } from 'node:child_process';
import { readdirSync, mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

const ROOT = join(import.meta.dir, '..');
const SRC = process.argv[2] || '/tmp/tpl-zip';
const OUT_IMG = join(ROOT, 'public', 'templates');
const OUT_DATA = join(ROOT, 'src', 'data', 'templates');
mkdirSync(OUT_IMG, { recursive: true });
mkdirSync(OUT_DATA, { recursive: true });

// ---------------------------------------------------------------- categories
// Canonical BRANIFY category order (spec §2). counts are derived from data.
export const CATEGORIES = [
  { slug: 'restaurant-food', name: 'Restaurant & Food', tagline: 'Fine dining, bistros and street food brands with menus, reservations and gallery sections.' },
  { slug: 'cafe-coffee', name: 'Café & Coffee', tagline: 'Warm café and specialty coffee experiences with menu boards and store info.' },
  { slug: 'real-estate', name: 'Real Estate', tagline: 'Property listings, agencies and luxury real estate presentations.' },
  { slug: 'fashion-accessories', name: 'Fashion & Accessories', tagline: 'Editorial fashion houses, e-commerce and jewelry collections.' },
  { slug: 'beauty-salon', name: 'Beauty & Salon', tagline: 'Salons, spas and beauty studios with service menus and booking flows.' },
  { slug: 'healthcare-medical', name: 'Healthcare & Medical', tagline: 'Clinics, medical centers and wellness practices built on trust.' },
  { slug: 'interior-design', name: 'Interior Design', tagline: 'Studios and architects presenting spaces, materials and portfolios.' },
  { slug: 'fitness-lifestyle', name: 'Fitness & Lifestyle', tagline: 'Gyms, yoga studios, coaching and wellness brands that move people.' },
  { slug: 'tech-digital', name: 'Tech & Digital', tagline: 'SaaS platforms, apps and digital agencies with conversion-first layouts.' },
  { slug: 'automotive', name: 'Automotive', tagline: 'Dealerships, detailing studios and workshop brands with service menus.' },
  { slug: 'home-services', name: 'Home Services', tagline: 'Cleaning, trade and relocation services with quote-first funnels.' },
  { slug: 'education', name: 'Education', tagline: 'Schools, tutoring and course platforms that turn visitors into students.' },
  { slug: 'business-services', name: 'Business & Professional Services', tagline: 'Consultancies, law firms and B2B practices with authority-led design.' },
  { slug: 'pet-care', name: 'Pet Care', tagline: 'Groomers, spas and veterinary clinics with friendly, trusting layouts.' },
  { slug: 'events-creative', name: 'Events & Creative', tagline: 'Weddings, event production, photography and creative studios.' },
  { slug: 'catering-services', name: 'Catering Services', tagline: 'Caterers and private chefs with menus, packages and enquiry flows.' },
];

// ------------------------------------------------- curation: file → template
// name = display name · s = shortDescription (unique, category-specific)
// f = featured (homepage rotation) · tags = search keywords
const T = (file, slug, name, s, tags, f = false) => ({ file, slug, name, s, tags, f });

const CURATION = [
  // ---- Restaurant & Food (5)
  T('Restaurant_website_homepage_mock…_202609050531.jpeg', 'modern-restaurant', 'Modern Restaurant', 'Polished restaurant homepage with menu presentation, reservations, location and gallery sections for modern dining businesses.', ['restaurant', 'dining', 'menu', 'reservations'], true),
  T('SORA_restaurant_website_mockup_d…_202609050531.jpeg', 'sora-restaurant', 'SORA Restaurant', 'Editorial restaurant design with tasting-menu storytelling, chef profile and elegant food photography layouts.', ['restaurant', 'tasting menu', 'chef', 'editorial']),
  T('KADO_website_homepage_mockup_202609050531.jpeg', 'kado-steakhouse', 'KADO Steakhouse', 'Bold steakhouse template with signature menu grid, chef story, interior gallery and reservation call-to-action.', ['steakhouse', 'fine dining', 'menu', 'reservations'], true),
  T('MAISON_website_homepage_mockup_202609050531.jpeg', 'maison-fine-dining', 'MAISON French Dining', 'Refined French fine-dining template with tasting menus, private dining section and editorial serif typography.', ['french', 'fine dining', 'tasting menu', 'private dining'], true),
  T('Website_homepage_mockup_for_STREET_202609050531.jpeg', 'street-street-food', 'STREET Street Food', 'High-energy street food template with best-seller menu, brand story and online ordering call-to-action.', ['street food', 'burger', 'ordering', 'casual dining']),

  // ---- Café & Coffee (0 in ZIP — category kept for future uploads)

  // ---- Real Estate (1)
  T('ESTATE_luxury_property_website_m…_202609050531.jpeg', 'estate-luxury-property', 'ESTATE Luxury Property', 'Luxury property showcase with hero listings, neighborhood highlights and enquiry-first lead capture.', ['real estate', 'property', 'luxury listings', 'agency'], true),

  // ---- Fashion & Accessories (4)
  T('NOIRÉ_fashion_website_mockup_202609050531.jpeg', 'noire-fashion', 'NOIRÉ Fashion House', 'Moody editorial fashion template with lookbook grids, collection storytelling and campaign hero sections.', ['fashion', 'lookbook', 'editorial', 'collection']),
  T('VELORA_fashion_e-commerce_homepa…_202609050531.jpeg', 'velora-fashion-ecommerce', 'VELORA Fashion E-Commerce', 'Conversion-ready fashion e-commerce layout with product grids, campaign banners and cart-first navigation.', ['fashion', 'e-commerce', 'shop', 'products'], true),
  T('ÉLAN_luxury_e-commerce_website_m…_202609050531.jpeg', 'elan-luxury-leather', 'ÉLAN Luxury Leather Goods', 'Luxury leather goods storefront with craftsmanship story, signature collections and premium product detail layouts.', ['leather', 'luxury e-commerce', 'handbags', 'craftsmanship']),
  T('Luxury_jewelry_website_mockup_de…_202609050531.jpeg', 'luxury-jewelry', 'Lumière Jewelry', 'Elegant jewelry template with collection showcases, stone close-ups and boutique appointment flows.', ['jewelry', 'luxury', 'boutique', 'collections']),

  // ---- Beauty & Salon (1)
  T('Luxury_beauty_salon_website_mockup_202609050531.jpeg', 'luxury-beauty-salon', 'Luxury Beauty Salon', 'Premium salon template with service menus, stylist profiles, pricing tiers and booking call-to-action.', ['salon', 'beauty', 'booking', 'services'], true),

  // ---- Healthcare & Medical (5)
  T('Luxury_dental_clinic_website_mockup_202609050531.jpeg', 'luxury-dental-clinic', 'Luxury Dental Clinic', 'Premium dental clinic template with treatment pages, smile galleries and appointment request funnels.', ['dental', 'clinic', 'appointments', 'treatments']),
  T('Medical_center_website_homepage_…_202609050531.jpeg', 'medical-center', 'Medical Center', 'Comprehensive medical center layout with departments, doctor directories and patient resources.', ['medical center', 'departments', 'doctors', 'patients']),
  T('Medical_clinic_website_mockup_de…_202609050531.jpeg', 'medical-clinic', 'Medical Clinic', 'Clean clinic template with services, care teams, insurance information and contact-first booking.', ['clinic', 'healthcare', 'services', 'booking']),
  T('Physiotherapy_clinic_website_mockup_202609050531.jpeg', 'physiotherapy-clinic', 'Physiotherapy Clinic', 'Physiotherapy template with treatment programs, therapist profiles and recovery storytelling.', ['physiotherapy', 'rehab', 'therapy', 'clinic']),
  T('Website_homepage_mockup_for_SAGE_202609050531.jpeg', 'sage-preventive-health', 'SAGE Preventive Health', 'Preventive health and wellness template with screening programs, expert profiles and membership journeys.', ['wellness', 'preventive health', 'screenings', 'programs'], true),

  // ---- Interior Design (5)
  T('Interior_design_studio_homepage_…_202609050531.jpeg', 'interior-design-studio', 'Interior Design Studio', 'Editorial interior design studio template with project spotlights, process sections and material galleries.', ['interior design', 'studio', 'projects', 'portfolio'], true),
  T('Interior_design_studio_website_m…_202609050531.jpeg', 'interior-design-showcase', 'Interior Design Showcase', 'Image-led interior showcase with full-bleed project photography and minimal editorial typography.', ['interior design', 'showcase', 'photography', 'projects']),
  T('Interior_design_website_mockup_202609050531.jpeg', 'interior-design-agency', 'Interior Design Agency', 'Agency-style interior template with service pages, room categories and consultation enquiries.', ['interior design', 'agency', 'services', 'consultation']),
  T('Architecture_studio_website_mock…_202609050531.jpeg', 'architecture-studio', 'Architecture Studio', 'Restrained architecture portfolio with project grids, studio philosophy and material-focused layouts.', ['architecture', 'studio', 'projects', 'minimal']),
  T('Website_mockup_for_architecture_…_202609050531.jpeg', 'mono-architecture', 'MONO Architecture', 'Precision architecture template — “Less, better” — with editorial serif project pages and services list.', ['architecture', 'precision', 'editorial', 'portfolio'], true),

  // ---- Fitness & Lifestyle (5)
  T('Website_homepage_mockup_for_BALANCE_202609050531.jpeg', 'balance-wellness', 'BALANCE Wellness Platform', 'Lifestyle wellness template with movement, nutrition and recovery programs plus membership pricing.', ['wellness', 'lifestyle', 'membership', 'nutrition']),
  T('Website_homepage_mockup_for_PULSE_202609050531.jpeg', 'pulse-fitness-studio', 'PULSE Fitness Studio', 'Performance gym template with training disciplines, class timetables, coach profiles and membership tiers.', ['gym', 'fitness', 'classes', 'membership']),
  T('Website_homepage_mockup_for_yoga_202609050531.jpeg', 'soma-yoga-studio', 'SŌMA Yoga Studio', 'Serene yoga studio template with class schedules, teacher profiles, retreats and pricing plans.', ['yoga', 'studio', 'classes', 'retreats']),
  T('NUTRA_nutrition_coaching_homepag…_202609050531.jpeg', 'nutra-nutrition-coaching', 'NUTRA Nutrition Coaching', 'Nutrition coaching template with program packages, transformation stories and consultation booking.', ['nutrition', 'coaching', 'health', 'programs']),
  T('Wellness_retreat_website_homepag…_202609050531.jpeg', 'wellness-retreat', 'Wellness Retreat', 'Tranquil retreat template with stay packages, daily schedules and immersive nature photography.', ['retreat', 'spa', 'wellness', 'bookings']),

  // ---- Tech & Digital (3)
  T('AUTOMATA_SaaS_website_homepage_m…_202609050531.jpeg', 'automata-ai-saas', 'AUTOMATA AI SaaS', 'Dark-mode AI automation SaaS template with workflow visualizations, integration grids and pricing sections.', ['saas', 'ai', 'automation', 'dark mode'], true),
  T('Productivity_app_website_mockup_202609050531.jpeg', 'flow-productivity-app', 'FLOW Productivity App', 'App-launch template with device showcases, feature walks, app-store badges and pricing tiers.', ['app', 'productivity', 'mobile', 'landing page']),
  T('Website_mockup_for_IT_agency_202609050531.jpeg', 'it-agency', 'IT Agency', 'B2B IT services template with capability grids, case studies and technical authority sections.', ['it services', 'agency', 'b2b', 'technology']),

  // ---- Automotive (3)
  T('Automotive_workshop_website_mock…_202609050531.jpeg', 'automotive-workshop', 'Automotive Workshop', 'Workshop template with service menus, booking forms and trust-building garage photography.', ['workshop', 'garage', 'repairs', 'booking']),
  T('Luxury_car_dealership_homepage_m…_202609050531.jpeg', 'luxury-car-dealership', 'Luxury Car Dealership', 'Premium dealership template with inventory showcases, model highlights and test-drive enquiries.', ['dealership', 'luxury cars', 'inventory', 'test drive'], true),
  T('Luxury_car_detailing_website_mockup_202609050531.jpeg', 'luxury-car-detailing', 'Luxury Car Detailing', 'Detailing studio template with service packages, before/after galleries and booking call-to-action.', ['detailing', 'car care', 'packages', 'booking']),

  // ---- Home Services (7)
  T('Cleaning_company_website_mockup_…_202609050531.jpeg', 'cleaning-company', 'Cleaning Company', 'Quote-first cleaning template with service checklists, pricing tiers and trust signals.', ['cleaning', 'home services', 'quotes', 'booking'], true),
  T('Cleaning_company_website_mockup_…_202609050531_2.jpeg', 'cleaning-company-pro', 'Cleaning Company Pro', 'Alternate cleaning design with bold hero, process timeline and instant-quote funnel.', ['cleaning', 'quote funnel', 'process', 'home services']),
  T('Electrical_contractor_website_mo…_202609050531.jpeg', 'electrical-contractor', 'Electrical Contractor', 'Trade template for electricians with certified services, emergency callouts and coverage areas.', ['electrician', 'contractor', 'emergency', 'trade']),
  T('Home_maintenance_website_mockup_…_202609050531.jpeg', 'home-maintenance', 'Home Maintenance', 'Handyman and maintenance template with service bundles, plans and request-a-visit flows.', ['maintenance', 'handyman', 'repairs', 'plans']),
  T('Movers_website_mockup_design_202609050531.jpeg', 'professional-movers', 'Professional Movers', 'Moving company template with instant estimates, service comparisons and review walls.', ['movers', 'moving', 'estimates', 'relocation']),
  T('Moving_company_website_mockup_202609050531.jpeg', 'moving-company', 'Moving Company', 'Bold moving template with route highlights, pricing calculators and booking steps.', ['moving', 'relocation', 'pricing', 'booking']),
  T('Relocation_website_UI_mockup_tra…_202609050531.jpeg', 'relocation-services', 'Relocation Services', 'International relocation template with destination guides, corporate plans and consultation forms.', ['relocation', 'international', 'corporate', 'guides']),

  // ---- Education (6)
  T('NEXA_website_homepage_mockup_202609050531.jpeg', 'nexa-tutoring', 'NEXA Academic Tutoring', 'Tutoring template with subject grids, expert mentors, result stats and enrollment funnels.', ['tutoring', 'education', 'subjects', 'enrollment'], true),
  T('Website_homepage_mockup_for_ASCEND_202609050531.jpeg', 'ascend-exam-prep', 'ASCEND Exam Prep', 'Exam-preparation template with mock tests, progress dashboards and program comparison tables.', ['exam prep', 'tests', 'courses', 'dashboard']),
  T('Website_homepage_mockup_for_educ…_202609050531.jpeg', 'masterly-online-courses', 'MASTERLY Online Courses', 'Creator-led course platform with masterclass collections, expert spotlights and membership upsells.', ['courses', 'e-learning', 'masterclass', 'membership']),
  T('Language_school_website_mockup_d…_202609050531.jpeg', 'language-school', 'Language School', 'Language school template with course levels, teacher intros and trial-lesson signups.', ['language school', 'courses', 'teachers', 'signups']),
  T('Polyglot_website_homepage_mockup_202609050531.jpeg', 'polyglot-language-learning', 'Polyglot Language Learning', 'App-style language learning template with lesson previews, level paths and pricing.', ['language learning', 'app', 'lessons', 'pricing']),
  T('Tutoring_service_website_homepag…_202609050531.jpeg', 'tutoring-service', 'Tutoring Service', 'Friendly tutoring template with subject cards, tutor matching and parent testimonials.', ['tutoring', 'matching', 'subjects', 'testimonials']),

  // ---- Business & Professional Services (11)
  T('Consulting_firm_website_homepage…_202609050531.jpeg', 'consulting-firm', 'Consulting Firm', 'Authority-led consulting template with practice areas, case studies and partner profiles.', ['consulting', 'b2b', 'case studies', 'strategy']),
  T('Insurance_consultancy_website_ho…_202609050531.jpeg', 'insurance-consultancy', 'Insurance Consultancy', 'Trust-first insurance template with coverage explainers, advisor profiles and quote requests.', ['insurance', 'coverage', 'advisors', 'quotes']),
  T('Tax_consultancy_website_homepage…_202609050531.jpeg', 'tax-consultancy', 'Tax Consultancy', 'Tax advisory template with service breakdowns, seasonal CTAs and credential-led credibility.', ['tax', 'accounting', 'advisory', 'compliance']),
  T('Legal_consultancy_website_homepa…_202609050531.jpeg', 'legal-consultancy', 'Legal Consultancy', 'Legal consultancy template with practice areas, counsel bios and confidential enquiry flows.', ['legal', 'consultancy', 'practice areas', 'enquiries']),
  T('Law_firm_website_mockup_202609050531.jpeg', 'corporate-law-firm', 'Corporate Law Firm', 'Authoritative law firm template with practice groups, attorney profiles and landmark case results.', ['law firm', 'corporate law', 'attorneys', 'cases']),
  T('Law_firm_website_mockup_202609050531_2.jpeg', 'modern-law-firm', 'Modern Law Firm', 'Contemporary legal template with editorial layouts, sector expertise and consultation booking.', ['law firm', 'modern', 'sectors', 'consultation']),
  T('Law_firm_website_mockup_design_202609050531.jpeg', 'boutique-law-firm', 'Boutique Law Firm', 'Boutique practice template with partner storytelling, selective casework and refined typography.', ['law firm', 'boutique', 'partners', 'selective']),
  T('Website_mockup_for_law_firm_202609050531.jpeg', 'classic-law-firm', 'Classic Law Firm', 'Traditional law template with heritage cues, practice listings and office location sections.', ['law firm', 'traditional', 'heritage', 'offices']),
  T('Website_mockup_for_VERITY_law_202609050531.jpeg', 'verity-law', 'VERITY Law', 'Statement legal brand template with bold typography, practice pillars and principal profiles.', ['law firm', 'brand', 'pillars', 'profiles'], true),
  T('NOVA_FINANCE_homepage_website_mo…_202609050531.jpeg', 'nova-finance-advisory', 'NOVA Finance Advisory', 'Wealth management template with advisory service grids, strategist teams and insight journals.', ['finance', 'wealth management', 'advisory', 'insights'], true),
  T('Website_homepage_mockup_for_IMPACT_202609050531.jpeg', 'impact-executive-coaching', 'IMPACT Executive Coaching', 'Executive coaching template with program journeys, coach philosophy and client story walls.', ['coaching', 'leadership', 'programs', 'executive'], true),

  // ---- Pet Care (4)
  T('Pet_grooming_website_homepage_mo…_202609050531.jpeg', 'pet-grooming-studio', 'Pet Grooming Studio', 'Friendly grooming template with service menus, groomer profiles and appointment booking.', ['pet grooming', 'dogs', 'booking', 'services']),
  T('Pet_grooming_website_mockup_202609050531.jpeg', 'pet-grooming-boutique', 'Pet Grooming Boutique', 'Boutique pet care design with playful styling, package cards and happy-client galleries.', ['pet grooming', 'boutique', 'packages', 'gallery']),
  T('Pet_spa_website_mockup_202609050531.jpeg', 'pet-spa-wellness', 'Pet Spa & Wellness', 'Relaxing pet spa template with treatment menus, wellness packages and gentle booking flows.', ['pet spa', 'wellness', 'treatments', 'booking']),
  T('Veterinary_clinic_website_homepa…_202609050531.jpeg', 'veterinary-clinic', 'Veterinary Clinic', 'Caring veterinary template with services, team introductions and emergency contact prominence.', ['veterinary', 'clinic', 'pets', 'emergency'], true),

  // ---- Events & Creative (10)
  T('Website_homepage_mockup_for_STAGE_202609050531.jpeg', 'stage-event-production', 'STAGE Event Production', 'Corporate event production template with case studies, capability grids and global project maps.', ['events', 'production', 'conferences', 'staging'], true),
  T('Luxury_wedding_planner_website_m…_202609050531.jpeg', 'luxury-wedding-planner', 'Luxury Wedding Planner', 'Elegant wedding planning template with real weddings, service tiers and enquiry journeys.', ['wedding', 'planner', 'luxury', 'events']),
  T('Wedding_planner_website_homepage…_202609050531.jpeg', 'wedding-planner', 'Wedding Planner', 'Romantic wedding template with portfolio galleries, planning steps and date-check enquiries.', ['wedding', 'planning', 'portfolio', 'enquiry']),
  T('Wedding_studio_website_homepage_…_202609050531.jpeg', 'wedding-studio', 'Wedding Studio', 'Wedding studio template with storytelling layouts, venue features and package highlights.', ['wedding', 'studio', 'venues', 'packages']),
  T('Website_mockup_for_MOMENT_studio_202609050531.jpeg', 'moment-photo-studio', 'MOMENT Photo Studio', 'Commercial photo studio template with case studies, production process and shoot bookings.', ['photography', 'studio', 'commercial', 'booking'], true),
  T('Photographer_website_homepage_mo…_202609050531.jpeg', 'photographer-portfolio', 'Photographer Portfolio', 'Personal photographer portfolio with masonry galleries, about story and session enquiries.', ['photographer', 'portfolio', 'galleries', 'sessions']),
  T('Photography_portfolio_website_mo…_202609050531.jpeg', 'photography-portfolio', 'Photography Portfolio', 'Minimal photography portfolio with series-based galleries and print shop readiness.', ['photography', 'portfolio', 'series', 'minimal']),
  T('LUMEN_photography_portfolio_webs…_202609050531.jpeg', 'lumen-photography', 'LUMEN Photography', 'Light-led photography brand template with dramatic hero imagery and collection pages.', ['photography', 'lumen', 'collections', 'brand']),
  T('Architectural_photography_portfo…_202609050531.jpeg', 'still-architectural-photography', 'STILL Architectural Photography', 'Architectural photography portfolio with selected projects, philosophy sections and inquiry forms.', ['architecture photography', 'portfolio', 'projects', 'inquiry']),
  T('Website_mockup_for_interior_phot…_202609050531.jpeg', 'spaceframe-interior-photography', 'SPACEFRAME Interior Photography', 'Interior photography studio template with material detail galleries and collaboration-led CTAs.', ['interior photography', 'materials', 'studio', 'collaboration']),

  // ---- Catering Services (0 in ZIP — category kept for future uploads)
];

// ------------------------------------------------------------------ helpers
const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-');
const strip = (s) => s.replace(/…/g, '').replace(/_2026\d+\.jpe?g$/i, '');

const categorySlugBySlug = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.name]));

// Category assignment derived from the curation order above
const CATEGORY_OF = [
  ['restaurant-food', 5], ['real-estate', 1], ['fashion-accessories', 4], ['beauty-salon', 1],
  ['healthcare-medical', 5], ['interior-design', 5], ['fitness-lifestyle', 5], ['tech-digital', 3],
  ['automotive', 3], ['home-services', 7], ['education', 6], ['business-services', 11],
  ['pet-care', 4], ['events-creative', 10],
];
function categoryFor(index) {
  let acc = 0;
  for (const [slug, n] of CATEGORY_OF) { acc += n; if (index < acc) return slug; }
  return 'events-creative';
}

// ------------------------------------------------------------- images (ffmpeg)
const files = readdirSync(SRC).filter((f) => /\.jpe?g$/i.test(f));
console.log(`Source images: ${files.length}`);
const slugSet = new Set();
let missing = 0;

for (const file of files) {
  const entry = CURATION.find((c) => c.file === file);
  if (!entry) { console.warn(`!! Unmapped source file: ${file}`); missing++; continue; }
  if (slugSet.has(entry.slug)) throw new Error(`Duplicate slug: ${entry.slug}`);
  slugSet.add(entry.slug);

  const srcPath = join(SRC, file);
  const thumb = join(OUT_IMG, `${entry.slug}.webp`);
  const full = join(OUT_IMG, `${entry.slug}-full.jpg`);
  const needThumb = !existsSync(thumb) || statSync(thumb).mtime < statSync(srcPath).mtime;
  const needFull = !existsSync(full) || statSync(full).mtime < statSync(srcPath).mtime;
  if (needThumb) {
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', srcPath, '-vf', 'scale=800:-2', '-quality', '82', thumb]);
  }
  if (needFull) {
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', srcPath, '-vf', 'scale=1200:-2', '-q:v', '5', full]);
  }
}
const unmappedCuration = CURATION.filter((c) => !files.includes(c.file));
if (unmappedCuration.length) console.warn(`!! Curation entries without files: ${unmappedCuration.map((c) => c.slug).join(', ')}`);
if (missing) throw new Error(`${missing} source files unmapped — fix CURATION`);

// ------------------------------------------------------------- registry (TS)
const catName = (slug) => categorySlugBySlug[slug];
const KEYWORDS_EXTRA = {
  'restaurant-food': ['website template', 'restaurant web design'],
  'real-estate': ['website template', 'real estate web design'],
  'fashion-accessories': ['website template', 'fashion web design'],
  'beauty-salon': ['website template', 'salon web design'],
  'healthcare-medical': ['website template', 'medical web design'],
  'interior-design': ['website template', 'interior design web design'],
  'fitness-lifestyle': ['website template', 'fitness web design'],
  'tech-digital': ['website template', 'saas web design'],
  'automotive': ['website template', 'automotive web design'],
  'home-services': ['website template', 'home services web design'],
  'education': ['website template', 'education web design'],
  'business-services': ['website template', 'business web design'],
  'pet-care': ['website template', 'pet care web design'],
  'events-creative': ['website template', 'creative web design'],
};

let order = 0;
const catCounter = {};
const rows = CURATION.map((c, i) => {
  const categorySlug = categoryFor(i);
  catCounter[categorySlug] = (catCounter[categorySlug] || 0) + 1;
  const idx = catCounter[categorySlug];
  order += 1;
  const desc = `${c.s} Includes a responsive layout, editable sections and a premium visual style ready to launch.`;
  const seoDesc = `${c.name} website template — ${c.s.charAt(0).toLowerCase()}${c.s.slice(1)} Preview the design and start with this template at BRANIFY.`;
  return {
    id: `tpl-${String(order).padStart(3, '0')}`,
    slug: c.slug,
    name: c.name,
    category: catName(categorySlug),
    categorySlug,
    description: desc,
    shortDescription: c.s,
    thumbnail: `/templates/${c.slug}.webp`,
    previewImage: `/templates/${c.slug}-full.jpg`,
    tags: c.tags,
    industry: catName(categorySlug),
    responsive: true,
    featured: c.f,
    status: 'published',
    order,
    categoryName: catName(categorySlug),
    idxInCategory: idx,
    seoTitle: `${c.name} Website Template`,
    seoDescription: seoDesc,
    seoKeywords: [...c.tags, ...KEYWORDS_EXTRA[categorySlug]],
  };
});

const ts = `// =============================================================================
// AUTO-GENERATED by scripts/generate-template-library.mjs — DO NOT EDIT BY HAND.
// Source of truth: the supplied Flow AI template mockups (${rows.length} templates,
// ${CATEGORIES.length} canonical categories). Re-run the script after adding new mockups.
// =============================================================================

export interface TemplateRecord {
  id: string;
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  previewImage: string;
  tags: string[];
  industry: string;
  responsive: boolean;
  featured: boolean;
  status: 'published' | 'draft';
  order: number;
  seo: { title: string; description: string; keywords: string[]; ogImage: string };
}

export const templatesRegistry: TemplateRecord[] = [
${rows.map((r) => `  {
    id: '${r.id}',
    slug: '${r.slug}',
    name: ${JSON.stringify(r.name)},
    category: ${JSON.stringify(r.category)},
    categorySlug: '${r.categorySlug}',
    description: ${JSON.stringify(r.description)},
    shortDescription: ${JSON.stringify(r.shortDescription)},
    thumbnail: '${r.thumbnail}',
    previewImage: '${r.previewImage}',
    tags: ${JSON.stringify(r.tags)},
    industry: ${JSON.stringify(r.industry)},
    responsive: ${r.responsive},
    featured: ${r.featured},
    status: '${r.status}',
    order: ${r.order},
    seo: {
      title: ${JSON.stringify(r.seoTitle)},
      description: ${JSON.stringify(r.seoDescription)},
      keywords: ${JSON.stringify(r.seoKeywords)},
      ogImage: '${r.previewImage}',
    },
  },`).join('\n')}
];

export default templatesRegistry;
`;
writeFileSync(join(OUT_DATA, 'templates.ts'), ts);

console.log(`Generated templates.ts with ${rows.length} templates`);
const counts = {};
for (const r of rows) counts[r.category] = (counts[r.category] || 0) + 1;
console.log(JSON.stringify(counts, null, 2));
console.log(`Featured: ${rows.filter((r) => r.featured).length}`);
