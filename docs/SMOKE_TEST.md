# Manual smoke test

Run this after any Spotify Web UI, Chrome Prompt API, content bridge, or microphone change.

## Setup

1. Run `npm install` and `npm run verify`.
2. Run `npm run build` and load `dist/` as an unpacked extension. After every later extension reload, refresh any already-open Spotify tab and confirm `chrome://extensions` does not accumulate an **Extension context invalidated** error from the content bridge.
3. Open a fresh Chrome 149+ profile and visit `https://open.spotify.com/search`.
4. Open DevTools Network and preserve the log.

## Core flow

1. Confirm exactly one dark, 44×44 Aurora launcher with three prismatic bars is centered eight pixels below the profile avatar. Verify it follows resize/SPA changes and uses a top-right fallback if the anchor disappears.
2. Open it and verify focus moves to “Describe the music you want to find.”
3. Open **+ settings** and use the native radio controls to switch from **Aurora** to **Pulse**, then **Nightwave**, and back to **Aurora**. Confirm each palette updates immediately without closing settings, while labels, focus outlines, structure, and controls remain readable.
4. Choose **Guided discovery**, close settings, and enter `genre:classical 432 Hz with piano, trumpet or violin`.
5. Confirm the tuning-versus-tone clarification appears before candidates.
6. Choose the tuning option. Verify two or three grouped routes, textual explanations and evidence, and the exploratory warning.
7. Expand **Your Library** so its separate search filter is visible, then choose **Search in Spotify**. Verify the query reaches the global top search, the library filter stays empty, and no result is opened or played automatically.
8. Navigate between Spotify routes. Verify the overlay is not duplicated.

## On-device AI

1. Reload the tab to clear all prior state.
2. Open **+ settings** and select **On-device AI**. During checking, confirm no AI controls are visible.
3. If `downloadable` or `downloading`, confirm the microphone and up arrow are hidden and a **Local AI model required** step explains which features need the model. Confirm **Use Guided discovery** remains available and no extension session starts before **Download local AI** or **Continue and show progress** is activated. After activation, verify the named progress bar fills the panel's available width. While setup is active, switch browser focus, return to the tab, minimize/reopen the drawer, and open settings; confirm progress continues and **Stop setup** remains available. Verify **Stop setup** aborts extension preparation without claiming to cancel Chrome's shared download, and AI controls appear only after readiness.
4. If text is ready but audio is not, confirm the up arrow is shown, the microphone is hidden, and the GPU/audio explanation is visible in settings.
5. If text and audio are ready, confirm both controls are shown. Verify session context is labelled as context—not account quota.
6. Activate **Release active AI session**. Confirm active work is aborted and context resets without changing the installed-model state.
7. Activate **Remove downloaded local AI…**. Confirm its trigger disappears while the warning is open, the shared impact is explained, and **Close** or Escape closes the flow, restores the trigger, and returns focus to it.
8. Reopen the flow and confirm it offers no **Refresh local AI status** or **Reload overlay** action. Choose **Open Chrome AI model manager**. In `chrome://on-device-internals`, open **Broker State**, choose **Uninstall Models** or **Delete models**, and wait until **Models** reports 0 B/0 KB. If automatic navigation is blocked, manually enter the selectable address shown in the flow.
9. Quit Chrome completely using its Quit command—not only the current window—and reopen it. Return to Spotify and confirm the newly loaded extension checks capability automatically. If Chrome reports `downloadable` or `downloading`, confirm the local-model requirement step replaces the microphone/up-arrow controls without claiming that the extension started Chrome's shared download. If it reports `unavailable`, confirm one recovery card offers **Check again**, **Open Chrome AI status**, and **Use Guided discovery** without pretending a download can start.
10. Confirm another explicit **Download local AI** action is required before Chrome downloads it again. Do not redownload unless this smoke test requires it.
11. If the device is unsupported, use **Guided discovery** and verify typed/chip discovery remains operable without a model requirement.
12. With an already-open overlay, remove the model in Chrome and attempt one generated request. If the stale session fails, confirm the draft remains, the app rechecks capability, and the UI offers a local-AI retry or explicit **Use Guided discovery** action. Confirm it does not silently create a guided result.
13. In three independent local-AI sessions, submit `Quiero que encuentren artistas que utilicen piano, bajo y alguna melodía en sus canciones.` Accept the quality check only if at least two sessions produce at least two distinct routes, four different primary artists, concise fit explanations, and no `piano`/`bass` keyword permutations.
14. Start a suggestion, then edit the draft, toggle a filter, change language/provider, and repeat with **Clear all** while the loader is active. Confirm no older clarification or suggestion reappears. Press Enter repeatedly during the loader and confirm only one generation runs and no unshifted newline is inserted.

## Voice and privacy

1. With text/audio ready, activate the microphone. Confirm the disclosure appears and Chrome has not prompted yet.
2. Activate **Allow and start**. Confirm Chrome asks for microphone permission only now.
3. Speak a short English or Spanish request and stop recording. Confirm the transcript appears only as an editable composer draft and no candidates are generated yet.
4. Review/edit the draft and use the up arrow. Confirm Spotify is still untouched until a candidate's **Search in Spotify** button is activated.
5. Repeat once and verify the disclosure is not repeated in the same tab. Confirm recording stops automatically at 30 seconds.
6. Exercise permission denied, no device, and busy-device states where possible; confirm their bilingual messages differ and typed/chip input remains available.
7. Start **Allow and start**, then minimize while Chrome's permission request is still pending. If permission is granted afterward, confirm recording never starts and the browser recording indicator is clear. Repeat while actively recording and confirm it clears immediately.
8. While local transcription is running, choose **Clear all** and confirm the late transcript does not repopulate the composer. Where practical, exercise a device/recorder error and confirm the recording indicator clears and no transcript is generated.
9. Keep an existing draft, record silence or unusable audio, and confirm the no-speech notice appears without clearing the draft or forcing a provider recovery.
10. Verify no prompt/audio/catalog request is sent to a developer, AI provider, Spotify API, analytics, or telemetry domain.
11. Reload the tab and confirm input, filters, candidates, usage, transcript, consent, progress, provider selection, and theme selection are gone; Aurora is active again.

## Accessibility

1. Complete the flow with keyboard only; check chip toggles, details, composer Enter/Shift+Enter, settings, search buttons, Escape, and focus return.
2. Verify the heading order is one `h1`, sibling `h2` sections, `h3` route titles, and `h4` recommendation titles.
3. Open the microphone disclosure and confirm it is announced as a modal, Tab and Shift+Tab remain inside it, and Escape closes it and returns focus to the microphone button.
4. Test with a screen reader and confirm loading, fallback, clarification, ready, and sent states are announced once without moving focus. Start generation, minimize before it completes, and confirm the finished status is still announced while the drawer is minimized.
5. Test reduced motion, forced-colors/high-contrast mode, a narrow viewport, and real browser zoom at 200% and 400%. Confirm the header and composer remain reachable, content does not disappear horizontally, and the route list still scrolls.

Record Chrome version, OS, Prompt API availability, pass/fail per section, and any current Spotify selector observed. Do not capture account identifiers, queries, DOM snapshots, or screenshots containing personal data.
