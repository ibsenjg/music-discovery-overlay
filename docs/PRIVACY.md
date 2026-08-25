# Privacy notice

Music Discovery Overlay processes only information that you explicitly enter or select in its interface.

## Data processed

- Typed music-discovery requests
- Selected filter chips
- Selected visual theme
- Microphone audio after you choose **Allow and start** in the first-use disclosure
- Generated discovery intent and candidate search phrases

## Where processing happens

The default Prompt API text/audio paths run on the device. The rules provider is bundled deterministic code. Web Speech and cloud speech are not used. The extension does not send prompts, audio, candidates, or usage telemetry to the developer or any third party.

Chrome may download its built-in model and local language resources from the browser vendor. That download is managed by Chrome and is distinct from inference; the extension does not receive account or download identifiers.

## Retention

Nothing is persisted. All extension state—including the selected Aurora, Pulse, or Nightwave theme—is held in the current tab's memory and disappears on reload or tab close. The extension does not use browser storage, cookies, logs, analytics, or a server.

## Spotify data

The extension does not request or read Spotify profile information, account identity, cookies, listening history, playlists, library, current track, playback state, or catalog responses. Its content bridge reads only the rectangle of the allowlisted profile button to position the launcher. On explicit confirmation it locates the visible search input and writes the selected query.

## Microphone control

The microphone is requested only when **Allow and start** is activated in the visible first-use disclosure. A pending permission request is invalidated by minimize, Clear all, provider/language change, capability loss, or reload; if permission resolves afterward, every returned track is stopped before recording can begin. Recordings stop after 30 seconds at most, and every track is stopped after completion, recorder error, cancellation, drawer close, or reload. Local audio produces an editable transcript draft only; it cannot generate candidates or search Spotify without later user actions. If local processing is unavailable, the extension does not fall back to cloud speech.

Draft, filter, provider, language, and Clear-all changes invalidate older local generation or transcription results. A late completion cannot restore cleared text or suggestions. Minimizing may leave suggestion generation running locally so it is ready when reopened, but never leaves microphone capture running.

**Release active AI session** aborts work, destroys the current tab's text/audio sessions, and resets context usage.

**Remove downloaded local AI…** aborts active local work and performs session cleanup before it opens Chrome's internal on-device model manager. The extension cannot enumerate, erase, or verify Chrome's model files itself. The user must activate Chrome's own **Uninstall Models** or **Delete models** control in **Broker State** because that shared model may also be used by other sites or extensions in the same browser profile. The extension stores no marker for this action. After removal, the user quits Chrome completely and reopens it; the fresh extension instance performs the normal Prompt API capability check without claiming to inspect disk state.

## Future cloud providers

OpenAI and Anthropic integrations are not active in this MVP. Any future provider must receive separate informed consent and disclose transmission, retention, authentication, and usage semantics before it can be enabled.
