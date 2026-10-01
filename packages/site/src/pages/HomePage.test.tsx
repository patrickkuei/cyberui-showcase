import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomePage } from './HomePage';
import { TEMPLATES } from '../data/templates';

describe('HomePage', () => {
  it('renders the hero headline and one CTA into the templates', () => {
    render(<HomePage />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Built by AI.');
    expect(heading).toHaveTextContent('Ready for yours.');
    // Just the hero CTA now — the page is short enough that a second,
    // closing CTA was visible in the same glance as the first, reading as
    // duplication rather than reinforcement (dropped after visual review).
    expect(screen.getAllByRole('button', { name: 'Pick a starting point' })).toHaveLength(1);
  });

  it("does not list individual templates on Home — that's Templates' job", () => {
    render(<HomePage />);
    expect(screen.queryByText('AI Product Monitoring')).not.toBeInTheDocument();
  });

  it('derives the template count from TEMPLATES instead of a hardcoded string', () => {
    render(<HomePage />);
    const liveCount = TEMPLATES.filter((item) => item.status === 'live').length;
    const comingSoonCount = TEMPLATES.length - liveCount;
    expect(
      screen.getByText(`${liveCount} template${liveCount === 1 ? '' : 's'} ready. ${comingSoonCount} more coming soon.`)
    ).toBeInTheDocument();
  });
});
