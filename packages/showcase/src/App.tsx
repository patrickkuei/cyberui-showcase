import { useHashRoute } from './router/useHashRoute';
import { HomePage } from './pages/HomePage';
import { GalleryPage } from './pages/GalleryPage';
import './App.css';

export default function App() {
  const route = useHashRoute();

  if (route.name === 'gallery') {
    return (
      <main className="shell">
        <GalleryPage slug={route.slug} />
      </main>
    );
  }

  // v0: an unrecognized hash falls back to the home page rather than a
  // dedicated 404 — there's exactly one other route so far.
  return (
    <main className="shell">
      <HomePage />
    </main>
  );
}
