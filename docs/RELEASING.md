# GitHub release guide

Music Discovery Overlay is distributed as a manually installed unpacked extension. Source, automation, and release instructions belong in Git; generated `dist/`, ZIP, and checksum files do not.

## Release contents

`npm run package`:

1. runs the complete verification suite;
2. checks that `package.json`, `package-lock.json`, and `public/manifest.json` use the same version;
3. builds `dist/`;
4. validates Manifest V3, icons, version, root manifest placement, and absence of source maps;
5. creates a deterministic uncompressed ZIP in `artifacts/`;
6. creates its SHA-256 checksum.

The ZIP contains the contents of `dist/`, not a wrapping `dist/` directory. After extraction, `manifest.json` is therefore at the selected unpacked directory's root.

## Prepare a version

Choose a three-component numeric version supported by the Chrome manifest, then synchronize all version files:

```bash
npm run version:set -- 0.1.1
npm run version:check
npm run package
```

Review the source changes and test the resulting unpacked directory in real Chrome. Do not replace an existing release asset with different bytes under the same version.

## Publish from GitHub

After the version change is reviewed and committed, create and push a matching tag:

```bash
git tag v0.1.1
git push origin main
git push origin v0.1.1
```

The `GitHub Release` workflow verifies that the tag equals `v` plus the package version, rebuilds from source, reruns all validation, and attaches the ZIP and checksum to a generated GitHub Release. It uses GitHub's repository-scoped `GITHUB_TOKEN`; no personal access token or additional secret is required.

The workflow deliberately does not commit generated artifacts, publish an npm package, or submit the extension to an external distribution service.

## Correct a release

Do not silently overwrite a published artifact. Fix the source, increment the version, validate again, and publish a new tag. Users of an unpacked release must download, verify, extract, reload the extension, and refresh existing Spotify tabs manually.
