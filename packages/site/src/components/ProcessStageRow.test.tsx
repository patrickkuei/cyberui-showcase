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

  it('states what was not done on stages that have a caveat, and only those', () => {
    stubIntersectionObserver('immediate');
    const withCaveat = renderRow(2);
    expect(screen.getByText('Not done:')).toBeInTheDocument();
    expect(screen.getByText(/No user interviews/)).toBeInTheDocument();
    withCaveat.unmount();
    renderRow(1);
    expect(screen.queryByText('Not done:')).not.toBeInTheDocument();
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
