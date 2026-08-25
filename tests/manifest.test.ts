import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const manifest = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '../public/manifest.json'), 'utf8'),
) as Record<string, unknown>;
const packageJson = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '../package.json'), 'utf8'),
) as Record<string, unknown>;
const packageLock = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '../package-lock.json'), 'utf8'),
) as { packages?: Record<string, Record<string, unknown>>; version?: string };

describe('manifest privacy boundary', () => {
  it('uses Manifest V3 and only the Spotify host permission', () => {
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.minimum_chrome_version).toBe('149');
    expect(manifest.host_permissions).toEqual(['https://open.spotify.com/*']);
    expect(manifest.content_security_policy).toEqual({
      extension_pages:
        "script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors https://open.spotify.com",
    });
    expect(manifest.permissions).toBeUndefined();
    expect(manifest.optional_permissions).toBeUndefined();
  });

  it('keeps public metadata and release versions synchronized', () => {
    expect(packageJson.private).toBe(true);
    expect(packageJson.license).toBe('MIT');
    expect(packageJson.author).toEqual({
      name: 'Ibsen Gonzalez',
      url: 'https://github.com/ibsenjg',
    });
    expect(packageJson.repository).toEqual({
      type: 'git',
      url: 'git+https://github.com/ibsenjg/music-discovery-overlay.git',
    });
    expect(packageJson.homepage).toBe(
      'https://github.com/ibsenjg/music-discovery-overlay#readme',
    );
    expect(packageJson.bugs).toEqual({
      url: 'https://github.com/ibsenjg/music-discovery-overlay/issues',
    });
    expect(packageJson.version).toBe(manifest.version);
    expect(packageLock.version).toBe(manifest.version);
    expect(packageLock.packages?.['']?.version).toBe(manifest.version);
  });

  it('injects only on Spotify Web and exposes only the overlay build', () => {
    expect(manifest.content_scripts).toEqual([
      expect.objectContaining({ matches: ['https://open.spotify.com/*'] }),
    ]);
    expect(manifest.web_accessible_resources).toEqual([
      expect.objectContaining({
        matches: ['https://open.spotify.com/*'],
        resources: ['frame/index.html', 'assets/*'],
      }),
    ]);
  });

  it('ships the independent Aurora icon at every manifest size', () => {
    expect(manifest.icons).toEqual({
      '16': 'icons/aurora-16.png',
      '32': 'icons/aurora-32.png',
      '48': 'icons/aurora-48.png',
      '128': 'icons/aurora-128.png',
    });

    for (const size of [16, 32, 48, 128]) {
      const iconPath = resolve(
        import.meta.dirname,
        `../public/icons/aurora-${size}.png`,
      );
      expect(existsSync(iconPath)).toBe(true);
      const icon = readFileSync(iconPath);
      expect(icon.subarray(1, 4).toString('ascii')).toBe('PNG');
      expect(icon.readUInt32BE(16)).toBe(size);
      expect(icon.readUInt32BE(20)).toBe(size);
    }
  });

  it('does not request Spotify API, account, storage, or playback capabilities', () => {
    const serialized = JSON.stringify(manifest);
    for (const forbidden of [
      'storage',
      'cookies',
      'identity',
      'history',
      'tabs',
      'spotify.com/v1',
      'webRequest',
    ]) {
      expect(serialized).not.toContain(`"${forbidden}"`);
    }
  });
});
