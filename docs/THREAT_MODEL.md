# Threat model

## Protected assets

- User-written discovery requests and local audio
- Future provider credentials (not present in the MVP)
- The integrity of Spotify page interactions
- User agency over navigation and search

## Threats and controls

| Threat                                                         | Control                                                                                                                                                                                             |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spotify page or another script forges an extension command     | Extension-origin iframe, exact `event.source`/origin checks, a random per-tab nonce, discriminated message validation, and a non-empty 200-character search-query limit                             |
| Model output injects markup or code                            | JSON response constraint, runtime allowlists, length limits, character sanitization, React text rendering, and no `innerHTML`                                                                       |
| Prompt injection from the Spotify page                         | No page text, catalog metadata, profile data, or DOM content is provided to any model                                                                                                               |
| Extension silently controls Spotify                            | Only an explicit candidate button emits a search; no playback/result/follow actions exist                                                                                                           |
| Fragile selectors corrupt the page                             | Allowlisted global-search markers, explicit avoidance of generic/library searchboxes, visible/enabled checks, deterministic route fallback, and fail-open positioning                               |
| Audio is transmitted remotely                                  | `getUserMedia` and Prompt API audio only; no Web Speech, cloud fallback, or network provider                                                                                                        |
| A late permission or recorder error leaves capture active      | Voice operation ids invalidate pending permission on minimize/context change/unmount; late streams and recorder errors enter one idempotent timer/track cleanup path                                |
| A stale task overwrites a newer draft or cleared state         | Abort signals plus text/audio request ids reject late results after input, filter, provider, locale, capability, or Clear-all changes, even if a provider ignores abort                             |
| A model-removal control silently affects other consumers       | Shared-model warning, separate guided flow, Chrome-owned final **Uninstall Models/Delete models** action, and complete-browser-restart instruction                                                  |
| Same-process Prompt API state is mistaken for deletion proof   | No removal-status refresh or iframe-reload claim; disk state remains Chrome-owned and the extension checks capability only after a complete browser restart                                         |
| Extension reload leaves an invalid content-script context      | Runtime URLs are cached during valid startup; delayed handlers avoid runtime API calls; page exit/host replacement disconnects observers, listeners, and animation frames; stale mounts fail closed |
| `unavailable` is mistaken for permission to download           | The unified state hides AI controls, exposes safe recovery actions, and never calls `LanguageModel.create()` until Chrome reports `downloadable` or `downloading`                                   |
| User input is retained                                         | No storage permission/API and explicit disposal of sessions, media tracks, and component state                                                                                                      |
| A developer key leaks from the bundle                          | No cloud key or provider endpoint exists; future integrations remain disabled metadata                                                                                                              |
| Misleading claims about frequency, instrumentation, or effects | User-requested concepts remain exploratory search terms; evidence labels, clarification, and copy prohibit presenting acoustic, health, therapeutic, spiritual, or wellness effects as verified     |
| Model proposes an incorrect entity or musical relationship     | Named entities and relationships are labelled exploratory, concise evidence is shown, no Spotify availability is claimed, and the user must explicitly choose every search                          |
| Remote code changes extension behavior                         | Strict extension CSP and bundled scripts only                                                                                                                                                       |
| Launcher positioning exposes profile data                      | Content script reads only the allowlisted profile button rectangle; it never reads labels, images, names, or account content                                                                        |
| Branding implies Spotify ownership or endorsement              | Independent Aurora rounded-square mark, non-Spotify palette, descriptive-only Spotify references, and an explicit non-affiliation notice                                                            |

## Residual risk

- Spotify can change its SPA markup or event behavior. The route fallback may still work, but live smoke testing is required.
- On-device model output is nondeterministic. Validation contains its structure, repetition, and limits, but cannot guarantee musical quality or factual catalog availability.
- Browser-managed model/language downloads and hardware eligibility are outside the extension's control.
- Chrome's privileged model uninstall is outside the extension API. If `chrome://on-device-internals` cannot be opened programmatically, the selectable address and manual steps remain visible.
- An extension with host access can technically see more of a page; this implementation intentionally does not read it. Source review and store disclosure remain important.
