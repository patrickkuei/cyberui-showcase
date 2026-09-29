import { describe, it, expect } from 'vitest';
import { formatCompactNumber, formatMs, formatPercent, formatCurrencyPerHour, formatRelativeTime } from './format';

describe('format utils', () => {
  it('formats large numbers compactly', () => {
    expect(formatCompactNumber(1280)).toBe('1.3K');
  });

  it('formats milliseconds', () => {
    expect(formatMs(219.6)).toBe('220 ms');
  });

  it('formats percentages to one decimal', () => {
    expect(formatPercent(0.4)).toBe('0.4%');
  });

  it('formats hourly cost', () => {
    expect(formatCurrencyPerHour(6.4)).toBe('$6.40/hr');
  });

  it('formats relative time', () => {
    const now = 1_700_000_000_000;
    expect(formatRelativeTime(now, now)).toBe('just now');
    expect(formatRelativeTime(now - 30_000, now)).toBe('30s ago');
    expect(formatRelativeTime(now - 5 * 60_000, now)).toBe('5m ago');
    expect(formatRelativeTime(now - 3 * 60 * 60_000, now)).toBe('3h ago');
  });
});
