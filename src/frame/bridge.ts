const SPOTIFY_ORIGIN = 'https://open.spotify.com';

export function nonceFromHash(hash = window.location.hash): string {
  return new URLSearchParams(hash.slice(1)).get('nonce') ?? '';
}

export function parentOriginFromHash(
  hash = window.location.hash,
  frameOrigin = window.location.origin,
  frameProtocol = window.location.protocol,
): string {
  const candidate = new URLSearchParams(hash.slice(1)).get('parentOrigin');

  if (candidate === SPOTIFY_ORIGIN) return candidate;

  // The same-origin case is only for the bundled local test fixture. An
  // extension frame embedded in Spotify must use the exact allowlisted origin.
  if (frameProtocol !== 'chrome-extension:' && candidate === frameOrigin) {
    return candidate;
  }

  return frameOrigin;
}
