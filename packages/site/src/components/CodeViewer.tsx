import type { CodeSnippet } from '../content/types';

export interface CodeViewerProps {
  snippets: CodeSnippet[];
}

export function CodeViewer({ snippets }: CodeViewerProps) {
  if (snippets.length === 0) {
    return <p className="code-viewer-empty">No snippets yet for this template.</p>;
  }

  return (
    <div className="code-viewer">
      {snippets.map((snippet) => (
        <figure className="code-block" key={snippet.title}>
          <figcaption>{snippet.title}</figcaption>
          <pre className={snippet.wrap ? 'code-block-wrap' : undefined}>
            <code>{snippet.code}</code>
          </pre>
          {(snippet.sourceHref || snippet.asOf) && (
            <p className="code-block-source">
              {snippet.sourceHref && (
                <a href={snippet.sourceHref} target="_blank" rel="noreferrer">
                  Full file ↗
                </a>
              )}
              {snippet.sourceHref && snippet.asOf && ' · '}
              {snippet.asOf && (
                <>
                  as of <code>{snippet.asOf}</code>
                </>
              )}
            </p>
          )}
          {snippet.note && <p className="code-block-note">{snippet.note}</p>}
        </figure>
      ))}
    </div>
  );
}
