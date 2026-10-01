import { Badge } from 'cyberui-2045';
import { CodeViewer } from './CodeViewer';
import { OWNER_LABEL, sourceUrl, type ProcessStage } from '../content/processStages';
import { useStageReveal } from '../hooks/useStageReveal';

export interface ProcessStageRowProps {
  stage: ProcessStage;
}

/**
 * One stage of the process: a spine node, a header (number, title, owner
 * tag), then a body (summary, evidence, optional caveat). Renders an <li>;
 * wrap rows in an <ol>.
 *
 * Reveal is opacity-only and driven by data-reveal (see useStageReveal and
 * the .process-stage rules in App.css). Every part is always in the DOM, so
 * text is selectable/searchable and screen readers read all of it.
 *
 * The owner tag is a library Badge. "Included" uses variant="accent", which
 * is cyan only inside .process-act-included (that class scopes --color-accent).
 * "Your decision" uses variant="secondary" with --color-secondary scoped to
 * the muted token in CSS, the same technique TemplateTile uses so a neutral
 * badge never falls back to the library's raw default color.
 */
export function ProcessStageRow({ stage }: ProcessStageRowProps) {
  const { ref, stage: reveal } = useStageReveal<HTMLLIElement>();
  const { evidence } = stage;

  return (
    <li ref={ref} className="process-stage" data-owner={stage.owner} data-reveal={reveal}>
      <span className="process-stage-node" aria-hidden="true" />
      <div className="process-stage-header">
        <span className="process-stage-number">{String(stage.number).padStart(2, '0')}</span>
        <h3>{stage.title}</h3>
        <span className={`process-owner process-owner-${stage.owner}`}>
          <Badge variant={stage.owner === 'library' ? 'accent' : 'secondary'} size="sm">
            {OWNER_LABEL[stage.owner]}
          </Badge>
        </span>
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
        {evidence.caveat && (
          <p className="process-stage-caveat">
            <strong>Not done:</strong> {evidence.caveat}
          </p>
        )}
      </div>
    </li>
  );
}
