document.documentElement.dataset.mdoFixture = 'true';

const runtime = {
  getURL(path = ''): string {
    return new URL(`/${path}`, window.location.origin).href;
  },
};

const chromeStub = { runtime };
Object.assign(globalThis, {
  chrome:
    'chrome' in globalThis
      ? Object.assign((globalThis as { chrome: object }).chrome, chromeStub)
      : chromeStub,
});

const input = document.querySelector<HTMLInputElement>(
  '[data-testid="spotify-search-input"]',
);
const result = document.querySelector<HTMLOutputElement>('#fixture-result');
input?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && result) {
    result.value = `Search received: ${input.value}`;
  }
});

await import('../content/index');

export {};
