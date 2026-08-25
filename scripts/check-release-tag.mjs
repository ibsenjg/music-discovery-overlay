import { readFile } from 'node:fs/promises';

const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);
const tag = process.argv[2];
const expectedTag = `v${packageJson.version}`;

if (!tag) throw new Error(`Usage: npm run release:check -- ${expectedTag}`);
if (tag !== expectedTag) {
  throw new Error(
    `Release tag ${JSON.stringify(tag)} does not match ${JSON.stringify(expectedTag)}.`,
  );
}

console.log(
  `Release tag ${tag} matches package version ${packageJson.version}.`,
);
