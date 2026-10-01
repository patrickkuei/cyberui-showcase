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
          <pre>
            <code>{snippet.code}</code>
          </pre>
          {snippet.note && <p className="code-block-note">{snippet.note}</p>}
        </figure>
      ))}
    </div>
  );
}
