import { ProcessOverview } from '../components/ProcessOverview';
import { ProcessStageRow } from '../components/ProcessStageRow';
import { INCLUDED_STAGES, PROCESS_STAGES, TOTAL_STAGES, groupIntoActs } from '../content/processStages';

/**
 * "How we design": the ten stages of making a product, each with the real
 * artifact we produced for it while building this site, and an honest tag
 * for who decides. Acts are derived from the stages' owners (see
 * groupIntoActs); only the included act carries the accent. Design spec:
 * docs/superpowers/specs/2026-10-01-process-page-design.md.
 */
export function ProcessPage() {
  const acts = groupIntoActs(PROCESS_STAGES);
  const intro =
    `${INCLUDED_STAGES} of ${TOTAL_STAGES} stages are included in a cyberui-2045 template; ` +
    `the other ${TOTAL_STAGES - INCLUDED_STAGES} remain your decisions. ` +
    'Each stage below shows what we produced for it while building this site, and says plainly where we produced less.';

  return (
    <div className="process-page">
      <h1>How we design</h1>
      <p className="process-intro">{intro}</p>

      <ProcessOverview stages={PROCESS_STAGES} />

      {acts.map((act) => (
        <section
          key={act.title}
          className={`process-act ${act.owner === 'library' ? 'process-act-included' : 'process-act-yours'}`}
        >
          <h2>{act.title}</h2>
          <p className="process-act-lede">{act.lede}</p>
          <ol className="process-act-stages">
            {act.stages.map((stage) => (
              <ProcessStageRow key={stage.number} stage={stage} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
