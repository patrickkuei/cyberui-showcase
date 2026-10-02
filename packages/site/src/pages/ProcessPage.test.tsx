import { describe, it, expect, afterEach, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import { ProcessPage } from './ProcessPage';
import { stubIntersectionObserver } from '../test/intersectionObserver';

afterEach(() => vi.unstubAllGlobals());

function actSection(name: string): HTMLElement {
  const section = screen.getByRole('heading', { level: 2, name }).closest('section');
  if (!section) throw new Error(`no section for act "${name}"`);
  return section;
}

describe('ProcessPage', () => {
  it('states the split honestly in its intro, derived from the data', () => {
    stubIntersectionObserver('immediate');
    render(<ProcessPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'How we design' })).toBeInTheDocument();
    expect(screen.getByText(/4 of 10 stages are included in a cyberui-2045 template/)).toBeInTheDocument();
    expect(screen.getByText(/the other 6 remain your decisions/)).toBeInTheDocument();
  });

  it('renders three acts and all ten stages', () => {
    stubIntersectionObserver('immediate');
    render(<ProcessPage />);
    expect(screen.getByRole('heading', { level: 2, name: 'Decisions that come first' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Where the template does the work' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Proving it works' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(10);
  });

  it('puts the stages in their acts', () => {
    stubIntersectionObserver('immediate');
    render(<ProcessPage />);
    // Scoped with within(): stage titles also appear in the overview strip's
    // aria-labels and elsewhere, so unscoped text queries would collide.
    const act1 = within(actSection('Decisions that come first'));
    const act2 = within(actSection('Where the template does the work'));
    const act3 = within(actSection('Proving it works'));
    expect(act1.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Discovery',
      'Research',
      'Information Architecture',
      'Wireframe',
    ]);
    expect(act2.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Visual Direction',
      'Design System',
      'High-Fidelity',
      'Motion & Interaction',
    ]);
    expect(act3.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Prototype & Testing',
      'Handoff',
    ]);
  });

  it('keeps the "Included" tag, and so the accent, inside the included act only', () => {
    stubIntersectionObserver('immediate');
    render(<ProcessPage />);
    const act1 = actSection('Decisions that come first');
    const act2 = actSection('Where the template does the work');
    const act3 = actSection('Proving it works');
    expect(act2).toHaveClass('process-act-included');
    expect(within(act2).getAllByText('Included')).toHaveLength(4);
    expect(within(act2).queryByText('Your decision')).not.toBeInTheDocument();
    for (const act of [act1, act3]) {
      expect(act).not.toHaveClass('process-act-included');
      expect(within(act).queryByText('Included')).not.toBeInTheDocument();
    }
  });

  it('says plainly what was not done on the two stages that have a caveat', () => {
    stubIntersectionObserver('immediate');
    render(<ProcessPage />);
    expect(screen.getAllByText('Open to input:')).toHaveLength(2);
  });

  it('shows every stage in full when nothing has been revealed yet (no hidden-forever content)', () => {
    stubIntersectionObserver('never');
    const { container } = render(<ProcessPage />);
    expect(container.querySelectorAll('.process-stage')).toHaveLength(10);
    // Text is in the DOM even though the observers have not fired. Two matches:
    // stage 1's summary and its excerpt both contain the phrase.
    expect(screen.getAllByText(/what can I build with this/)).toHaveLength(2);
  });

  it('renders the decorative progress rail, hidden and not yet visible', () => {
    stubIntersectionObserver('immediate');
    const { container } = render(<ProcessPage />);
    const rail = container.querySelector('.process-rail');
    expect(rail).toHaveAttribute('aria-hidden', 'true');
    // The strip counts as in view (the stub reports it intersecting), so the rail has not been revealed.
    expect(rail).toHaveAttribute('data-visible', 'false');
  });

  it('ends with a closing block that links to the templates', () => {
    stubIntersectionObserver('immediate');
    const { container } = render(<ProcessPage />);
    const closing = screen.getByRole('heading', { level: 2, name: 'Start from the result' }).closest('section')!;
    expect(within(closing).getByText(
      'A template starts you with the 4 included stages already done, and you take the other 6 from there.',
    )).toBeInTheDocument();
    expect(within(closing).getByRole('link', { name: /Pick a starting point/ })).toHaveAttribute('href', '#/templates');
    expect(container.querySelector('.process-end')).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps the base dot strength when nothing reports the current stage', () => {
    stubIntersectionObserver('never');
    const { container } = render(<ProcessPage />);
    expect(container.querySelector('.process-page')).toHaveAttribute('data-dots', 'base');
  });

  it('brightens the dots while the current stage is an included one', () => {
    const instances: { callback: IntersectionObserverCallback; options?: IntersectionObserverInit }[] = [];
    class Recorder {
      constructor(
        callback: IntersectionObserverCallback,
        options?: IntersectionObserverInit,
      ) {
        instances.push({ callback, options });
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal('IntersectionObserver', Recorder);
    const { container } = render(<ProcessPage />);
    const page = container.querySelector('.process-page')!;
    const rowObserver = instances.find((o) => o.options?.rootMargin === '-35% 0px -60% 0px');
    expect(rowObserver).toBeDefined();
    const reach = (n: number) =>
      act(() =>
        rowObserver!.callback(
          [{ isIntersecting: true, target: container.querySelector(`[data-stage-number="${n}"]`)! } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        ),
      );
    expect(page).toHaveAttribute('data-dots', 'base');
    reach(6);
    expect(page).toHaveAttribute('data-dots', 'included');
    reach(9);
    expect(page).toHaveAttribute('data-dots', 'base');
    reach(8);
    expect(page).toHaveAttribute('data-dots', 'included');
  });
});
