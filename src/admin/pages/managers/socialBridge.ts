// =============================================================================
// BRANIFY ADMIN — Blog → Social Media handoff bridge
// -----------------------------------------------------------------------------
// "Promote on Social Media" in the Blog Editor drops the published post here
// and navigates to /admin/social; SocialMediaManager consumes the seed once
// on mount and opens the AI composer in from_blog mode. Same one-shot bridge
// pattern as blogAiHandoff.ts.
// =============================================================================

export interface BlogPromoteSeed {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
}

export const socialPromoteBridge: { current: BlogPromoteSeed | null } = { current: null };

export function consumeBlogPromoteSeed(): BlogPromoteSeed | null {
  const seed = socialPromoteBridge.current;
  socialPromoteBridge.current = null;
  return seed;
}
