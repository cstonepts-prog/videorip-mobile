#!/usr/bin/env python3
from pathlib import Path
import json, sys
ROOT=Path(__file__).resolve().parent.parent

def fail(msg):
    print(f"FAIL: {msg}")
    return False

def ok(msg):
    print(f"PASS: {msg}")
    return True

def main():
    checks = 0
    passed = 0
    # Basic structure
    for rel in ["App.js", "package.json", "app.json", "src", "src/screens", "src/services", "src/utils", "src/context", "src/components", "tests", "scripts", "assets", ".github/workflows/build-android-apk.yml"]:
        checks += 1
        if (ROOT / rel).exists():
            passed += 1
            ok(f"exists {rel}")
        else:
            fail(f"missing {rel}")
    # package.json essentials
    pkg = json.loads((ROOT / "package.json").read_text())
    checks += 1
    if pkg.get("version") == "2.0.0":
        passed += 1
        ok("package.json version 2.0.0")
    else:
        fail(f"package.json version {pkg.get('version')}")
    checks += 1
    if pkg.get("type") == "module":
        passed += 1
        ok('package.json has "type": "module"')
    else:
        fail('package.json missing "type": "module"')
    # app.json package identity
    app = json.loads((ROOT / "app.json").read_text())
    expo = app.get("expo", {})
    checks += 1
    if expo.get("android", {}).get("package") == "app.videorip.mobile":
        passed += 1
        ok("app.json android package app.videorip.mobile")
    else:
        fail("app.json android package mismatch")
    checks += 1
    if expo.get("version") == "2.0.0":
        passed += 1
        ok("app.json version 2.0.0")
    else:
        fail("app.json version mismatch")
    # Key source modules exist
    for rel in [
        "src/screens/HomeScreen.js", "src/screens/DownloadsScreen.js", "src/screens/LibraryScreen.js",
        "src/screens/LinksScreen.js", "src/screens/SettingsScreen.js", "src/screens/PlayerScreen.js",
        "src/screens/DetailsScreen.js", "src/services/downloadService.js", "src/services/importService.js",
        "src/services/libraryService.js", "src/services/linkAnalysisService.js", "src/utils/mediaUtils.js",
        "src/utils/downloadUtils.js", "src/utils/transferPolicy.js", "src/context/DownloadContext.js",
        "src/context/SettingsContext.js"
    ]:
        checks += 1
        if (ROOT / rel).exists():
            passed += 1
            ok(f"exists {rel}")
        else:
            fail(f"missing {rel}")
    print(f"\nSTATIC VERIFICATION: {'PASS' if passed == checks else 'FAIL'}")
    print(f"Checks: {checks}")
    if passed != checks:
        print(f"Passed: {passed}  Failed: {checks - passed}")
        raise SystemExit(1)

if __name__ == "__main__":
    main()
