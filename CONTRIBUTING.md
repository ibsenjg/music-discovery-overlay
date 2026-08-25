# Contributing

Thanks for helping improve Music Discovery Overlay. The project welcomes focused bug fixes, accessibility improvements, documentation, tests, and music-discovery refinements that preserve its local-first boundaries.

## Before opening a change

- Search existing issues before creating a new one.
- Open an issue before a large UI, architecture, permission, privacy, or product-scope change.
- Keep cloud providers, API keys, telemetry, persistence, remote code, new host permissions, and Spotify account access out of scope unless the maintainers first approve a public design proposal.
- Do not include account data, avatars, listening history, credentials, or screenshots from a personal Spotify session.

## Local setup

Requirements:

- Node.js 24 or newer
- npm 11 or newer
- Chrome 149 or newer

```bash
npm ci
npm run verify
```

Run the sanitized visual fixture with:

```bash
npm run dev:mock
```

Then open `http://127.0.0.1:4173/mock/`.

Playwright can run headlessly or in its interactive UI:

```bash
npm run test:e2e
npm run test:e2e:ui
```

## Development expectations

- Follow the existing React and TypeScript conventions.
- Preserve keyboard access, focus management, reduced-motion support, forced-colors support, and readable zoom/reflow.
- Keep microphone and Prompt API processing local and release browser resources promptly.
- Treat AI recommendations and acoustic, wellness, therapeutic, or spiritual terms as exploratory rather than verified claims.
- Keep Spotify submission explicit and separate from suggestion generation.
- Add regression coverage for behavior changes.
- Update the README, privacy notice, threat model, test matrix, or smoke test when their claims change.

## Validation

Use focused tests while developing, then run:

```bash
npm run verify
```

Real Chrome behavior that cannot be established reliably in automation should also follow [the manual smoke test](docs/SMOKE_TEST.md).

## Pull requests

Keep pull requests focused and explain:

- what changed and why;
- privacy, security, and accessibility impact;
- automated tests run;
- manual Chrome/Spotify checks still required;
- screenshots for visible UI changes, using only the sanitized fixture.

By contributing, you agree that your contribution is licensed under the repository's [MIT License](LICENSE).
