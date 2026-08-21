#!/usr/bin/env python3
import json
from pathlib import Path

EXPECTED = {
    "@react-navigation/native": "7.3.16",
    "@react-navigation/native-stack": "7.18.6",
    "@react-navigation/bottom-tabs": "7.18.16",
    "expo-image-picker": "57.0.7",
    "expo-notifications": "57.0.8",
    "expo-sharing": "57.0.8",
}

def main():
    pkg = json.loads(Path("package.json").read_text())
    deps = pkg.get("dependencies", {})
    failures=[]
    for name, version in EXPECTED.items():
        actual=deps.get(name)
        if actual != version:
            failures.append(f"{name}: expected {version}, found {actual}")
    if failures:
        print("DEPENDENCY PIN CHECK: FAIL")
        for f in failures: print(" -", f)
        raise SystemExit(1)
    lock = Path("package-lock.json")
    if lock.exists():
        data=json.loads(lock.read_text())
        root=data.get("packages",{}).get("",{})
        locked=root.get("dependencies",{})
        for name, version in EXPECTED.items():
            if locked.get(name) != version:
                failures.append(f"lock root {name}: expected {version}, found {locked.get(name)}")
        if failures:
            print("DEPENDENCY LOCK CHECK: FAIL")
            for f in failures: print(" -", f)
            raise SystemExit(1)
        print("DEPENDENCY PIN/LOCK CHECK: PASS")
    else:
        print("DEPENDENCY PIN CHECK: PASS (lockfile not present in source package; workflow resolves and validates it before npm ci)")

if __name__ == "__main__": main()
