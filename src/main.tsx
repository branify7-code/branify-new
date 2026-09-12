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

// Apply admin-managed content overrides before first render (no-op when the
// admin database is absent — public site then renders the compiled registries).
const overridesReady = applyPublicContentOverrides();

Promise.resolve(overridesReady).finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});

