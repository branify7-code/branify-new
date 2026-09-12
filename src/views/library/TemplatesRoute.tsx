/* =========================================================
   TemplatesRoute — lazy resolver for every /templates/... path.
   Pulled out of App.tsx so the main bundle no longer needs the
   template registry synchronously: slug → category/detail/preview
   resolution happens inside this lazy chunk (which downloads the
   registry the target view needs anyway).
   Route shapes preserved 1:1:
     /templates/:category            → category page
     /templates/:slug                → detail (registry-wide slug lookup)
     /templates/:category/:slug      → detail
     /templates/:slug/preview        → preview (registry-wide lookup)
     /templates/:category/:slug/preview → preview
========================================================= */

import React from 'react';
import { getCategoryBySlug, getTemplateBySlug } from '../../data/templates';
import TemplatesCategoryView from './TemplatesCategoryView';
import TemplateDetailPage from './TemplateDetailPage';
import TemplatePreviewPage from './TemplatePreviewPage';
import { NotFoundView } from '../NotFoundView';

interface TemplatesRouteProps {
  pathname: string;
  onNavigate: (path: string) => void;
}

export const TemplatesRoute: React.FC<TemplatesRouteProps> = ({ pathname, onNavigate }) => {
  const segs = pathname.replace('/templates/', '').split('/').filter(Boolean).map((s) => decodeURIComponent(s));
  if (segs.length === 1) {
    const [a] = segs;
    if (getCategoryBySlug(a)) {
      return <TemplatesCategoryView categorySlug={a} onNavigate={onNavigate} />;
    }
    const bySlug = getTemplateBySlug(a);
    if (bySlug) {
      return <TemplateDetailPage categorySlug={bySlug.categorySlug} templateSlug={bySlug.slug} onNavigate={onNavigate} />;
    }
    return <NotFoundView path={pathname} onNavigateHome={() => onNavigate('/')} onExploreTools={() => onNavigate('/templates')} />;
  }
  const [a, b, c] = segs;
  if (segs.length === 2 && b === 'preview') {
    const bySlug = getTemplateBySlug(a);
    return bySlug
      ? <TemplatePreviewPage categorySlug={bySlug.categorySlug} templateSlug={bySlug.slug} onNavigate={onNavigate} />
      : <NotFoundView path={pathname} onNavigateHome={() => onNavigate('/')} onExploreTools={() => onNavigate('/templates')} />;
  }
  if (segs.length >= 3 && c === 'preview') {
    return <TemplatePreviewPage categorySlug={a} templateSlug={b} onNavigate={onNavigate} />;
  }
  return <TemplateDetailPage categorySlug={a} templateSlug={b} onNavigate={onNavigate} />;
};

export default TemplatesRoute;
