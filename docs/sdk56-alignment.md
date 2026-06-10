# LNB × Expo SDK 56 Alignment

> "don't use tooling just because it's there, we use it because it's there AND it applies soundly to our use case(s)."

Audited 2026-06-09. Every decision below names the LNB use case or the reason it doesn't apply.

---

## Decision table

| # | Item | Decision | Reason / LNB use case |
|---|------|----------|-----------------------|
| 1 | `AbortSignal.timeout` / `AbortSignal.any` via `expo/fetch` | **Adopt now** | `src/core/overpass.ts` had no per-request timeout; a hung Overpass server would block indefinitely. `AbortSignal.timeout(35_000)` added — matches the Overpass `[timeout:30]` server hint plus slack. Behavior covered by existing tests; no new tests added. |
| 2 | `CLAUDE.md` + `AGENTS.md` agent scaffolding | **Adopt now** | LNB runs a multi-agent workflow (Codex bulk engineering, fable orchestration, human+Claude creative). Without a repo-level context file every agent session re-discovers the canon docs, laws, and commands. Lean files authored — pointers, not prose. |
| 3 | expo-doctor: `newArchEnabled` + `jsEngine` removed from top-level schema | **Adopt now** | SDK 56 schema no longer allows these at the top level (both are now defaults: New Arch on, Hermes on). Removed from `app.json`; behavior unchanged. |
| 4 | expo-doctor: forward-pinned package versions | **Adopt now** (exclude list) | `react-native-gesture-handler@3`, `react-native-safe-area-context@5.8`, `react-native-worklets@0.9.1`, `react-native-svg@15.15.5` are intentionally ahead of expo's expected pins. Added to `expo.install.exclude` alongside the existing `react-native-reanimated` exclusion so expo-doctor passes cleanly. |
| 5 | `expo-status-bar` / `expo-navigation-bar` consistent APIs | **Defer → Phase 1** | `<StatusBar style="auto"/>` is already correct and passing. `expo-navigation-bar` (Android edge-to-edge nav bar chrome) is sound for the Android M3 Expressive law, but Phase 1 UI doesn't exist yet — no surface to apply it to. Flag for Phase 1 Right Now screen work. |
| 6 | `@expo/ui` — custom SwiftUI/Compose views + modifiers | **Defer → Phase 1** | No native UI surfaces exist yet. When Phase 1 ships the Right Now list and spot detail sheet, reach for `@expo/ui` community bottom-sheet as the drop-in for the detail sheet instead of a community dep. |
| 7 | `@expo/ui` — `useMaterialColors` (M3 dynamic colors) | **Reject** | Brand law is explicit: dynamic color OFF in v1. The night is the brand. Revisit as a Phase 2 accent option if the brand law softens. |
| 8 | `@expo/ui` — Material Symbols (`@expo/material-symbols`) | **Defer → Phase 1** | We use lucide-react-native; both icon sets work. No icon swap is warranted until Phase 1 design settles which set wins on the target platforms. |
| 9 | `@expo/ui` — `useNativeState` + `WorkletCallback` (native-state text inputs) | **Defer → Phase 2** | No text inputs exist in Phase 0. Flag for the "open at TIME x" filter feature in Phase 2. |
| 10 | `@expo/ui` — datetime-picker community drop-in | **Defer → Phase 2** | Same as above — Phase 2 time-filter feature. |
| 11 | `expo-widgets` (iOS lock-screen / home-screen widget) | **Defer → Phase 2/3** | **Flagged opportunity:** "N spots open near you right now" is a high-value widget for exactly this product — on-foot, glanceable, lock-screen-first. Structurally only possible with OSM client-compute (no per-query bill). Pick up at Phase 2/3 when the data spine is exercised on device and EAS is wired. |
| 12 | EAS Convex integration (`eas integrations:convex:connect`) | **Defer → Phase 3** | Phase 3 is literally Convex + Clerk. No native build exists yet. |
| 13 | Android `usePrecompiledHeaders` (expo-build-properties) | **Defer → when native builds hurt** | No native Android build exists yet; benchmark pain isn't present. Add `expo-build-properties` and flip the flag when CI Android build times become a friction point. |
| 14 | `expo-router` decoupled from `@react-navigation/*` | **Verified — no action** | Zero `@react-navigation/*` imports or deps in the repo. expo-doctor's dedicated check passes. |
| 15 | `SuspenseFallback` export / `createStaticLoader` / `createServerLoader` | **Reject** | TanStack Query is the data layer; these loader helpers duplicate that responsibility. `SuspenseFallback` is a Phase 1 note at most — only relevant once the Right Now screen has a loading state worth designing. |
| 16 | Streaming SSR flag | **Reject** | Web output is `single` (SPA); streaming SSR doesn't apply to Metro SPA export. |
| 17 | Hermes v1 default, RN 0.85 new animation backend | **Verified — no action** | Already on Hermes + RN 0.85. New animation backend is the `react-native-reanimated@4` path we're already on. |
| 18 | HTTPS dev server (geolocation on LAN devices) | **Note for Phase 1** | Web geolocation requires a secure origin. When Phase 1 tests the map + geolocation flow on LAN devices, use `expo start --tunnel` or configure a local HTTPS cert. No code change needed now. |
| 19 | `import.meta` support | **Verified — no action** | No `import.meta` usage currently. Available if needed. |
| 20 | `@expo/vector-icons` → `@react-native-vector-icons/*` deprecation | **Verified — no action** | We use lucide-react-native, not `@expo/vector-icons`. Unaffected. |
| 21 | Legacy calendar / contacts / media-library APIs | **Verified — no action** | None installed or used. |
| 22 | Tool minimums (Xcode 26.4, iOS 16.4, TS 6.0.3) | **Verified — no action** | TS pinned at `~6.0.3` in devDependencies. Xcode/iOS enforced at build time, not in code. |
| 23 | On-demand filesystem / native Node watcher defaults | **Verified — no action** | Metro config defaults; no override in `metro.config.js`. |
| 24 | Hermes bytecode diffing | **Defer → when expo-updates is added** | expo-updates not installed. Bytecode diffing only matters for OTA update payloads. |
| 25 | `Stack.Toolbar` on Android (experimental, Stack v5) | **Defer → design pass / Phase 2** | We run `headerShown: false`; iOS chrome comes from expo-glass-effect, but the Android M3 Expressive dialect has no native chrome primitive picked yet. Stack.Toolbar (header/bottom toolbar) is the likely sanctioned answer for Phase 2 filter chrome — adopt when the design pass settles Android chrome, not before (API is experimental). |
| 26 | Native Tabs `disabled` prop | **Moot until tabs exist** | No tab bar is deliberate (Phase 1 = one surface). Native tabs are already the canon path when Phase 2 adds surfaces; `disabled` comes free then. |

