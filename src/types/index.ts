export interface NavItem {
  id: string;
  label: string;
  href: string;
  badge?: string;
}

export interface Service {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  iconName: string;
  deliverables: string[];
  technologies: string[];
  gradient: string;
  featuredStat?: string;
}

export interface Project {
  id: string;
  title: string;
  client: string;
  category: string;
  serviceType: string;
  year: string;
  description: string;
  impactMetrics: { label: string; value: string }[];
  deliverables: string[];
  heroImage: string;
  accentColor: string;
  liveUrl?: string;
  isFeatured?: boolean;
}

export interface DigitalTool {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: 'utility' | 'developer' | 'design' | 'security';
  iconName: string;
  isPopular?: boolean;
  status: 'active' | 'beta' | 'new';
  features: string[];
}

export interface AITool {
  id: string;
  name: string;
  category: 'AI Writing' | 'AI Image Tools' | 'AI Productivity' | 'AI Marketing' | 'AI Development' | 'AI Automation';
  tagline: string;
  description: string;
  model: string;
  iconName: string;
  metrics: string;
  capabilities: string[];
  badge?: string;
}

export interface ProcessStep {
  number: string;
  title: string;
  subtitle: string;
  duration: string;
  description: string;
  keyOutputs: string[];
  quote: string;
}

export interface WhyBranifyItem {
  id: string;
  title: string;
  headline: string;
  description: string;
  metric: string;
  metricLabel: string;
  iconName: string;
}

export interface StatItem {
  value: number;
  suffix: string;
  label: string;
  description: string;
  sublabel: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  projectType: string;
  rating: number;
  avatarText: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'General' | 'Process' | 'Services' | 'Technology';
}

export interface ProjectInquiryData {
  name: string;
  email: string;
  company: string;
  selectedServices: string[];
  budgetRange: string;
  timeline: string;
  message: string;
}
