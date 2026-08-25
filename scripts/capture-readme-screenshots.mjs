import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = resolve(root, 'docs/assets');
const baseUrl = 'http://127.0.0.1:4173';
let server;

async function isFixtureReady() {
  try {
    const response = await fetch(`${baseUrl}/mock/`);
    return response.ok && (await response.text()).includes('fixture-result');
  } catch {
    return false;
  }
}

async function ensureFixture() {
  if (await isFixtureReady()) return;

  server = spawn(
    process.execPath,
    [
      'node_modules/vite/bin/vite.js',
      '--config',
      'vite.mock.config.ts',
      '--host',
      '127.0.0.1',
    ],
    { cwd: root, stdio: 'inherit' },
  );

  for (let attempt = 0; attempt < 60; attempt += 1) {
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
    if (await isFixtureReady()) return;
    if (server.exitCode !== null) break;
  }

  throw new Error(`The sanitized fixture did not start at ${baseUrl}/mock/.`);
}

async function capture() {
  await ensureFixture();
  await mkdir(outputDirectory, { recursive: true });

  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    const page = await browser.newPage({
      colorScheme: 'dark',
      deviceScaleFactor: 1,
      viewport: { width: 1280, height: 800 },
    });
    await page.goto(`${baseUrl}/mock/`);

    const overlay = page.frameLocator('iframe[title="Music discovery wizard"]');
    await overlay.getByRole('button', { name: 'Open music discovery' }).click();
    await overlay
      .getByRole('heading', { name: 'Discover music your way' })
      .waitFor();
    await overlay.getByRole('button', { name: 'Use Guided discovery' }).click();

    await page.screenshot({
      animations: 'disabled',
      path: resolve(outputDirectory, 'aurora-overview.png'),
    });

    await overlay.getByRole('button', { name: 'Open settings' }).click();
    await overlay.getByRole('group', { name: 'Theme' }).waitFor();
    await page.screenshot({
      animations: 'disabled',
      path: resolve(outputDirectory, 'theme-picker.png'),
    });

    await overlay.getByRole('button', { name: 'Close settings' }).click();
    await overlay
      .getByRole('textbox', { name: 'Describe the music you want to find' })
      .fill('artists with piano, bass, and melodic interplay');
    await overlay
      .getByRole('button', { name: 'Generate search suggestions' })
      .click();
    await overlay
      .getByRole('heading', { name: 'Reasoned music routes' })
      .waitFor();

    await page.screenshot({
      animations: 'disabled',
      path: resolve(outputDirectory, 'reasoned-routes.png'),
    });
  } finally {
    await browser.close();
  }
}

try {
  await capture();
  console.log(`README screenshots written to ${outputDirectory}`);
} finally {
  if (server && server.exitCode === null) server.kill('SIGTERM');
}
