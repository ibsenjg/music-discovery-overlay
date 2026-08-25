import { expect, test } from '@playwright/test';
import { mockLocalAudio, mockRecoveringLocalAi } from './fixtures';

test('builds, clarifies, and submits a guided discovery search', async ({
  page,
}) => {
  const externalRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.hostname !== '127.0.0.1') externalRequests.push(request.url());
  });
  await page.goto('/mock/');
  const frameElement = page.locator('iframe[title="Music discovery wizard"]');
  await expect(frameElement).toHaveAttribute(
    'src',
    /parentOrigin=http%3A%2F%2F127\.0\.0\.1%3A4173/,
  );
  await expect(frameElement).toHaveAttribute(
    'allow',
    'language-model; microphone',
  );
  const overlay = page.frameLocator('iframe[title="Music discovery wizard"]');
  await overlay.getByRole('button', { name: 'Open music discovery' }).click();
  await expect(page.locator('#music-discovery-overlay-host')).toHaveCSS(
    'width',
    '430px',
  );
  await expect(page.locator('#music-discovery-overlay-host')).toHaveCSS(
    'border-radius',
    '0px',
  );
  const headerMark = overlay.locator('.header-mark');
  await expect(headerMark).toHaveCSS('border-radius', '50%');
  await expect(headerMark).toHaveCSS('background-image', /linear-gradient/);
  await overlay.getByRole('button', { name: 'Open settings' }).click();
  await overlay
    .getByRole('combobox', { name: 'Discovery provider' })
    .selectOption('rules');
  await overlay.getByRole('button', { name: 'Close settings' }).click();
  await overlay
    .getByRole('textbox', { name: 'Describe the music you want to find' })
    .fill('genre:classical 432 Hz with piano, trumpet or violin');
  await overlay
    .getByRole('button', { name: 'Generate search suggestions' })
    .click();
  await expect(
    overlay.getByRole('heading', { name: 'What does 432 Hz mean here?' }),
  ).toBeVisible();
  await overlay.getByRole('button', { name: 'A4 tuning reference' }).click();
  await expect(
    overlay.getByRole('heading', { name: 'Reasoned music routes' }),
  ).toBeVisible();
  await overlay
    .getByRole('button', {
      name: 'Search for Contextual literal reading in Spotify',
    })
    .click();
  await expect(page.getByRole('searchbox')).toHaveValue('');
  await expect(page.locator('#fixture-result')).toContainText(
    'Search received:',
  );
  expect(externalRequests).toEqual([]);
});

test('keeps one overlay across SPA-like mutations and navigation', async ({
  page,
}) => {
  await page.goto('/mock/');
  await expect(page.locator('#music-discovery-overlay-host')).toHaveCount(1);
  await page.evaluate(() => {
    history.pushState({}, '', '/mock/library');
    const node = document.createElement('section');
    node.textContent = 'SPA update';
    document.body.append(node);
  });
  await expect(page.locator('#music-discovery-overlay-host')).toHaveCount(1);
});

