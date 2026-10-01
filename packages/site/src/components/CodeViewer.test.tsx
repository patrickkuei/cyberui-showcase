import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CodeViewer } from './CodeViewer';

describe('CodeViewer', () => {
  it('renders a plain snippet with no provenance line (existing callers unchanged)', () => {
    render(<CodeViewer snippets={[{ title: 'Example', code: 'const a = 1;' }]} />);
    expect(screen.getByText('Example')).toBeInTheDocument();
    expect(screen.getByText('const a = 1;')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByText(/as of/i)).not.toBeInTheDocument();
  });

  it('links to the full source file in a new tab when sourceHref is given', () => {
    render(
      <CodeViewer snippets={[{ title: 'Spec', code: 'x', sourceHref: 'https://example.com/file.md', asOf: 'c0c11b6' }]} />
    );
    const link = screen.getByRole('link', { name: /full file/i });
    expect(link).toHaveAttribute('href', 'https://example.com/file.md');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noreferrer');
    expect(screen.getByText('c0c11b6')).toBeInTheDocument();
  });

  it('wraps long lines only when wrap is set, so diagrams can keep scrolling instead', () => {
    const { container, rerender } = render(<CodeViewer snippets={[{ title: 'Prose', code: 'x', wrap: true }]} />);
    expect(container.querySelector('pre')).toHaveClass('code-block-wrap');
    rerender(<CodeViewer snippets={[{ title: 'Diagram', code: 'x' }]} />);
    expect(container.querySelector('pre')).not.toHaveClass('code-block-wrap');
  });
});
