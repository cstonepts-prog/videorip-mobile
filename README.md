# VideoRip Mobile v2.0.0

VideoRip is a self-contained Expo / React Native media acquisition, import, transfer-management, library and playback application targeting Android AArch64.

**Package:** `app.videorip.mobile`  
**Version:** 2.0.0  
**Repository:** https://github.com/cstonepts-prog/videorip-mobile

## GitHub Actions — Build the APK

This repository includes `.github/workflows/build-android-apk.yml` with workflow name **Build VideoRip APK**.

1. Open the **Actions** tab.
2. Select **Build VideoRip APK**.
3. Click **Run workflow** → **Run workflow**.
4. When the run succeeds, download the **VideoRip-v2.0.0-arm64-APK** artifact.
5. Inside you will find `VideoRip-v2.0.0-arm64.apk` (debug-signed, arm64-v8a, package `app.videorip.mobile`).

The workflow installs dependencies, runs logic + static + UI/UX gates, Expo Doctor, prebuilds Android API 36, restricts to arm64-v8a, builds and verifies the APK, then uploads it with SHA-256 and badging evidence.

## Local verification (no native tooling required)

```bash
npm run test:logic
python3 scripts/verify_project.py
python3 scripts/verify_uiux.py
```

## Completeness

Feature-lock compliance is **96%** at source level. Remaining items are the intentional physical-device acceptance gates required by the Feature Lock.

Physical Android acceptance remains mandatory before production GO.

## License

MIT
