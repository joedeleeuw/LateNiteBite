# Late Nite Bite — Product Definition

est. 2015 · revived 2026 · built to win App Store of the Year (the team has done it before — Jukely)

## The question

It's 1:30am. You're on foot, hungry, heading home or just getting started. Every existing answer fails:

- **Large review platforms** are built for daytime decisions — and their data is least reliable exactly at the late-night margin. Worse, they bluff when they don't know.
- **Delivery apps** own late-night attention, tax it ~30%, and bury the walk-up spot 200 feet away.
- **TikTok / IG** are discovery for *someday*, not *right now*.

Nobody serves the on-foot, open-NOW moment. That was true in Tallahassee in 2015. It is truer in 2026.

## The answer (core loop)

Open app → ranked **Right Now** list (open first, then by distance) → tap → **Navigate**.

No search box first. No account. No ads. The app opens *to the answer*.

## What makes it a gamechanger

1. **The three-second answer.** Open-now is computed on-device from owned data (OSM + `opening_hours`). No ratings-platform round-trip, no spinner theater. Launch-to-answer under 10 seconds including location fix.
2. **Honest by design.** `open` / `closed` / `unknown` — unknown is a first-class state, never a bluff. A wrong "open" at 1am is unforgivable; honesty is the killer feature at the margin.
3. **Late-night-first interface.** Night palette, one-handed, glanceable. "closes in 38m" is the headline stat — not star ratings.
4. **Owned data → live layer.** OSM data is ours to cache, rank, and build on; Google's ToS forbids exactly that. Phase 3's live layer — "actually open, line's short, grill's still on," from people there now — is structurally impossible for competitors on licensed data. Fixes flow back to OSM.
5. **$0 core, forever.** No ads, no per-query bill, no venture math. OSM + client compute. The 2015 site cost nothing to run; the 2026 app honors that.

## Performance law

Speed is the personality (see `brand.md`). Expo SDK 56, New Architecture, Hermes.

- **60fps floor everywhere; 120 on ProMotion.** All motion on the UI thread (Reanimated worklets) — zero JS-thread animation on hot paths.
- Recycled lists (`@legendapp/list`); open-now evaluation memoized off the render path, re-ticked per minute.
- Cold open ≤5s, always skippable; reduced-motion gets an instant cross-fade.
- **Verified, not vibed: agent-device perf runs on real hardware** (frame timing, logs, low-end Android included). A perf regression blocks release.

## Launch

**Tallahassee (FSU)** — the origin, the homage. **NYC** — home turf. Works anywhere via geolocation; these two get tuned flavor (campus landmarks, neighborhood vocabulary, offline extracts).

Validated 2026-06-09 (`_spike/`): FSU bbox 195 food spots, 7 open Sat 1:30am; NYC/Washington Sq 2,180 spots, 229 open 1:30am. The 1:30am column is the product.

## North star

**Time-to-first-bite-decision.** Secondary: weekend 1–3am return rate. If the app is the reflex at 1:30am, everything else follows.

## Anti-goals

- Not a delivery marketplace. Not a reviews platform.
- No account required for the core loop. Ever.
- No ads. No engagement bait. No AI-gimmick layer.
- No retro 2015 skin — homage, not nostalgia (`brand.md`).

## Phases

0. **Data spine** — done (`src/core`: composed Zod schemas, Overpass fetcher, open-now engine, ranking)
1. **Right Now** — list, detail, one-tap Navigate
2. **Smart filters, map, city flavor, PWA**
3. **Live / social layer** — Convex + Clerk (not Supabase)

## Quality bar

App Store of the Year — again. Jukely proved this team can. LNB is built to that standard from the first commit: award-grade craft on every shipped surface, hand-made everything, performance as a feature.
