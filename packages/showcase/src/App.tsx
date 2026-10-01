import { useHashRoute } from './router/useHashRoute';
import { HomePage } from './pages/HomePage';
import { GalleryPage } from './pages/GalleryPage';
import { Nav } from './components/Nav';
import './App.css';

export default function App() {
  const route = useHashRoute();

  return (
    <>
      <Nav transparentUntilScroll={route.name === 'home'} />
      <main className="shell">
        {route.name === 'gallery' ? (
          <GalleryPage slug={route.slug} />
        ) : (
          // v0: gallery-index, process, and not-found all fall back to
          // Home until their own pages land (Tasks 6 and 11).
          <HomePage />
        )}
      </main>
    </>
  );
}
