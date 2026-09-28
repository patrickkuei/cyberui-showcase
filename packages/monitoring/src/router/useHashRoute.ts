import { useEffect, useState } from 'react';

export type Route = 'dashboard' | 'endpoints' | 'alerts' | 'reports';

const ROUTES: readonly Route[] = ['dashboard', 'endpoints', 'alerts', 'reports'];
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
