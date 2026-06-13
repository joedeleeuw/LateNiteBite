# Local Simulator Smoke Testing

LateNiteBite smoke coverage is app-specific. The default gate proves the core launch contract: if location is denied or blocked, the app stays in the location-required state and does not silently fall back to canned places.

## Coverage

- `pnpm smoke:android` runs `.maestro/android-location-required.yaml`.
- `pnpm smoke:ios` runs `.maestro/ios-location-required.yaml` on macOS.
- `pnpm smoke:android:live` and `pnpm smoke:ios:live` mock the FSU launch coordinates, wait for a live Right Now row, tap into detail, and assert the Navigate action is present.

The live flows hit Overpass and current OSM opening-hours data. Keep them as an explicit local smoke, not the default deterministic gate.

## Linux Android

Check the local toolchain:

```bash
pnpm smoke:android:doctor
```

Build and install the app on the emulator first. This app requires Sentry configuration at bundle time:

```bash
EXPO_PUBLIC_SENTRY_DSN=https://public@example.invalid/1 pnpm android
```

Keep Metro running if you installed a debug build, then run the deterministic smoke:

```bash
pnpm smoke:android
```

Run the live list/detail smoke when network and Overpass are available:

```bash
pnpm smoke:android:live
```

Useful environment overrides:

```bash
LNB_KEEP_EMULATOR=1 pnpm smoke:android
LNB_ANDROID_AVD=my_avd_name pnpm smoke:android
LNB_ANDROID_METRO_PORT=8081 pnpm smoke:android
APP_ID=com.joedeleeuw.latenitebite pnpm smoke:android
```

## macOS iOS Simulator

Run these on the MacBook Pro, not Linux:

```bash
pnpm smoke:ios:doctor
EXPO_PUBLIC_SENTRY_DSN=https://public@example.invalid/1 pnpm ios
pnpm smoke:ios
```

To pick a simulator:

```bash
LNB_IOS_SIMULATOR_NAME="iPhone 15 Pro" pnpm smoke:ios
LNB_IOS_SIMULATOR_UDID=<simulator-udid> pnpm smoke:ios
```

Run the live list/detail smoke only when Overpass/network data should be part of the local gate:

```bash
pnpm smoke:ios:live
```

## Flow Notes

Android permission denial uses the platform permission controller deny button id, then asserts:

- `lnb_location_required`
- `lnb_no_fallback_copy`
- no `lnb_spot_list`
- no `lnb_spot_row`

iOS uses Maestro's launch permission state with `location: never`. iOS simulator permission dialogs are not manually tapped by Maestro, so the flow starts from the blocked state directly.