test('keeps the header visible after a search is minimized and reopened', async ({
  page,
}) => {
  await page.setViewportSize({ width: 430, height: 800 });
  await page.goto('/mock/');
  const overlay = page.frameLocator('iframe[title="Music discovery wizard"]');
  await overlay.getByRole('button', { name: 'Open music discovery' }).click();
  await overlay.getByRole('button', { name: 'Open settings' }).click();
  await overlay
    .getByRole('combobox', { name: 'Discovery provider' })
    .selectOption('rules');
  await overlay.getByRole('button', { name: 'Close settings' }).click();
  await overlay
    .getByRole('textbox', { name: 'Describe the music you want to find' })
    .fill('artists with drums jazz chords and wordless vocals');
  await overlay
    .getByRole('button', { name: 'Generate search suggestions' })
    .click();
  await expect(
    overlay.getByRole('heading', { name: 'Discover music your way' }),
  ).toBeInViewport();
  await expect(
    overlay.getByRole('button', { name: 'Minimize music discovery' }),
  ).toBeInViewport();
  await overlay
    .getByRole('button', {
      name: 'Search for Contextual literal reading in Spotify',
    })
    .click();
  await expect(
    overlay.getByRole('heading', { name: 'Discover music your way' }),
  ).toBeInViewport();

  await overlay
    .getByRole('button', { name: 'Minimize music discovery' })
    .click();
  const host = page.locator('#music-discovery-overlay-host');
  await expect(host).toHaveCSS('width', '44px');
  await expect(host).toHaveCSS('height', '44px');
  await expect(
    overlay.getByRole('button', { name: 'Open music discovery' }),
  ).toBeInViewport();
  await overlay.getByRole('button', { name: 'Open music discovery' }).click();

  const frame = page
    .frames()
    .find((candidate) => candidate.url().includes('/frame/index.html'));
  expect(frame).toBeDefined();
  const viewport = await frame?.evaluate(() => ({
    bodyOverflow: getComputedStyle(document.body).overflow,
    drawerMinHeight: getComputedStyle(
      document.querySelector('.drawer-scroll') as HTMLElement,
    ).minHeight,
    innerHeight: window.innerHeight,
    rootOverflow: getComputedStyle(document.documentElement).overflow,
    scrollHeight: document.documentElement.scrollHeight,
    scrollY: window.scrollY,
  }));
  expect(viewport?.rootOverflow).toBe('hidden');
  expect(viewport?.bodyOverflow).toBe('hidden');
  expect(viewport?.drawerMinHeight).toBe('0px');
  expect(viewport?.scrollY).toBe(0);
  expect(
    Math.abs((viewport?.scrollHeight ?? 0) - (viewport?.innerHeight ?? 0)),
  ).toBeLessThanOrEqual(1);
  await expect(
    overlay.getByRole('heading', { name: 'Discover music your way' }),
  ).toBeInViewport();
  await expect(
    overlay.getByRole('button', { name: 'Minimize music discovery' }),
  ).toBeInViewport();
  await expect(
    overlay.getByRole('heading', { name: 'Reasoned music routes' }),
  ).toBeInViewport();
  await expect
    .poll(async () => {
      const suggestionsTop = await overlay
        .locator('.suggestions')
        .evaluate((element) => element.getBoundingClientRect().top);
      const scrollerTop = await overlay
        .locator('.drawer-scroll')
        .evaluate((element) => element.getBoundingClientRect().top);
      return Math.round(suggestionsTop - scrollerTop);
    })
    .toBe(0);
});

test('continues local generation while minimized and reveals the finished routes', async ({
  page,
}) => {
  await mockLocalAudio(page, false, 1_000);
  await page.goto('/mock/');
  const overlay = page.frameLocator('iframe[title="Music discovery wizard"]');
  await overlay.getByRole('button', { name: 'Open music discovery' }).click();
  await overlay
    .getByRole('textbox', { name: 'Describe the music you want to find' })
    .fill('piano with melodic bass');
  await overlay
    .getByRole('button', { name: 'Generate search suggestions' })
    .click();

  const minimize = overlay.getByRole('button', {
    name: 'Minimize music discovery',
  });
  await expect(minimize).toHaveText('−');
  await minimize.click();

  const host = page.locator('#music-discovery-overlay-host');
  await expect(host).toHaveCSS('width', '44px');
  await expect(host).toHaveCSS('height', '44px');
  const busyLauncher = overlay.getByRole('button', {
    name: 'Creating suggestions… Open music discovery',
  });
  await expect(busyLauncher).toHaveAttribute('aria-busy', 'true');
  await expect(busyLauncher.locator('.loading-spinner')).toBeVisible();

  const launcher = overlay.getByRole('button', {
    name: 'Open music discovery',
  });
  await expect(launcher).toBeVisible();
  await launcher.click();
  await expect(
    overlay.getByRole('heading', { name: 'Reasoned music routes' }),
  ).toBeInViewport();
  await expect(
    overlay.getByRole('heading', { name: 'Contemporary piano trios' }),
  ).toBeInViewport();

  await overlay
    .getByRole('button', { name: 'Minimize music discovery' })
    .click();
  await overlay.getByRole('button', { name: 'Open music discovery' }).click();
  await expect
    .poll(async () => {
      const suggestionsTop = await overlay
        .locator('.suggestions')
        .evaluate((element) => element.getBoundingClientRect().top);
      const scrollerTop = await overlay
        .locator('.drawer-scroll')
        .evaluate((element) => element.getBoundingClientRect().top);
      return Math.round(suggestionsTop - scrollerTop);
    })
    .toBe(0);
});

