import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TemplateTile } from './TemplateTile';
import { getTemplate } from '../data/templates';

describe('TemplateTile', () => {
  it('renders a live template as clickable with a Live badge', () => {
    const item = getTemplate('monitoring')!;
    render(<TemplateTile item={item} size="large" />);
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View case study' })).toBeInTheDocument();
  });

  it('renders a coming-soon template with no clickable or focusable affordance', () => {
    const item = getTemplate('agent-panel')!;
    render(<TemplateTile item={item} size="small" />);
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it("points the image at the template's own screenshot path, with the coming-soon graphic as fallback", () => {
    // Real 404-triggered fallback rendering only happens in a real browser
    // (happy-dom doesn't simulate image load failure) — see Review Focus #5
    // for the manual check this doesn't replace.
    const item = getTemplate('agent-panel')!;
    render(<TemplateTile item={item} size="small" />);
    const img = screen.getByAltText('Agent Control Panel screenshot');
    expect(img).toHaveAttribute('src', './screenshots/agent-panel.png');
  });

  it('scopes accent color to neutral for coming-soon tiles to prevent yellow border fallback', () => {
    const item = getTemplate('agent-panel')!;
    const { container } = render(<TemplateTile item={item} size="small" />);
    const card = container.querySelector('.template-tile.template-tile-small');
    expect((card as HTMLElement).style.getPropertyValue('--color-accent')).toBe(
      'var(--color-border-default)'
    );
  });

  it('keeps coming-soon title/badge text readable by scoping --color-secondary to --color-muted, not the dark border token', () => {
    const item = getTemplate('agent-panel')!;
    const { container } = render(<TemplateTile item={item} size="small" />);
    const card = container.querySelector('.template-tile.template-tile-small');
    expect((card as HTMLElement).style.getPropertyValue('--color-secondary')).toBe(
      'var(--color-muted)'
    );
  });
});
