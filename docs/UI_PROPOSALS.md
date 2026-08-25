# UI proposals

## 1. Compact launcher plus discovery drawer — implemented

A 44-pixel circular launcher contains the independent Aurora mark: three rising prismatic bars and a discovery star on a dark spectral surface. It is centered eight pixels below Spotify's profile control, with a fixed top-right fallback. It expands into a right-side, non-modal complementary region on desktop and a bottom sheet on narrow windows.

Why selected:

- Enough room for progressive questions, evidence, usage, and accessible explanations
- Does not replace or imitate Spotify's search field
- Remains open while users compare candidate queries
- Predictable keyboard focus and screen-reader structure

The drawer has one compact view title (`h1`), sibling section headings (`h2`), musical route headings (`h3`), recommendation titles (`h4`), and native fieldset/legend groups for chip categories. Filters and results scroll above a sticky composer. Its plus button opens a focused non-modal settings popover; the microphone drafts a local transcript; the up arrow generates candidates. Settings expose native radio controls for the default **Aurora**, warm **Pulse**, and deep-blue **Nightwave** themes. The shared token system changes color only; structure, semantics, focus, reduced-motion behavior, and forced-colors behavior remain stable. Escape closes the nearest layer and restores focus. **Search in Spotify** remains a separate textual confirmation for every primary recommendation and secondary example, with a contextual accessible name.

## 2. Search popover — documented alternative

A popover directly beneath Spotify search would feel lightweight and contextual, but it has limited vertical room, is vulnerable to host layout changes, and creates harder collision/focus behavior at high zoom.

## 3. Chrome side panel — documented alternative

The browser side panel provides the strongest visual isolation and simplest Prompt API context. It is less integrated with the Spotify task, consumes browser chrome, and cannot visually anchor to the search field. It remains a useful fallback if future Chrome behavior prevents the extension-origin iframe design.

## States covered

- Collapsed, open, checking, model-required consent, downloading/stop-setup, text-ready, text/audio-ready, unavailable, guided fallback, clarification, grouped results, empty, error, and session released
- Microphone disclosure, recording, processing, and unavailable
- Selected/unselected chips, remove, clear, undo
- English/Spanish, Aurora/Pulse/Nightwave, reduced motion, forced colors, narrow window, and 400% zoom

Evidence is always written in text and never communicated through color alone.
