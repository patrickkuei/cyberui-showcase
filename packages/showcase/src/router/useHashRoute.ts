import { useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'gallery-index' }
  | { name: 'gallery'; slug: string }
  | { name: 'process' }
  | { name: 'not-found' };

// Gallery slugs come from data (GALLERY_ITEMS), not a fixed union like
// monitoring's `ROUTES = [...] as const` — so this router parses a slug out
// of the hash instead of matching against a known tuple. Whether a slug is a
// real demo is validated where it's rendered (GalleryPage), not here.
function parseHash(hash: string): Route {
  const value = hash.replace(/^#\/?/, '');
  if (value === '') return { name: 'home' };
  if (value === 'gallery') return { name: 'gallery-index' };
  if (value.startsWith('gallery/')) {
    const slug = value.slice('gallery/'.length);
    return slug ? { name: 'gallery', slug } : { name: 'gallery-index' };
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
