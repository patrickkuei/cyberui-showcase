import '@testing-library/jest-dom/vitest';

// cyberui-2045 checks for its stylesheet at import time by reading
// --color-primary from document.documentElement and warns "Stylesheet not
// detected" when it's missing. Tests don't load CSS, so provide the token
// inline (setup runs before any test module imports cyberui-2045).
document.documentElement.style.setProperty('--color-primary', '#ff005d');

// Recharts 3's <ResponsiveContainer> seeds its size from
// `containerRef.current.getBoundingClientRect()` on mount, then updates it
// from ResizeObserver `contentRect`s (see
// node_modules/recharts/es6/component/ResponsiveContainer.js). happy-dom has
// no layout engine: getBoundingClientRect() always returns an all-zero
// DOMRect and its ResizeObserver never fires, so every chart renders no <svg>
// at all ("The width(0) and height(0) of chart should be greater than 0").
//
// happy-dom's getComputedStyle does report declared inline sizes ('220px',
// '100%', '' for auto), so stand in for layout with a minimal block-flow
// approximation: px sizes are used as-is, percentages resolve against the
// parent, auto width fills the parent (block elements stretch to their
// containing block), auto height is 0 (content height is unknowable without
// layout), and the root resolves against the viewport. A chart therefore
// only gets a non-zero size if its own markup gives it one (e.g. the
// components' `<div style={{ height: 220 }}>` wrapper).
function resolveLength(value: string, parentSize: number, autoSize: number): number {
  if (value.endsWith('px')) return parseFloat(value);
  if (value.endsWith('%')) return (parseFloat(value) / 100) * parentSize;
  return autoSize;
}

function layoutSize(el: Element): { width: number; height: number } {
  const parent = el.parentElement;
  const container = parent
    ? layoutSize(parent)
    : { width: window.innerWidth, height: window.innerHeight };
  const style = getComputedStyle(el);
  return {
    width: resolveLength(style.width, container.width, container.width),
    height: resolveLength(style.height, container.height, 0),
  };
}

Element.prototype.getBoundingClientRect = function getBoundingClientRect(): DOMRect {
  const { width, height } = layoutSize(this);
  return new DOMRect(0, 0, width, height);
};
