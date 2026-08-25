import '@testing-library/jest-dom/vitest';

Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
  configurable: true,
  value: () => ({
    x: 10,
    y: 10,
    top: 10,
    right: 410,
    bottom: 58,
    left: 10,
    width: 400,
    height: 48,
    toJSON: () => ({}),
  }),
});

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: () => undefined,
});
