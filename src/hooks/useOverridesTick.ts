import { useEffect, useState } from 'react';
import { overridesApplied } from '../lib/contentOverrides';

/**
 * Re-render tick for admin content overrides. Overrides mutate the compiled
 * registries in place AFTER first paint (render is never blocked on them);
 * when the 'branify:overrides' event lands, every component using this hook
 * re-renders. Add the returned tick to `useMemo`/`useEffect` dep arrays that
 * read overridable registries (toolsRegistry, templatesRegistry, blogPosts,
 * servicesRegistry, aiToolsDirectory, freeTemplates) so derived values refresh.
 */
export function useOverridesTick(): number {
  const [tick, setTick] = useState(() => (overridesApplied() ? 1 : 0));
  useEffect(() => {
    const onOverrides = () => setTick((t) => t + 1);
    window.addEventListener('branify:overrides', onOverrides);
    // The event may fire between module eval and this effect (warm-cache path
    // applies almost instantly) — sync up once on mount.
    if (overridesApplied()) onOverrides();
    return () => window.removeEventListener('branify:overrides', onOverrides);
  }, []);
  return tick;
}
