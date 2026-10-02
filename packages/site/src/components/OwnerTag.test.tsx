import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OwnerTag } from './OwnerTag';

describe('OwnerTag', () => {
  it('labels and styles "you" as the outline tag', () => {
    render(<OwnerTag owner="you" />);
    expect(screen.getByText('Your decision')).toHaveClass('owner-tag', 'owner-tag-you');
  });

  it('labels and styles "library" as the filled tag', () => {
    render(<OwnerTag owner="library" />);
    expect(screen.getByText('Included')).toHaveClass('owner-tag', 'owner-tag-library');
  });
});
