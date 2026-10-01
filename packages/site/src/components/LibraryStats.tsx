import { TEMPLATES } from '../data/templates';

/**
 * What a visitor gets, as facts rather than claims: the library's real
 * palette and component count (read from the installed cyberui-2045 at build
 * time, see vite.config.ts) and how many templates are ready (derived from
 * TEMPLATES). Nothing here is hand-typed, so it can't drift. The swatches
 * are the one place color appears below the hero — kept small and flat
 * because they're data about the look, not decoration.
 */
export function LibraryStats() {
  const { components, palette } = __LIBRARY_STATS__;
  const readyTemplates = TEMPLATES.filter((item) => item.status === 'live').length;

  return (
    <figure className="library-stats">
      <dl className="library-stats-list">
        <div className="library-stats-item library-stats-palette">
          <dt className="library-stats-label">palette</dt>
          <dd className="library-stats-swatches">
            {palette.map(({ name, hex }) => (
              <span className="library-stats-swatch" key={name}>
                <span className="library-stats-chip" style={{ background: hex }} aria-hidden="true" />
                <span className="library-stats-hex">{hex}</span>
              </span>
            ))}
          </dd>
        </div>
        <div className="library-stats-item">
          <dt className="library-stats-label">components</dt>
          <dd className="library-stats-value">{components}</dd>
        </div>
        <div className="library-stats-item">
          <dt className="library-stats-label">ready templates</dt>
          <dd className="library-stats-value">{readyTemplates}</dd>
        </div>
      </dl>
      <figcaption className="library-stats-caption">Counted when this site was built.</figcaption>
    </figure>
  );
}