test('does not persist composer or provider state across reload', async ({
  page,
}) => {
  await page.goto('/frame/index.html#nonce=e2e');
  await page.getByRole('button', { name: 'Open music discovery' }).click();
  await page.getByRole('button', { name: 'Use Guided discovery' }).click();
  await page
    .getByRole('textbox', { name: 'Describe the music you want to find' })
    .fill('private draft');
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
    })),
  ).toEqual({ local: 0, session: 0 });
  await page.reload();
  await page.getByRole('button', { name: 'Open music discovery' }).click();
  await expect(
    page.getByRole('textbox', { name: 'Describe the music you want to find' }),
  ).toHaveValue('');
  await expect(
    page.getByRole('button', { name: 'Use Guided discovery' }),
  ).toBeVisible();
});

test('recovers unavailable local AI on focus without requiring a search', async ({
  page,
}) => {
  await mockRecoveringLocalAi(page);
  await page.goto('/frame/index.html#nonce=e2e');
  await page.getByRole('button', { name: 'Open music discovery' }).click();
  await expect(page.getByRole('button', { name: 'Check again' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Generate search suggestions' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Use microphone' }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () =>
        (globalThis as typeof globalThis & { __mdoCreateCalls?: number })
          .__mdoCreateCalls,
    ),
  ).toBe(0);

  await page.evaluate(() => {
    (
      globalThis as typeof globalThis & { __mdoAvailability?: string }
    ).__mdoAvailability = 'downloadable';
    window.dispatchEvent(new Event('focus'));
  });
  const download = page.getByRole('button', { name: 'Download local AI' });
  await expect(download).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        (globalThis as typeof globalThis & { __mdoCreateCalls?: number })
          .__mdoCreateCalls,
    ),
  ).toBe(0);

  await download.click();
  await expect(
    page.getByRole('button', { name: 'Generate search suggestions' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Use microphone' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        (globalThis as typeof globalThis & { __mdoCreateCalls?: number })
          .__mdoCreateCalls,
    ),
  ).toBe(1);
});

test('aligns the launcher below the profile control and uses the fixed fallback', async ({
  page,
}) => {
  await page.goto('/mock/');
  const host = page.locator('#music-discovery-overlay-host');
  const profile = page.locator('button[data-testid="user-widget-link"]');
  const [hostBox, profileBox] = await Promise.all([
    host.boundingBox(),
    profile.boundingBox(),
  ]);
  expect(hostBox).not.toBeNull();
  expect(profileBox).not.toBeNull();
  if (!hostBox || !profileBox) throw new Error('Fixture geometry missing');
  expect(hostBox.y).toBeCloseTo(profileBox.y + profileBox.height + 8, 0);
  expect(hostBox.x + hostBox.width / 2).toBeCloseTo(
    profileBox.x + profileBox.width / 2,
    0,
  );
  const frameElement = page.locator('iframe[title="Music discovery wizard"]');
  const overlay = page.frameLocator('iframe[title="Music discovery wizard"]');
  const launcher = overlay.getByRole('button', {
    name: 'Open music discovery',
  });
  await expect(host).toHaveCSS('border-radius', '50%');
  await expect(host).toHaveCSS('overflow', 'hidden');
  await expect(frameElement).toHaveCSS('border-radius', '50%');
  await expect(launcher).toHaveCSS('border-radius', '50%');
  await expect(launcher).toHaveCSS('background-image', /linear-gradient/);
  await launcher.hover();
  await expect(launcher.locator('svg')).toHaveCSS(
    'transform',
    'matrix(1, 0, 0, 1, 0, 2)',
  );
  await profile.evaluate((element) => element.remove());
  await expect(host).toHaveCSS('top', '72px');
  await expect(host).toHaveCSS('right', '12px');
});

