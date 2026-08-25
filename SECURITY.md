# Security policy

## Supported code

This project is an early developer preview. Security fixes target the latest code on `main` and the latest published GitHub Release when one exists. Older unpacked builds may not receive fixes; users should replace them manually with the newest trusted build.

## Reporting a vulnerability

Use **Report a vulnerability** under the repository's **Security** tab so the report and any proof of concept remain private. The repository owner must enable GitHub Private Vulnerability Reporting after creating the public repository.

If private reporting is temporarily unavailable, do not post credentials, personal data, exploit details, or a working proof of concept in a public issue. Contact the maintainer through the private contact method listed on the repository owner's GitHub profile and mention `music-discovery-overlay security`.

Include, when possible:

- affected version or commit;
- Chrome and operating-system versions;
- reproduction steps and expected impact;
- whether microphone, Prompt API, frame messaging, Spotify DOM access, or extension permissions are involved;
- a minimal proof of concept without personal data.

You should receive an acknowledgement within seven days. Timelines for validation and remediation depend on severity and reproducibility. Please allow a reasonable remediation period before public disclosure.

## Scope

Security-relevant areas include extension permissions, content/frame message validation, DOM access, local Prompt API sessions, microphone lifecycle, generated query handling, build/release integrity, and unexpected network or persistence behavior.

General bugs and feature requests belong in GitHub Issues. Questions about Chrome's own Prompt API implementation, model files, or Spotify itself should be reported to the respective vendor unless this extension introduces the issue.
