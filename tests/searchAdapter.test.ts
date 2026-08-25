import { SpotifySearchAdapter } from '../src/content/spotifySearchAdapter';

describe('SpotifySearchAdapter', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.documentElement.dataset.mdoFixture = 'true';
    history.replaceState({}, '', '/');
  });

  it('populates and submits Spotify global search', () => {
    document.body.innerHTML =
      '<input data-testid="search-input" role="combobox" type="search" aria-label="What do you want to play?">';
    const input = document.querySelector('input');
    expect(input).not.toBeNull();
    if (!input) throw new Error('Missing test input');
    let submitted = false;
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') submitted = true;
    });
    const method = new SpotifySearchAdapter().populateAndSubmit(
      'genre:classical',
    );
    expect(method).toBe('native');
    expect(input).toHaveValue('genre:classical');
    expect(submitted).toBe(true);
  });

  it('ignores the library filter when it appears before global search', () => {
    document.body.innerHTML = `
      <aside aria-label="Your Library">
        <input role="searchbox" aria-label="Type to filter your library. The list of content below will update as you type." placeholder="Search in Your Library">
      </aside>
      <header>
        <form role="search">
          <input data-testid="search-input" role="combobox" type="search" aria-label="What do you want to play?">
        </form>
      </header>
    `;
    const libraryInput = document.querySelector<HTMLInputElement>(
      'input[role="searchbox"]',
    );
    const globalInput = document.querySelector<HTMLInputElement>(
      'input[data-testid="search-input"]',
    );
    expect(libraryInput).not.toBeNull();
    expect(globalInput).not.toBeNull();
    if (!libraryInput || !globalInput) throw new Error('Missing test inputs');

    let librarySubmitted = false;
    let globalSubmitted = false;
    libraryInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') librarySubmitted = true;
    });
    globalInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') globalSubmitted = true;
    });

    const method = new SpotifySearchAdapter().populateAndSubmit('trumpet');

    expect(method).toBe('native');
    expect(libraryInput).toHaveValue('');
    expect(globalInput).toHaveValue('trumpet');
    expect(librarySubmitted).toBe(false);
    expect(globalSubmitted).toBe(true);
  });

  it('uses the route fallback instead of writing to the library filter', () => {
    document.body.innerHTML = `
      <aside aria-label="Tu biblioteca">
        <input role="searchbox" aria-label="Filtrar tu biblioteca" placeholder="Buscar en Tu biblioteca">
      </aside>
    `;
    const libraryInput = document.querySelector<HTMLInputElement>('input');
    expect(libraryInput).not.toBeNull();

    const method = new SpotifySearchAdapter().populateAndSubmit('jazz piano');

    expect(method).toBe('route');
    expect(libraryInput).toHaveValue('');
    expect(location.pathname).toBe('/search/jazz%20piano');
  });

  it('uses the encoded route fallback when no search field is available', () => {
    const method = new SpotifySearchAdapter().populateAndSubmit('432 Hz piano');
    expect(method).toBe('route');
    expect(location.pathname).toBe('/search/432%20Hz%20piano');
  });

  it('rejects empty queries', () => {
    expect(() => new SpotifySearchAdapter().populateAndSubmit('  ')).toThrow();
  });
});
