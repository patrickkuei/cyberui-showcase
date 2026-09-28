import { describe, it, expect } from 'vitest';
import { describeRequestRate, describeLatency, describeErrorRate } from './trend';

describe('describeRequestRate', () => {
  it('reports steady when the change is small', () => {
    expect(describeRequestRate(420, 410)).toEqual({ text: 'steady', tone: 'default' });
  });
  it('reports rising on a meaningful increase', () => {
    expect(describeRequestRate(500, 420)).toEqual({ text: 'rising', tone: 'success' });
  });
  it('reports falling on a meaningful decrease', () => {
    expect(describeRequestRate(340, 420)).toEqual({ text: 'falling', tone: 'warning' });
  });
});

describe('describeLatency', () => {
  it('reports within target under 500ms', () => {
    expect(describeLatency(220)).toEqual({ text: 'within target', tone: 'success' });
  });
  it('reports elevated at or above 500ms', () => {
    expect(describeLatency(520)).toEqual({ text: 'elevated', tone: 'warning' });
  });
});

describe('describeErrorRate', () => {
  it('reports healthy at or under 2%', () => {
    expect(describeErrorRate(0.5)).toEqual({ text: 'healthy', tone: 'success' });
  });
  it('reports above threshold over 2%', () => {
    expect(describeErrorRate(3.1)).toEqual({ text: 'above threshold', tone: 'error' });
  });
});
