import { useHashRoute } from './router/useHashRoute';
import { HomePage } from './pages/HomePage';
import { GalleryIndexPage } from './pages/GalleryIndexPage';
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
        ) : route.name === 'gallery-index' ? (
          <GalleryIndexPage />
        ) : (
          // v0: process and not-found fall back to Home until Task 11.
          <HomePage />
        )}
      </main>
    </>
  );
}
