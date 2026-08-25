import type { ContentToFrameMessage, FrameToContentMessage } from './types';

const MAX_SEARCH_QUERY_LENGTH = 200;

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function isFrameToContentMessage(
  value: unknown,
  nonce: string,
): value is FrameToContentMessage {
  if (!isObject(value) || value.source !== 'mdo-frame') return false;
  if (value.nonce !== nonce) return false;

  if (value.type === 'overlay-state') {
    return typeof value.open === 'boolean';
  }
  if (value.type !== 'search' || typeof value.query !== 'string') {
    return false;
  }

  const query = value.query.trim();
  return query.length > 0 && value.query.length <= MAX_SEARCH_QUERY_LENGTH;
}

export function isContentToFrameMessage(
  value: unknown,
  nonce: string,
): value is ContentToFrameMessage {
  if (!isObject(value) || value.source !== 'mdo-content') return false;
  if (value.nonce !== nonce) return false;

  if (value.type === 'overlay-state-result') {
    return typeof value.open === 'boolean';
  }
  return (
    value.type === 'search-result' &&
    (value.method === 'native' || value.method === 'route')
  );
}
