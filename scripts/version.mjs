import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const paths = {
  manifest: resolve(root, 'public/manifest.json'),
  package: resolve(root, 'package.json'),
  packageLock: resolve(root, 'package-lock.json'),
};

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function assertChromeVersion(version) {
  const parts = version.split('.');
  if (
    parts.length !== 3 ||
    parts.some((part) => !/^(0|[1-9]\d*)$/.test(part) || Number(part) > 65_535)
  ) {
    throw new Error(
      `Version ${JSON.stringify(version)} must contain three dot-separated integers from 0 to 65535.`,
    );
  }
}

const [packageJson, packageLock, manifest] = await Promise.all([
  readJson(paths.package),
  readJson(paths.packageLock),
  readJson(paths.manifest),
]);

const requestedVersion = process.argv[2];
if (requestedVersion === '--check') {
  const versions = {
    manifest: manifest.version,
    package: packageJson.version,
    packageLock: packageLock.version,
    packageLockRoot: packageLock.packages?.['']?.version,
  };
  const uniqueVersions = new Set(Object.values(versions));
  if (uniqueVersions.size !== 1) {
    throw new Error(`Version mismatch: ${JSON.stringify(versions)}`);
  }
  assertChromeVersion(packageJson.version);
  console.log(`Version ${packageJson.version} is synchronized.`);
} else {
  if (!requestedVersion) {
    throw new Error('Usage: npm run version:set -- X.Y.Z');
  }
  assertChromeVersion(requestedVersion);

  packageJson.version = requestedVersion;
  packageLock.version = requestedVersion;
  packageLock.packages[''].version = requestedVersion;
  manifest.version = requestedVersion;

  await Promise.all([
    writeFile(paths.package, `${JSON.stringify(packageJson, null, 2)}\n`),
    writeFile(paths.packageLock, `${JSON.stringify(packageLock, null, 2)}\n`),
    writeFile(paths.manifest, `${JSON.stringify(manifest, null, 2)}\n`),
  ]);
  console.log(
    `Synchronized project and manifest version to ${requestedVersion}.`,
  );
}
