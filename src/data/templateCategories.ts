/* =========================================================
   BRANIFY — template library CATEGORIES (lightweight module)
   Split from templates/index.ts so boot-graph consumers (Header
   mega menu) get the category list WITHOUT pulling the full
   118-template registry into the main bundle. templates/index.ts
   re-exports everything here for API compatibility.
========================================================= */

export interface TemplateCategory {
  slug: string;
  name: string;
  /** Short blurb shown on category cards + library category navigation. */
  tagline: string;
  /** Longer hero paragraph for the category page (category-specific). */
  heroDescription: string;
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    slug: 'restaurant-food', name: 'Restaurant & Food',
    tagline: 'Fine dining, bistros and street food brands.',
    heroDescription: 'Explore responsive restaurant website templates designed for modern dining businesses, cafés, food brands and hospitality companies — with menu presentation, reservations and gallery sections built in.',
  },
  // cafe-coffee (Café & Coffee) REMOVED by owner request (2026-09) — do not re-add.
  {
    slug: 'real-estate', name: 'Real Estate',
    tagline: 'Property listings and luxury real estate.',
    heroDescription: 'Explore real estate website templates designed for agencies, brokerages and luxury property brands — with listing showcases, neighborhood highlights and enquiry-first lead capture.',
  },
  {
    slug: 'fashion-accessories', name: 'Fashion & Accessories',
    tagline: 'Editorial fashion, e-commerce and jewelry.',
    heroDescription: 'Explore fashion website templates designed for labels, boutiques and accessory brands — with lookbook grids, collection storytelling and conversion-ready product layouts.',
  },
  {
    slug: 'beauty-salon', name: 'Beauty & Salon',
    tagline: 'Salons, spas and beauty studios.',
    heroDescription: 'Explore beauty and salon website templates designed for salons, spas and beauty studios — with service menus, stylist profiles and booking call-to-actions built in.',
  },
  {
    slug: 'healthcare-medical', name: 'Healthcare & Medical',
    tagline: 'Clinics, medical centers and wellness practices.',
    heroDescription: 'Explore healthcare website templates designed for clinics, medical centers and wellness practices — with department pages, doctor directories and appointment funnels.',
  },
  {
    slug: 'interior-design', name: 'Interior Design',
    tagline: 'Studios and architects presenting spaces.',
    heroDescription: 'Explore interior design and architecture website templates designed for studios and practices — with project spotlights, material galleries and consultation enquiries.',
  },
  {
    slug: 'fitness-lifestyle', name: 'Fitness & Lifestyle',
    tagline: 'Gyms, yoga studios and wellness brands.',
    heroDescription: 'Explore fitness and lifestyle website templates designed for gyms, studios, coaches and wellness brands — with class schedules, trainer profiles and membership tiers.',
  },
  {
    slug: 'tech-digital', name: 'Tech & Digital',
    tagline: 'SaaS platforms, apps and digital agencies.',
    heroDescription: 'Explore tech and SaaS website templates designed for software platforms, apps and digital agencies — with feature walkthroughs, integration grids and pricing sections.',
  },
  {
    slug: 'automotive', name: 'Automotive',
    tagline: 'Dealerships, detailing and workshops.',
    heroDescription: 'Explore automotive website templates designed for dealerships, detailing studios and workshops — with inventory showcases, service menus and test-drive funnels.',
  },
  {
    slug: 'home-services', name: 'Home Services',
    tagline: 'Cleaning, trade and relocation services.',
    heroDescription: 'Explore home services website templates designed for cleaning, trade and relocation companies — with quote-first funnels, service checklists and trust signals.',
  },
  {
    slug: 'education', name: 'Education',
    tagline: 'Schools, tutoring and course platforms.',
    heroDescription: 'Explore education website templates designed for schools, tutors and course platforms — with subject grids, program pages and enrollment funnels.',
  },
  {
    slug: 'business-services', name: 'Business & Professional Services',
    tagline: 'Consultancies, law firms and B2B practices.',
    heroDescription: 'Explore professional services website templates designed for consultancies, law firms and B2B practices — with authority-led design, case studies and enquiry flows.',
  },
  {
    slug: 'pet-care', name: 'Pet Care',
    tagline: 'Groomers, spas and veterinary clinics.',
    heroDescription: 'Explore pet care website templates designed for groomers, spas and veterinary clinics — with service menus, team introductions and friendly booking flows.',
  },
  {
    slug: 'events-creative', name: 'Events & Creative',
    tagline: 'Weddings, event production and photography.',
    heroDescription: 'Explore events and creative website templates designed for wedding planners, event producers, photographers and studios — with portfolio galleries and enquiry journeys.',
  },
  {
    slug: 'catering-services', name: 'Catering Services',
    tagline: 'Caterers and private chefs.',
    heroDescription: 'Explore catering website templates designed for caterers and private chefs — with menus, package tiers and enquiry flows that turn visitors into bookings.',
  },
];

/** Canonical category URL — one route scheme for the whole system. */
export const categoryHref = (slug: string): string => `/templates/${slug}`;
