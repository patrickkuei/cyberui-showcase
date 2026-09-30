import { useHashRoute, type Route } from './router/useHashRoute';
import { HomePage } from './pages/HomePage';
import { GalleryIndexPage } from './pages/GalleryIndexPage';
import { GalleryPage } from './pages/GalleryPage';
import { ProcessPage } from './pages/ProcessPage';
import { Nav } from './components/Nav';
import './App.css';

// Exhaustive switch on route.name (rather than a ternary chain) so that
// adding a new Route variant in useHashRoute.ts without wiring a case here
// is a compile error, not a silent fallback to Home — same pattern this
// codebase's own /process page (Act 1, "Information Architecture") and the
// monitoring demo's case study hold up as best practice.
function renderRoute(route: Route) {
  switch (route.name) {
    case 'gallery':
      return <GalleryPage slug={route.slug} />;
    case 'gallery-index':
      return <GalleryIndexPage />;
    case 'process':
      return <ProcessPage />;
    case 'home':
      return <HomePage />;
    case 'not-found':
      // v0: an unrecognized hash falls back to Home.
      return <HomePage />;
    default: {
      const _exhaustive: never = route;
      return _exhaustive;
    }
    // ^ if this doesn't compile, a new Route variant was added without a
    // case above — that's the point.
  }
}

export default function App() {
  const route = useHashRoute();

  return (
    <>
      <Nav transparentUntilScroll={route.name === 'home'} />
      <main className="shell">{renderRoute(route)}</main>
    </>
  );
}
