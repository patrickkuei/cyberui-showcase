import { GALLERY_ITEMS } from '../data/galleryItems';
import { DemoTile } from '../components/DemoTile';

export function GalleryIndexPage() {
  return (
    <div className="gallery-index">
      <h1>All demos</h1>
      <div className="gallery-index-grid">
        {GALLERY_ITEMS.map((item) => (
          <DemoTile key={item.slug} item={item} size={item.status === 'live' ? 'large' : 'small'} />
        ))}
      </div>
    </div>
  );
}
