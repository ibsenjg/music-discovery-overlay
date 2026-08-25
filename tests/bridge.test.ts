import { describe, expect, it } from 'vitest';
import { nonceFromHash, parentOriginFromHash } from '../src/frame/bridge';

describe('frame bridge context', () => {
  it('accepts the exact Spotify parent origin even when no referrer exists', () => {
    const hash = '#nonce=tab-nonce&parentOrigin=https%3A%2F%2Fopen.spotify.com';

    expect(nonceFromHash(hash)).toBe('tab-nonce');
    expect(
      parentOriginFromHash(
        hash,
        'chrome-extension://extension-id',
        'chrome-extension:',
      ),
    ).toBe('https://open.spotify.com');
  });

  it('rejects an untrusted parent origin', () => {
    expect(
      parentOriginFromHash(
        '#parentOrigin=https%3A%2F%2Fevil.example',
        'chrome-extension://extension-id',
        'chrome-extension:',
      ),
    ).toBe('chrome-extension://extension-id');
  });

  it('allows the same-origin local fixture outside extension pages', () => {
    expect(
      parentOriginFromHash(
        '#parentOrigin=http%3A%2F%2F127.0.0.1%3A4173',
        'http://127.0.0.1:4173',
        'http:',
      ),
    ).toBe('http://127.0.0.1:4173');
  });
});
