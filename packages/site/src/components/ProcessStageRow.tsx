import { CodeViewer } from './CodeViewer';
import { OwnerTag } from './OwnerTag';
import { feedbackIssueUrl, sourceUrl, type ProcessStage } from '../content/processStages';
import { useStageReveal } from '../hooks/useStageReveal';

export interface ProcessStageRowProps {
  stage: ProcessStage;
}

/**
 * One stage of the process: a spine node, a header (number, title, owner
 * tag), then a body (summary, evidence, optional "Open to input" note with a
 * prefilled GitHub-issue link). Renders an <li>;
 * wrap rows in an <ol>.
 *
 * Reveal is opacity-only and driven by data-reveal (see useStageReveal and
 * the .process-stage rules in App.css). Every part is always in the DOM, so
 * text is selectable/searchable and screen readers read all of it.
 *
 * The owner tag is OwnerTag, not a library Badge, so it looks like the
 * overview strip's squares (see OwnerTag).
 */
export function ProcessStageRow({ stage }: ProcessStageRowProps) {
  const { ref, stage: reveal } = useStageReveal<HTMLLIElement>();
  const { evidence } = stage;

  return (
    <li ref={ref} className="process-stage" data-owner={stage.owner} data-reveal={reveal} data-stage-number={stage.number}>
      <span className="process-stage-node" aria-hidden="true" />
      <div className="process-stage-header">
        <span className="process-stage-number">{String(stage.number).padStart(2, '0')}</span>
        <h3>{stage.title}</h3>
        <OwnerTag owner={stage.owner} />
      </div>
      <div className="process-stage-body">
        <p className="process-stage-summary">{stage.summary}</p>
        {evidence.kind === 'excerpt' ? (
          <CodeViewer
            snippets={[
              {
                title: evidence.source.label,
                code: evidence.excerpt,
                sourceHref: sourceUrl(evidence.source.path),
                asOf: evidence.asOf,
                wrap: !evidence.diagram,
              },
            ]}
          />
        ) : (
          <figure className="code-block process-evidence-image">
            <figcaption>{evidence.source.label}</figcaption>
            {/* width/height are the PNG's intrinsic pixels: the browser reserves the box before the lazy image loads (CSS keeps it responsive with height: auto), so the row does not grow on load. */}
            <img src={evidence.src} alt={evidence.alt} width={1265} height={521} loading="lazy" />
            <p className="code-block-source">
              <a href={sourceUrl(evidence.source.path)} target="_blank" rel="noreferrer">
                Source <span aria-hidden="true">↗</span>
                <span className="visually-hidden"> (opens in new tab)</span>
              </a>
              {' · '}as of <code>{evidence.asOf}</code>
            </p>
          </figure>
        )}
        {evidence.caveat && evidence.invite && (
          <p className="process-stage-caveat">
            <strong>Open to input:</strong> {evidence.caveat} {evidence.invite.prompt}{' '}
            <a href={feedbackIssueUrl(evidence.invite)} target="_blank" rel="noreferrer">
              Open an issue <span aria-hidden="true">↗</span>
              <span className="visually-hidden"> (opens in new tab)</span>
            </a>
          </p>
        )}
      </div>
    </li>
  );
}
