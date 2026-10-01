import type { ProcessStage } from '../content/processStages';

export interface ProcessActProps {
  title: string;
  lede: string;
  stages: ProcessStage[];
}

/**
 * Plain, unglowing list — deliberately NOT cyberui's Timeline component.
 * These stages are ones the library has no part in, and the page's
 * honesty requirement extends to its own construction: the stage that
 * gets the library's fancy glowing component is the one the library
 * actually does. See ProcessActTwo for that one, and design spec,
 * Visual Direction, for why the distinction matters.
 */
export function ProcessAct({ title, lede, stages }: ProcessActProps) {
  return (
    <section className="process-act process-act-plain">
      <h2>{title}</h2>
      <p className="process-act-lede">{lede}</p>
      <ol className="process-act-stages">
        {stages.map((stage) => (
          <li key={stage.title}>
            <h3>{stage.title}</h3>
            <p>{stage.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
