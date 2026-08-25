export type SearchMethod = 'native' | 'route';

const GLOBAL_SEARCH_SELECTORS = [
  'input[data-testid="search-input"]',
  'input[data-testid="spotify-search-input"]',
  'input[aria-label*="want to play" i]',
  'input[aria-label*="quieres escuchar" i]',
  'input[placeholder*="want to play" i]',
  'input[placeholder*="quieres escuchar" i]',
] as const;

function isUsableSearchInput(element: Element): element is HTMLInputElement {
  if (!(element instanceof HTMLInputElement)) return false;
  if (element.disabled || element.readOnly) return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

export class SpotifySearchAdapter {
  locate(): HTMLInputElement | undefined {
    for (const selector of GLOBAL_SEARCH_SELECTORS) {
      const matches = document.querySelectorAll(selector);
      for (const match of matches) {
        if (isUsableSearchInput(match)) return match;
      }
    }
    return undefined;
  }

  populateAndSubmit(query: string): SearchMethod {
    const safeQuery = query.trim().slice(0, 200);
    if (!safeQuery) throw new Error('Search query cannot be empty');
    const input = this.locate();
    if (!input) return this.routeFallback(safeQuery);

    const descriptor = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    );
    descriptor?.set?.call(input, safeQuery);
    input.dispatchEvent(
      new InputEvent('input', { bubbles: true, data: safeQuery }),
    );
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.focus();
    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        bubbles: true,
        cancelable: true,
      }),
    );
    input.dispatchEvent(
      new KeyboardEvent('keyup', {
        key: 'Enter',
        code: 'Enter',
        bubbles: true,
        cancelable: true,
      }),
    );
    return 'native';
  }

  routeFallback(query: string): SearchMethod {
    const path = `/search/${encodeURIComponent(query)}`;
    if (document.documentElement.dataset.mdoFixture === 'true') {
      history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } else {
      window.location.assign(path);
    }
    return 'route';
  }
}
