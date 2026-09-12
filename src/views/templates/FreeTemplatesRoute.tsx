/* =========================================================
   FreeTemplatesRoute — lazy resolver for /free-templates/:seg.
   Moved out of App.tsx so the main bundle no longer statically
   imports the free-templates registry: the segment is resolved
   to a detail page (slug hit) or the directory view (category)
   inside this lazy chunk, which downloads the registry anyway.
========================================================= */

import React from 'react';
import { freeTemplates } from '../../data/freeTemplatesRegistry';
import { FreeTemplatesView } from './FreeTemplatesView';
import { FreeTemplateDetailPage } from './FreeTemplateDetailPage';

interface FreeTemplatesRouteProps {
  /** decoded first path segment after /free-templates/ */
  seg: string;
  onNavigate: (path: string) => void;
}

export const FreeTemplatesRoute: React.FC<FreeTemplatesRouteProps> = ({ seg, onNavigate }) => {
  const asSlug = freeTemplates.find((t) => t.slug === seg);
  if (asSlug) {
    return <FreeTemplateDetailPage slug={asSlug.slug} onNavigate={onNavigate} />;
  }
  return <FreeTemplatesView onNavigate={onNavigate} initialCategory={seg} />;
};

export default FreeTemplatesRoute;
