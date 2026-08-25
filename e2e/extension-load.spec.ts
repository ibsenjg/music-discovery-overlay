import { realpath } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, expect, test } from '@playwright/test';

test('injects the real unpacked MV3 extension and bridges an explicit Spotify search', async ({
  browserName,
}, testInfo) => {
  expect(browserName).toBe('chromium');
  const extensionPath = await realpath(resolve(import.meta.dirname, '../dist'));
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: testInfo.project.use.headless,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });
  try {
    const worker =
      context.serviceWorkers()[0] ??
      (await context.waitForEvent('serviceworker', { timeout: 10_000 }));
    const extensionId = new URL(worker.url()).host;
    await context.route('https://open.spotify.com/**', async (route) => {
      await route.fulfill({
        contentType: 'text/html',
        body: `<!doctype html>
          <html lang="en">
            <body style="margin:0;background:#121212;color:white">
              <button data-testid="user-widget-link" style="position:fixed;right:12px;top:12px;width:44px;height:44px">Profile</button>
              <label for="spotify-search">Search</label>
              <input id="spotify-search" data-testid="search-input" aria-label="What do you want to play?" style="width:320px;height:44px" />
              <output id="submitted-search"></output>
              <script>
                document.querySelector('#spotify-search').addEventListener('keydown', (event) => {
                  if (event.key === 'Enter') {
                    document.querySelector('#submitted-search').textContent = event.currentTarget.value;
                  }
                });
              </script>
            </body>
          </html>`,
      });
    });
    const page = await context.newPage();
    const styleOrCspErrors: string[] = [];
    const recordsStyleOrCspError = (message: string): boolean =>
      /content security policy|style-src|refused to (?:apply|load).*style|blocked.*style/i.test(
        message,
      );
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      const text = message.text();
      if (recordsStyleOrCspError(text)) styleOrCspErrors.push(text);
    });
    page.on('pageerror', (error) => {
      if (recordsStyleOrCspError(error.message)) {
        styleOrCspErrors.push(error.message);
      }
    });
    await page.addInitScript(() => {
      Object.assign(globalThis, {
        LanguageModel: {
          availability: async () => 'available',
          create: async () => ({
            contextUsage: 0,
            contextWindow: 128,
            prompt: async () => '{}',
            destroy() {},
          }),
        },
      });
    });
    await page.goto('https://open.spotify.com/search');
    const host = page.locator('#music-discovery-overlay-host');
    await expect(host).toHaveCount(1);
    await expect(host).toHaveCSS('width', '44px');
    await expect
      .poll(() =>
        page
          .frames()
          .some((frame) =>
            frame.url().startsWith(`chrome-extension://${extensionId}/frame/`),
          ),
      )
      .toBe(true);
    const overlay = page
      .frames()
      .find((frame) =>
        frame.url().startsWith(`chrome-extension://${extensionId}/frame/`),
      );
    expect(overlay).toBeDefined();
    if (!overlay) throw new Error('Expected the injected extension frame');
    await expect
      .poll(() => overlay.locator('style[data-styled]').count())
      .toBeGreaterThan(0);

    const launcher = overlay.getByRole('button', {
      name: 'Open music discovery',
    });
    await expect(launcher).toBeVisible();
    await expect(launcher).toHaveCSS('border-radius', '50%');
    const launcherStyles = await launcher.evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        backgroundImage: styles.backgroundImage,
        display: styles.display,
        height: styles.height,
        width: styles.width,
      };
    });
    expect(launcherStyles).toMatchObject({
      display: 'grid',
      height: '44px',
      width: '44px',
    });
    expect(launcherStyles.backgroundImage).toContain('linear-gradient');
    expect(launcherStyles.backgroundImage).toContain('rgb(36, 51, 84)');
    await launcher.click();
    await expect(host).toHaveCSS('width', '430px');
    const drawer = overlay.getByRole('complementary', {
      name: 'Discover music your way',
    });
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveCSS('display', 'flex');
    await expect(drawer).toHaveCSS('background-color', 'rgb(15, 19, 32)');
    await overlay.getByRole('button', { name: 'Open settings' }).click();
    await overlay
      .getByRole('combobox', { name: 'Discovery provider' })
      .selectOption('rules');
    await overlay.getByRole('button', { name: 'Close settings' }).click();
    await overlay
      .getByRole('textbox', { name: 'Describe the music you want to find' })
      .fill('piano bass melodic trio');
    await overlay
      .getByRole('button', { name: 'Generate search suggestions' })
      .click();
    await overlay
      .getByRole('button', {
        name: 'Search for Contextual literal reading in Spotify',
      })
      .click();
    const submittedSearch = page.locator('#submitted-search');
    await expect(submittedSearch).not.toHaveText('');
    const submittedText = await submittedSearch.textContent();
    expect(submittedText).toBeTruthy();
    await expect(page.locator('input[data-testid="search-input"]')).toHaveValue(
      submittedText ?? '',
    );

    await overlay.getByRole('button', { name: 'Open settings' }).click();
    await overlay
      .getByRole('combobox', { name: 'Discovery provider' })
      .selectOption('on-device');
    await overlay
      .getByRole('button', { name: 'Remove downloaded local AI…' })
      .click();
    const managerPagePromise = context.waitForEvent('page');
    await overlay
      .getByRole('button', { name: 'Open Chrome AI model manager' })
      .click();
    const managerPage = await managerPagePromise;
    await managerPage.waitForLoadState();
    expect([
      'chrome://on-device-internals',
      'chrome://on-device-internals/',
      'chrome://debug-webuis-disabled/?host=chrome://on-device-internals/',
    ]).toContain(managerPage.url());
    expect(styleOrCspErrors).toEqual([]);
  } finally {
    await context.close();
  }
});
