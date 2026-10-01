import { useHashRoute } from './router/useHashRoute';
import { HomePage } from './pages/HomePage';
import { GalleryIndexPage } from './pages/GalleryIndexPage';
import { GalleryPage } from './pages/GalleryPage';
import { ProcessPage } from './pages/ProcessPage';
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
        ) : route.name === 'gallery-index' ? (
          <GalleryIndexPage />
        ) : route.name === 'process' ? (
          <ProcessPage />
        ) : (
          // v0: an unrecognized hash falls back to Home.
          <HomePage />
        )}
      </main>
    </>
  );
}
