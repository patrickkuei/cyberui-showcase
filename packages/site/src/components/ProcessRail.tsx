import type { ProcessStage } from '../content/processStages';

export interface ProcessRailProps {
  stages: readonly ProcessStage[];
  /** Number of the stage being read, or null before one is. */
  current: number | null;
  /** Fades the rail in (opacity only); see the .process-rail rules in App.css. */
  visible: boolean;
}

/**
 * A vertical copy of the inline overview strip's ten squares, fixed to the
 * left margin, highlighting the stage being read. It is a decorative
 * duplicate: aria-hidden because the inline strip and the stage rows already
 * carry the accessible text. Deliberately not clickable: the site routes on
 * the URL hash, so there are no anchors to jump with (click-to-jump is a
 * possible follow-up).
 */
export function ProcessRail({ stages, current, visible }: ProcessRailProps) {
  return (
    <ol className="process-rail" aria-hidden="true" data-visible={visible}>
      {stages.map((stage) => (
        <li key={stage.number} className="process-chip" data-owner={stage.owner} data-current={stage.number === current}>
          {String(stage.number).padStart(2, '0')}
        </li>
      ))}
    </ol>
  );
}
