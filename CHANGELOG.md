# Changelog

## 2.0.0 — Full v2 source implementation

- Superseded the v1.x direct-HTTPS-video-only product restriction.
- Rebuilt Android shell for edge-to-edge/safe-area handling.
- Added complete app branding assets/configuration.
- Added local file/media import and incoming share ingestion.
- Added HLS/DASH/progressive/audio source capability model.
- Added link analyser and public-page candidate discovery.
- Rebuilt transfer manager with persistence, dynamic concurrency, speed/ETA, retry/backoff and policy enforcement.
- Added unified persistent library, search/sort/filter and batch actions.
- Expanded player with fullscreen/orientation, resume, speed, fit/fill, keep-awake and track capability display.
- Added persistent settings and redacted diagnostics export.
- Expanded local tests to 19 logic tests and 82 static checks.

Native build/device acceptance remains mandatory before production GO.

## 2.0.0 REM002 GitHub packaging

- React Navigation bottom tabs, accessibility, Library select/batch, settings persistence, transfer policy, player keep-awake/tracks, clipboard/share routing.
- 19-test logic suite and 51-check UI/UX static acceptance gate.
- GitHub Actions AArch64 APK workflow.

## 2.0.0 GitHub readiness polish

- Added `"type": "module"` to package.json and simplified test runner.
- Included authentic resolved package-lock.json.
- Synchronised REQUIRED_DEPENDENCIES.json with live pins.
- Documentation and handover status updated for lockfile presence.
