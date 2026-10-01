import type { CaseStudyContent } from '../content/types';

export interface CaseStudyProps {
  content: CaseStudyContent;
}

export function CaseStudy({ content }: CaseStudyProps) {
  return (
    <article className="case-study">
      <p className="case-study-lede">{content.problem}</p>

      <section className="case-study-section">
        <h2>Design decisions</h2>
        <dl className="case-study-decisions">
          {content.decisions.map((decision) => (
            <div className="case-study-decision" key={decision.title}>
              <dt>{decision.title}</dt>
              <dd>{decision.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="case-study-section">
        <h2>Key snippet</h2>
        <figure className="code-block">
          <figcaption>{content.keySnippet.title}</figcaption>
          <pre>
            <code>{content.keySnippet.code}</code>
          </pre>
          {content.keySnippet.note && <p className="code-block-note">{content.keySnippet.note}</p>}
        </figure>
      </section>

      <section className="case-study-section">
        <h2>Takeaways</h2>
        <ul className="case-study-takeaways">
          {content.takeaways.map((takeaway) => (
            <li key={takeaway}>{takeaway}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}
