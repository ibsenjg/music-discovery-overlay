import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDirectory = resolve(root, 'dist');
const artifactsDirectory = resolve(root, 'artifacts');
const fixedDosDate = (20 << 9) | (1 << 5) | 1;
const utf8Flag = 0x0800;

function createCrc32Table() {
  return Array.from({ length: 256 }, (_, index) => {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
    }
    return value >>> 0;
  });
}

const crc32Table = createCrc32Table();

function crc32(data) {
  let checksum = 0xffffffff;
  for (const byte of data) {
    checksum = (checksum >>> 8) ^ crc32Table[(checksum ^ byte) & 0xff];
  }
  return (checksum ^ 0xffffffff) >>> 0;
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(path)));
    if (entry.isFile()) files.push(path);
    if (!entry.isDirectory() && !entry.isFile()) {
      throw new Error(`Unsupported release entry: ${path}`);
    }
  }
  return files.sort((left, right) => left.localeCompare(right, 'en'));
}

function localHeader(name, data, checksum) {
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(utf8Flag, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(fixedDosDate, 12);
  header.writeUInt32LE(checksum, 14);
  header.writeUInt32LE(data.length, 18);
  header.writeUInt32LE(data.length, 22);
  header.writeUInt16LE(name.length, 26);
  return header;
}

function centralHeader(name, data, checksum, offset) {
  const header = Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(utf8Flag, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(0, 12);
  header.writeUInt16LE(fixedDosDate, 14);
  header.writeUInt32LE(checksum, 16);
  header.writeUInt32LE(data.length, 20);
  header.writeUInt32LE(data.length, 24);
  header.writeUInt16LE(name.length, 28);
  header.writeUInt32LE(offset, 42);
  return header;
}

function endOfCentralDirectory(entryCount, centralSize, centralOffset) {
  const record = Buffer.alloc(22);
  record.writeUInt32LE(0x06054b50, 0);
  record.writeUInt16LE(entryCount, 8);
  record.writeUInt16LE(entryCount, 10);
  record.writeUInt32LE(centralSize, 12);
  record.writeUInt32LE(centralOffset, 16);
  return record;
}

async function buildDeterministicZip(files) {
  if (files.length > 65_535)
    throw new Error('Too many files for a ZIP32 archive.');
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const path of files) {
    const archivePath = relative(distDirectory, path).split(sep).join('/');
    const name = Buffer.from(archivePath, 'utf8');
    const data = await readFile(path);
    if (data.length > 0xffffffff)
      throw new Error(`${archivePath} is too large.`);
    const checksum = crc32(data);
    const header = localHeader(name, data, checksum);
    localParts.push(header, name, data);
    centralParts.push(centralHeader(name, data, checksum, offset), name);
    offset += header.length + name.length + data.length;
  }

  const central = Buffer.concat(centralParts);
  return Buffer.concat([
    ...localParts,
    central,
    endOfCentralDirectory(files.length, central.length, offset),
  ]);
}

const [packageJson, sourceManifest, builtManifest] = await Promise.all([
  readFile(resolve(root, 'package.json'), 'utf8').then(JSON.parse),
  readFile(resolve(root, 'public/manifest.json'), 'utf8').then(JSON.parse),
  readFile(resolve(distDirectory, 'manifest.json'), 'utf8').then(JSON.parse),
]);

if (
  packageJson.version !== sourceManifest.version ||
  packageJson.version !== builtManifest.version
) {
  throw new Error(
    'Package, source manifest, and built manifest versions differ.',
  );
}
if (builtManifest.manifest_version !== 3) {
  throw new Error('The built package must contain a Manifest V3 manifest.');
}

const files = await listFiles(distDirectory);
const archivePaths = files.map((path) =>
  relative(distDirectory, path).split(sep).join('/'),
);
if (!archivePaths.includes('manifest.json')) {
  throw new Error('manifest.json must be present at the ZIP root.');
}
if (archivePaths.some((path) => path.endsWith('.map'))) {
  throw new Error('Source maps must not be included in the release package.');
}
for (const iconPath of Object.values(builtManifest.icons ?? {})) {
  if (!archivePaths.includes(iconPath)) {
    throw new Error(`Manifest icon ${iconPath} is missing from dist/.`);
  }
}

const zip = await buildDeterministicZip(files);
const baseName = `music-discovery-overlay-v${packageJson.version}.zip`;
const archivePath = resolve(artifactsDirectory, baseName);
const checksumPath = `${archivePath}.sha256`;
const checksum = createHash('sha256').update(zip).digest('hex');

await mkdir(artifactsDirectory, { recursive: true });
await Promise.all([
  writeFile(archivePath, zip),
  writeFile(checksumPath, `${checksum}  ${baseName}\n`),
]);

console.log(`Created artifacts/${baseName}`);
console.log(`SHA-256 ${checksum}`);
