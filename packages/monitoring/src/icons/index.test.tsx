import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ActivityIcon, ClockIcon, AlertTriangleIcon, UsersIcon, ServerIcon, BellIcon } from './index';

const ICONS = { ActivityIcon, ClockIcon, AlertTriangleIcon, UsersIcon, ServerIcon, BellIcon };

describe('icon set', () => {
  for (const [name, Icon] of Object.entries(ICONS)) {
    it(`${name} renders an accessible, sized svg`, () => {
      const { container } = render(<Icon size={24} />);
      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
      expect(svg?.getAttribute('width')).toBe('24');
      expect(svg?.getAttribute('height')).toBe('24');
    });
  }
});