---

## Counts

- **Adopted now:** 4 (AbortSignal.timeout, CLAUDE.md + AGENTS.md, app.json schema fix, expo.install.exclude list)
- **Deferred:** 8 (expo-navigation-bar → Phase 1; @expo/ui bottom-sheet → Phase 1; Material Symbols → Phase 1; useNativeState + datetime-picker → Phase 2; expo-widgets → Phase 2/3; EAS Convex → Phase 3; usePrecompiledHeaders → when native builds hurt; Hermes bytecode diffing → when expo-updates added)
- **Rejected:** 3 (useMaterialColors / dynamic color — brand law; createStaticLoader/createServerLoader — TanStack Query owns data; streaming SSR — SPA export)
- **Verified, no action:** 9 (react-navigation clean, expo-router, Hermes+RN0.85, HTTPS note, import.meta, @expo/vector-icons, legacy APIs, tool minimums, Metro defaults)

---

## expo-doctor findings (v1.19.9, 2026-06-09)

```
19/21 checks passed. 2 checks failed.

✖ Check Expo config schema
  should NOT have additional property 'newArchEnabled'.
  should NOT have additional property 'jsEngine'.
  → Fixed: both removed from app.json (both are SDK 56 defaults).

✖ Check that packages match versions required by installed Expo SDK
  react-native-gesture-handler  expected ~2.31.1  found 3.0.0  (major)
  react-native-safe-area-context expected ~5.7.0  found 5.8.0  (minor)
  react-native-worklets          expected 0.8.3   found 0.9.1  (minor)
  react-native-svg               expected 15.15.4 found 15.15.5 (patch)
  → Fixed: all four added to expo.install.exclude (intentional forward pins,
    consistent with existing react-native-reanimated exclusion).
```

Target state after fixes: expo-doctor 21/21 checks pass.

---

## Files changed

| file | change |
|------|--------|
| `src/core/overpass.ts` | `AbortSignal.timeout(35_000)` on each fetch call; `REQUEST_TIMEOUT_MS` constant |
| `app.json` | Removed `newArchEnabled: true` and `jsEngine: "hermes"` (SDK 56 defaults, no longer valid top-level schema fields) |
| `package.json` | Added four forward-pinned packages to `expo.install.exclude` |
| `CLAUDE.md` | New: repo agent context — commands, structure, canon doc pointers, laws |
| `AGENTS.md` | New: mirrors CLAUDE.md for agents reading that convention |
| `docs/sdk56-alignment.md` | New: this decision record |
