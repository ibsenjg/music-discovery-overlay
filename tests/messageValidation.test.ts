import {
  isContentToFrameMessage,
  isFrameToContentMessage,
} from '../src/shared/messageValidation';

describe('extension bridge message validation', () => {
  const nonce = 'trusted-nonce';

  it.each([
    { source: 'other', nonce, type: 'overlay-state', open: true },
    { source: 'mdo-frame', nonce: 'wrong', type: 'overlay-state', open: true },
    { source: 'mdo-frame', nonce, type: 'unknown', open: true },
    { source: 'mdo-frame', nonce, type: 'reload-overlay' },
    { source: 'mdo-frame', nonce, type: 'overlay-state', open: 'true' },
    { source: 'mdo-frame', nonce, type: 'search', query: 42 },
    { source: 'mdo-frame', nonce, type: 'search', query: '   ' },
    { source: 'mdo-frame', nonce, type: 'search', query: 'a'.repeat(201) },
  ])('rejects an invalid frame message: $type', (message) => {
    expect(isFrameToContentMessage(message, nonce)).toBe(false);
  });

  it.each([
    { source: 'mdo-frame', nonce, type: 'overlay-state', open: false },
    { source: 'mdo-frame', nonce, type: 'search', query: 'Brian Eno' },
    { source: 'mdo-frame', nonce, type: 'search', query: 'a'.repeat(200) },
  ])('accepts a valid frame message: $type', (message) => {
    expect(isFrameToContentMessage(message, nonce)).toBe(true);
  });

  it.each([
    { source: 'other', nonce, type: 'search-result', method: 'native' },
    {
      source: 'mdo-content',
      nonce: 'wrong',
      type: 'search-result',
      method: 'native',
    },
    { source: 'mdo-content', nonce, type: 'unknown', method: 'native' },
    {
      source: 'mdo-content',
      nonce,
      type: 'overlay-state-result',
      open: 'true',
    },
    { source: 'mdo-content', nonce, type: 'search-result', method: 'manual' },
  ])('rejects an invalid content message: $type', (message) => {
    expect(isContentToFrameMessage(message, nonce)).toBe(false);
  });

  it.each([
    {
      source: 'mdo-content',
      nonce,
      type: 'overlay-state-result',
      open: true,
    },
    { source: 'mdo-content', nonce, type: 'search-result', method: 'native' },
    { source: 'mdo-content', nonce, type: 'search-result', method: 'route' },
  ])('accepts a valid content message: $type', (message) => {
    expect(isContentToFrameMessage(message, nonce)).toBe(true);
  });
});
