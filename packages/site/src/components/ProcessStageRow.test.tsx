import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ProcessStageRow } from './ProcessStageRow';
import { PROCESS_STAGES, type ProcessStage } from '../content/processStages';
import { stubIntersectionObserver } from '../test/intersectionObserver';

function stage(number: number): ProcessStage {
  const found = PROCESS_STAGES.find((s) => s.number === number);
  if (!found) throw new Error(`no stage ${number}`);
  return found;
}

function renderRow(number: number) {
  return render(
    <ol>
      <ProcessStageRow stage={stage(number)} />
    </ol>
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('ProcessStageRow', () => {
  it('shows the stage number, title and owner tag', () => {
    stubIntersectionObserver('immediate');
    renderRow(5);
    expect(screen.getByText('05')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Visual Direction' })).toBeInTheDocument();
    expect(screen.getByText('Included')).toBeInTheDocument();
  });

  it('tags stages the reader decides as "Your decision"', () => {
    stubIntersectionObserver('immediate');
    renderRow(1);
    expect(screen.getByText('Your decision')).toBeInTheDocument();
    expect(screen.queryByText('Included')).not.toBeInTheDocument();
  });

  it('shows the excerpt and links to the full file on main', () => {
    stubIntersectionObserver('immediate');
    const { container } = renderRow(1);
    // The stage summary repeats this phrase, so scope to the excerpt <pre>.
    expect(within(container.querySelector('pre')!).getByText(/what can I build with this/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /full file/i })).toHaveAttribute(
      'href',
      'https://github.com/patrickkuei/cyberui-templates/blob/main/docs/superpowers/specs/2026-09-27-cyberui-showcase-design.md'
    );
  });

  it('wraps prose excerpts but lets diagram excerpts scroll', () => {
    stubIntersectionObserver('immediate');
    const prose = renderRow(1);
    expect(prose.container.querySelector('pre')).toHaveClass('code-block-wrap');
    prose.unmount();
    const diagram = renderRow(4);
    expect(diagram.container.querySelector('pre')).not.toHaveClass('code-block-wrap');
  });

  it('sets diagram excerpts in the diagram font class, and prose excerpts not', () => {
    stubIntersectionObserver('immediate');
    for (const n of [3, 4]) {
      const r = renderRow(n);
      expect(r.container.querySelector('pre'), `stage ${n}`).toHaveClass('code-block-diagram');
      r.unmount();
    }
    const prose = renderRow(1);
    expect(prose.container.querySelector('pre')).not.toHaveClass('code-block-diagram');
  });

  it('states what was not done on stages that have a caveat, and only those', () => {
    stubIntersectionObserver('immediate');
    const withCaveat = renderRow(2);
    expect(screen.getByText('Open to input:')).toBeInTheDocument();
    expect(screen.getByText(/haven't interviewed visitors/)).toBeInTheDocument();
    withCaveat.unmount();
    renderRow(1);
    expect(screen.queryByText('Open to input:')).not.toBeInTheDocument();
  });

  it('links a caveat to a GitHub issue prefilled with a title and body, and only on caveat stages', () => {
    stubIntersectionObserver('immediate');
    const withCaveat = renderRow(2);
    const href = screen.getByRole('link', { name: /open an issue/i }).getAttribute('href')!;
    const url = new URL(href);
    expect(url.origin + url.pathname).toBe('https://github.com/patrickkuei/cyberui-templates/issues/new');
    expect(url.searchParams.get('title')).toBe('Feedback on stage 2: Research');
    expect(url.searchParams.get('body')).toContain('## What I build');
    withCaveat.unmount();
    renderRow(1);
    expect(screen.queryByRole('link', { name: /open an issue/i })).not.toBeInTheDocument();
  });

  it('shows the screenshot for the image stage, with alt text and a source link', () => {
    stubIntersectionObserver('immediate');
    renderRow(7);
    expect(screen.getByAltText(/Home page hero/)).toHaveAttribute('src', './screenshots/home-hero.png');
    expect(screen.getByRole('link', { name: /source/i })).toHaveAttribute(
      'href',
      'https://github.com/patrickkuei/cyberui-templates/blob/main/packages/site/src/components/HeroScene.tsx'
    );
  });

  it('gives the screenshot its intrinsic size so the row does not grow when the lazy image loads', () => {
    stubIntersectionObserver('immediate');
    renderRow(7);
    const img = screen.getByAltText(/Home page hero/);
    expect(img).toHaveAttribute('width', '1265');
    expect(img).toHaveAttribute('height', '521');
  });

  it('keeps all text in the DOM before the row is revealed, so reveal never changes the layout', () => {
    stubIntersectionObserver('never');
    const { container } = renderRow(1);
    expect(container.querySelector('li')).toHaveAttribute('data-reveal', 'pending');
    expect(screen.getByText(stage(1).summary)).toBeInTheDocument();
    expect(within(container.querySelector('pre')!).getByText(/what can I build with this/)).toBeInTheDocument();
  });

  it('is revealed in full once the observer reports it in view', () => {
    stubIntersectionObserver('immediate');
    const { container } = renderRow(1);
    expect(container.querySelector('li')).toHaveAttribute('data-reveal', 'full');
  });
});
