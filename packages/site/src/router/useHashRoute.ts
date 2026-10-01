import { useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'templates-index' }
  | { name: 'template'; slug: string }
  | { name: 'process' }
  | { name: 'not-found' };

// Template slugs come from data (TEMPLATES), not a fixed union like
// monitoring's `ROUTES = [...] as const` — so this router parses a slug out
// of the hash instead of matching against a known tuple. Whether a slug is a
// real template is validated where it's rendered (TemplatePage), not here.
function parseHash(hash: string): Route {
  const value = hash.replace(/^#\/?/, '');
  if (value === '') return { name: 'home' };
  if (value === 'templates') return { name: 'templates-index' };
  if (value.startsWith('templates/')) {
    const slug = value.slice('templates/'.length);
    return slug ? { name: 'template', slug } : { name: 'templates-index' };
  }
  if (value === 'process') return { name: 'process' };
  return { name: 'not-found' };
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return route;
}
