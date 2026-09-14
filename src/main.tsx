// Safe fetch property handler for iframe and strict mode environments
try {
  if (typeof window !== 'undefined') {
    const rawFetch = window.fetch ? window.fetch.bind(window) : undefined;
    if (rawFetch) {
      let activeFetch = rawFetch;
      Object.defineProperty(window, 'fetch', {
        get() {
          return activeFetch;
        },
        set(newFetch) {
          if (typeof newFetch === 'function') {
            activeFetch = newFetch;
          }
        },
        configurable: true,
        enumerable: true,
      });
    }
  }
} catch {
  // Ignore if already configured
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { applyPublicContentOverrides } from './lib/contentOverrides';

// Register the production service worker (versioned, network-first for HTML).
// The SW's own activate step cleans up caches from the previous kill-switch era.
if (typeof window !== 'undefined' && import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* PWA is progressive enhancement — site works without it */
    });
  });
}

// First paint is NEVER blocked by the overrides network round-trip: React
// renders the compiled registries immediately (the LCP hero is static content),
// while admin-managed overrides load in the background. When they land,
// contentOverrides dispatches 'branify:overrides' and App re-renders with the
// live content (previously render waited up to ~1.2s — a guaranteed LCP hit
// on every cold visit).
void applyPublicContentOverrides();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