test('uses the encoded route when the native search field disappears', async ({
  page,
}) => {
  await page.goto('/mock/');
  const overlay = page.frameLocator('iframe[title="Music discovery wizard"]');
  await overlay.getByRole('button', { name: 'Open music discovery' }).click();
  await overlay.getByRole('button', { name: 'Open settings' }).click();
  await overlay
    .getByRole('combobox', { name: 'Discovery provider' })
    .selectOption('rules');
  await overlay.getByRole('button', { name: 'Close settings' }).click();
  await overlay
    .getByRole('textbox', { name: 'Describe the music you want to find' })
    .fill('genre:jazz trumpet');
  await overlay
    .getByRole('button', { name: 'Generate search suggestions' })
    .click();
  await page
    .locator('[data-testid="spotify-search-input"]')
    .evaluate((element) => element.remove());
  await overlay
    .getByRole('button', {
      name: 'Search for Contextual literal reading in Spotify',
    })
    .click();
  await expect(page).toHaveURL(/\/search\//);
  await expect(page.getByRole('searchbox')).toHaveValue('');
});

test('requests microphone only after disclosure and returns a transcript draft', async ({
  page,
}) => {
  await mockLocalAudio(page);
  await page.goto('/mock/');
  const overlay = page.frameLocator('iframe[title="Music discovery wizard"]');
  await overlay.getByRole('button', { name: 'Open music discovery' }).click();
  await overlay.getByRole('button', { name: 'Use microphone' }).click();
  await expect(
    overlay.getByRole('dialog', { name: 'Use microphone' }),
  ).toBeVisible();
  await overlay.getByRole('button', { name: 'Allow and start' }).click();
  await overlay.getByRole('button', { name: 'Stop recording' }).click();
  await expect(
    overlay.getByRole('textbox', {
      name: 'Describe the music you want to find',
    }),
  ).toHaveValue('local piano transcript');
  await expect(overlay.getByRole('status')).toContainText(
    'Transcript added as a draft',
  );
  await expect
    .poll(async () => {
      const frame = page
        .frames()
        .find((candidate) => candidate.url().includes('/frame/index.html'));
      return frame?.evaluate(
        () =>
          (
            globalThis as typeof globalThis & {
              __mdoPromptCounters?: { audio: number; text: number };
            }
          ).__mdoPromptCounters?.audio,
      );
    })
    .toBe(1);
});

test('uses local AI for the next step after an audio transcript and keeps Spotify confirmation explicit', async ({
  page,
}) => {
  await mockLocalAudio(page);
  await page.goto('/mock/');
  const overlay = page.frameLocator('iframe[title="Music discovery wizard"]');
  await overlay.getByRole('button', { name: 'Open music discovery' }).click();
  await overlay.getByRole('button', { name: 'Use microphone' }).click();
  await overlay.getByRole('button', { name: 'Allow and start' }).click();
  await overlay.getByRole('button', { name: 'Stop recording' }).click();
  await expect(
    overlay.getByRole('textbox', {
      name: 'Describe the music you want to find',
    }),
  ).toHaveValue('local piano transcript');
  await overlay
    .getByRole('button', { name: 'Generate search suggestions' })
    .click();
  await expect(
    overlay.getByRole('heading', { name: 'Reasoned music routes' }),
  ).toBeVisible();
  const primarySearch = overlay.getByRole('button', {
    name: 'Search for GoGo Penguin in Spotify',
  });
  await expect(primarySearch).toBeVisible();
  await expect(primarySearch).toHaveText('Search GoGo Penguin');
  await expect(overlay.locator('.candidate-card > code')).toHaveCount(0);
  await expect(overlay.getByText('Start with')).toBeVisible();
  await expect(
    overlay.getByText('Hopopono — GoGo Penguin', { exact: true }),
  ).toHaveCount(1);
  await expect(page.locator('#fixture-result')).toHaveText('');
  await expect
    .poll(async () => {
      const frame = page
        .frames()
        .find((candidate) => candidate.url().includes('/frame/index.html'));
      return frame?.evaluate(
        () =>
          (
            globalThis as typeof globalThis & {
              __mdoPromptCounters?: { audio: number; text: number };
            }
          ).__mdoPromptCounters,
      );
    })
    .toEqual({ audio: 1, text: 1 });

  await overlay
    .getByRole('button', { name: 'Search for GoGo Penguin in Spotify' })
    .click();
  await expect(page.locator('#fixture-result')).toContainText('GoGo Penguin');
  await overlay
    .getByRole('button', {
      name: 'Search for Hopopono — GoGo Penguin in Spotify',
    })
    .click();
  await expect(page.locator('#fixture-result')).toContainText(
    'Hopopono — GoGo Penguin',
  );
});

test('shows the denied microphone state without a cloud fallback', async ({
  page,
}) => {
  await mockLocalAudio(page, true);
  await page.goto('/mock/');
  const overlay = page.frameLocator('iframe[title="Music discovery wizard"]');
  await overlay.getByRole('button', { name: 'Open music discovery' }).click();
  await overlay.getByRole('button', { name: 'Use microphone' }).click();
  await overlay.getByRole('button', { name: 'Allow and start' }).click();
  await expect(overlay.getByRole('status')).toContainText(
    'Microphone permission was denied',
  );
});
