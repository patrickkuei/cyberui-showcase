import { useEffect, useState } from 'react';

/** The single source of truth for routes; Route is derived from it so the two can't drift. */
export const ROUTES = ['dashboard', 'endpoints', 'alerts', 'reports'] as const;
export type Route = (typeof ROUTES)[number];

const DEFAULT_ROUTE: Route = 'dashboard';

function parseHash(hash: string): Route {
  const value = hash.replace(/^#\/?/, '');
  return (ROUTES as readonly string[]).includes(value) ? (value as Route) : DEFAULT_ROUTE;
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
