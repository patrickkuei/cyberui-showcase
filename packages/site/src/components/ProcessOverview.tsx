import { Tooltip } from 'cyberui-2045';
import { OWNER_LABEL, type ProcessStage } from '../content/processStages';

export interface ProcessOverviewProps {
  stages: readonly ProcessStage[];
}

/**
 * The 10 stages at a glance, with the included ones filled. Custom markup
 * rather than the library's Steps or SegmentedProgress: those model progress
 * (completed/pending, or a contiguous filled run), and this is an ownership
 * split where the filled segments are 5 to 8, not the first four.
 * Static on purpose: no links, because the site routes on the URL hash.
 *
 * Tooltip notes (read from cyberui-2045's source): it renders a wrapper <span>
 * (so it sits inside each <li>, never directly in the <ol>), draws its popup
 * inline rather than in a portal, and opens on hover and keyboard focus only,
 * not on tap. Variant "secondary" reads --color-secondary, the same cyan as
 * --process-accent. Its aria-describedby appears only while open.
 */
export function ProcessOverview({ stages }: ProcessOverviewProps) {
  return (
    <figure className="process-overview">
      <p className="process-overview-caption">The 10 stages of making a product · hover a square for its name</p>
      <ol className="process-overview-strip">
        {stages.map((stage) => (
          <li key={stage.number} data-owner={stage.owner}>
            <Tooltip
              content={`Stage ${stage.number} · ${stage.title} · ${OWNER_LABEL[stage.owner]}`}
              placement="top"
              variant="secondary"
              size="sm"
              className="process-overview-tooltip"
            >
              <div className="process-overview-cell" aria-hidden="true">
                {String(stage.number).padStart(2, '0')}
              </div>
            </Tooltip>
            {/* Real text rather than aria-label on the <li>: a label on a bare list item is unreliable across screen readers. */}
            <span className="visually-hidden">{`Stage ${stage.number}: ${stage.title}, ${OWNER_LABEL[stage.owner]}`}</span>
          </li>
        ))}
      </ol>
      <figcaption className="process-overview-legend">
        <span>
          <i className="process-overview-swatch process-overview-swatch-you" aria-hidden="true" />
          {OWNER_LABEL.you}
        </span>
        <span>
          <i className="process-overview-swatch process-overview-swatch-library" aria-hidden="true" />
          {OWNER_LABEL.library}
        </span>
      </figcaption>
    </figure>
  );
}
