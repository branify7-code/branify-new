// =============================================================================
// BRANIFY — legacy legal URL aliases
// -----------------------------------------------------------------------------
// Lives in its own tiny module so App.tsx can resolve legacy redirects at boot
// WITHOUT statically importing the full legal page texts (LegalPageView is
// lazy-loaded; legal copy therefore stays out of the main bundle).
// =============================================================================

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
