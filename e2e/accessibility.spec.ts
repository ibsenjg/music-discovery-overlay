import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { mockDownloadingLocalAi, mockLocalAudio } from './fixtures';

// The iframe is intentionally a supplementary Spotify overlay (`aside`), not the
// host document's primary content. Disable only Axe's best-practice main-landmark rule.
const EMBEDDED_OVERLAY_RULE_EXCEPTIONS = ['landmark-one-main'];

test('switches all three visual themes with native radios and no accessibility violations', async ({
  page,
}) => {
  await page.goto('/frame/index.html#nonce=e2e');
  await page.getByRole('button', { name: 'Open music discovery' }).click();
  await page.getByRole('button', { name: 'Open settings' }).click();

  const themes = page.getByRole('group', { name: 'Theme' });
  const choices = [
    { name: /Aurora/, id: 'aurora', accent: '#8fdcf2' },
    { name: /Pulse/, id: 'pulse', accent: '#ff9a88' },
    { name: /Nightwave/, id: 'nightwave', accent: '#8eb8ff' },
  ];

  for (const choice of choices) {
    const radio = themes.getByRole('radio', { name: choice.name });
    await radio.check();
    await expect(radio).toBeChecked();
    await expect(page.locator('html')).toHaveAttribute('data-theme', choice.id);
    expect(
      await page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue('--accent')
          .trim(),
      ),
    ).toBe(choice.accent);

    const results = await new AxeBuilder({ page })
      .disableRules(EMBEDDED_OVERLAY_RULE_EXCEPTIONS)
      .analyze();
    expect(results.violations).toEqual([]);
  }

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'aurora');
});

test('generated routes have no accessibility violations and return focus on close', async ({
  page,
}) => {
  await page.goto('/frame/index.html#nonce=e2e');
  const launcher = page.getByRole('button', { name: 'Open music discovery' });
  await launcher.focus();
  await page.keyboard.press('Enter');
  const composer = page.getByRole('textbox', {
    name: 'Describe the music you want to find',
  });
  await expect(composer).toBeFocused();
  const composerFocus = await composer.evaluate((element) => {
    const body = element.parentElement;
    if (!body) throw new Error('Expected composer body');
    const inputStyle = getComputedStyle(element);
    const bodyStyle = getComputedStyle(body);
    return {
      bodyShadow: bodyStyle.boxShadow,
      inputOutlineStyle: inputStyle.outlineStyle,
      inputOutlineWidth: inputStyle.outlineWidth,
    };
  });
  expect(composerFocus).toEqual({
    bodyShadow: 'none',
    inputOutlineStyle: 'solid',
    inputOutlineWidth: '3px',
  });
  await page.getByRole('button', { name: 'Use Guided discovery' }).click();
  await composer.fill('artists with piano, bass, and melodic interplay');
  await page
    .getByRole('button', { name: 'Generate search suggestions' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Reasoned music routes' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: 'Search for Contextual literal reading in Spotify',
    }),
  ).toBeVisible();

  const results = await new AxeBuilder({ page })
    .disableRules(EMBEDDED_OVERLAY_RULE_EXCEPTIONS)
    .analyze();
  expect(results.violations).toEqual([]);

  await page.keyboard.press('Escape');
  await expect(launcher).toBeFocused();
});

test('microphone consent is modal, traps focus, and restores the microphone trigger', async ({
  page,
}) => {
  await mockLocalAudio(page);
  await page.goto('/frame/index.html#nonce=e2e');
  await page.getByRole('button', { name: 'Open music discovery' }).click();
  const microphone = page.getByRole('button', { name: 'Use microphone' });
  await microphone.click();

  const consent = page.getByRole('dialog', { name: 'Use microphone' });
  const allow = consent.getByRole('button', { name: 'Allow and start' });
  const cancel = consent.getByRole('button', { name: 'Cancel' });
  await expect(consent).toHaveAttribute('aria-modal', 'true');
  await expect(allow).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(cancel).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(allow).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(cancel).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(allow).toBeFocused();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  await page.keyboard.press('Escape');
  await expect(consent).toHaveCount(0);
  await expect(microphone).toBeFocused();
});

test('model-removal restart flow has no accessibility violations and restores focus', async ({
  page,
}) => {
  await mockLocalAudio(page);
  await page.goto('/frame/index.html#nonce=e2e');
  await page.getByRole('button', { name: 'Open music discovery' }).click();
  await page.getByRole('button', { name: 'Open settings' }).click();
  const remove = page.getByRole('button', {
    name: 'Remove downloaded local AI…',
  });
  await remove.click();
  await expect(
    page.getByRole('heading', {
      level: 4,
      name: 'Remove local AI from Chrome',
    }),
  ).toBeVisible();
  const settings = page.getByRole('dialog', { name: 'Discovery settings' });
  await expect(settings.getByText(/Open the Broker State tab/)).toBeVisible();
  await expect(
    settings.getByText(/Quit Chrome completely using its Quit command/),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Open Chrome AI model manager' }),
  ).toBeFocused();
  await expect(page.getByText('chrome://on-device-internals')).toBeVisible();
  await expect(
    settings.getByRole('button', { name: 'Refresh local AI status' }),
  ).toHaveCount(0);
  await expect(
    settings.getByRole('button', { name: 'Reload overlay and check again' }),
  ).toHaveCount(0);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  await page.keyboard.press('Escape');
  await expect(remove).toBeFocused();
});

