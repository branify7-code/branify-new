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

// Purge any stale service workers and caches
if (typeof window !== 'undefined') {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  }
  if ('caches' in window) {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    });
  }
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