test('explains local-model requirements before showing full-width download progress', async ({
  page,
}) => {
  await mockDownloadingLocalAi(page);
  await page.goto('/frame/index.html#nonce=e2e');
  await page.getByRole('button', { name: 'Open music discovery' }).click();

  await expect(
    page.getByRole('heading', {
      level: 2,
      name: 'Local AI model required',
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/Reasoned on-device AI suggestions/),
  ).toBeVisible();
  await expect(page.getByRole('status')).toContainText(
    'This extension has not created an AI session yet',
  );
  await expect(
    page.getByRole('button', { name: 'Use Guided discovery' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        (globalThis as typeof globalThis & { __mdoCreateCalls?: number })
          .__mdoCreateCalls,
    ),
  ).toBe(0);

  await page
    .getByRole('button', { name: 'Continue and show progress' })
    .click();
  const progress = page.getByRole('progressbar', {
    name: 'Local AI model download progress',
  });
  await expect(progress).toHaveAttribute('value', '25');
  const widths = await progress.evaluate((element) => {
    const card = element.closest<HTMLElement>('.local-ai-state-card');
    if (!card) throw new Error('Expected local AI state card');
    const cardStyle = getComputedStyle(card);
    const contentWidth =
      card.clientWidth -
      Number.parseFloat(cardStyle.paddingLeft) -
      Number.parseFloat(cardStyle.paddingRight);
    return {
      contentWidth,
      progressWidth: element.getBoundingClientRect().width,
    };
  });
  expect(Math.abs(widths.progressWidth - widths.contentWidth)).toBeLessThan(1);

  const results = await new AxeBuilder({ page })
    .disableRules(EMBEDDED_OVERLAY_RULE_EXCEPTIONS)
    .analyze();
  expect(results.violations).toEqual([]);
});

test('essential controls and scrolling remain reachable in a constrained viewport', async ({
  page,
}) => {
  // This non-default viewport intentionally exercises the extension's narrow-screen reflow contract.
  await page.setViewportSize({ width: 320, height: 480 });
  await page.goto('/frame/index.html#nonce=e2e');
  await page.getByRole('button', { name: 'Open music discovery' }).click();
  await page.getByRole('button', { name: 'Use Guided discovery' }).click();
  const composer = page.getByRole('textbox', {
    name: 'Describe the music you want to find',
  });
  await composer.fill(
    'artists with piano, bass, melodic interplay, jazz chords, and wordless vocals',
  );
  const generate = page.getByRole('button', {
    name: 'Generate search suggestions',
  });
  await generate.click();

  await expect(
    page.getByRole('heading', { name: 'Discover music your way' }),
  ).toBeInViewport();
  await expect(
    page.getByRole('button', { name: 'Minimize music discovery' }),
  ).toBeInViewport();
  await expect(generate).toBeInViewport();
  await expect(
    page.getByRole('heading', { name: 'Reasoned music routes' }),
  ).toBeVisible();

  const horizontalLayout = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(horizontalLayout.scrollWidth).toBeLessThanOrEqual(
    horizontalLayout.clientWidth,
  );

  const drawerScroll = page.locator('.drawer-scroll');
  const scrollRange = await drawerScroll.evaluate(
    (element) => element.scrollHeight - element.clientHeight,
  );
  expect(scrollRange).toBeGreaterThan(0);
  const scrollTop = await drawerScroll.evaluate((element) => {
    element.scrollTo({ top: element.scrollHeight });
    return element.scrollTop;
  });
  expect(scrollTop).toBeGreaterThan(0);
});

test('generated routes remain accessible with reduced motion and forced colors', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.goto('/frame/index.html#nonce=e2e');
  await page.getByRole('button', { name: 'Open music discovery' }).click();
  await page.getByRole('button', { name: 'Use Guided discovery' }).click();
  await page
    .getByRole('textbox', { name: 'Describe the music you want to find' })
    .fill('piano and melodic bass in a contemporary instrumental ensemble');
  await page
    .getByRole('button', { name: 'Generate search suggestions' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Reasoned music routes' }),
  ).toBeVisible();

  const results = await new AxeBuilder({ page })
    .disableRules(EMBEDDED_OVERLAY_RULE_EXCEPTIONS)
    .analyze();
  expect(results.violations).toEqual([]);
});
