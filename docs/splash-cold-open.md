# Late Nite Bite — Splash Cold Open (motion brief)

A Bad Robot-style title card for food at 1am. The static splash hands off to this
cold open; the cold open hands off to the Right Now screen. Skippable, accessible,
hand-keyed — zero template, zero AI smell.

## Goal · Validation · End state

**Goal:** you feel the brand before you read a word — warm, nocturnal, a wink —
in ≤5 seconds, and a returning user never waits.

**Validation — measured (agent-device on real hardware, attached as evidence):**

- 0 dropped frames through the full sequence on a mid-tier Android and an older iPhone; 60fps floor, 120 on ProMotion.
- Tap-to-skip → app in ≤300ms; reduced-motion crossfade ≤250ms.
- The cold open masks app warm-up — adds ≤100ms to time-to-interactive vs a no-splash build.
- Vector-only asset budget ≤50KB.

**Validation — judged (craft review, named critiques only):**

- Anti-smell checklist (below) passes beat by beat.
- Contact-sheet review: timeline exported as stills and critiqued frame-by-frame, same as the mark.
- The smile test: shown cold, people react at the mouse beat and say "late-night food" unprompted.

**Comparators:** the title-card canon for feeling (Bad Robot, the Pixar lamp);
current best-in-class app intros screen-recorded and beaten on restraint, fps,
skip behavior, and wink density; the 2015 site for the homage check (would
2015-Joe grin); the App Store Award reel as the ceiling (Jukely bar).

**End state (done means):** `ColdOpen` shipped — static splash → cold open →
Right Now with no white flash; screw-in beat driven by the tail as crank; bulb
glow *becomes* the app background; skip + reduced-motion paths tested; perf
evidence attached; punch list resolved, sparks triaged. The mark then escapes
the splash: app icon seed, favicon, empty-state hero.

**How progress happens:** one beat at a time. Build the smallest judgeable beat →
render it observable fast → critique against checklist + comparators → fix only
named critiques, bank sparks → beat passes fps + checklist → next beat. The
sequence is assembled only from passed beats. Engineering (Codex) runs in
parallel so the splash always has a real app to hand off to.

## Brand Motion Identity

- **Signature curves**
  - `PUNCH` (the jab): `cubic-bezier(0.16, 1, 0.3, 1)` — snappy in, expo out, ~12% overshoot.
  - `BREATHE` (settle + ambient loops): `cubic-bezier(0.4, 0, 0.2, 1)`.
  - `EXIT`: `cubic-bezier(0.3, 0, 1, 1)` — accelerate away, always faster than the entrance.
- **Duration palette**: quick `140ms` (jab) · standard `420ms` (settle) · slow `900ms` (breath / ambient).
- **Entrance pattern (every word)**: anticipation pullback → PUNCH → overshoot → BREATHE settle → held breath pause.
- **Personality**: Energetic wordmark + Premium settle; Playful props. Target feeling: warm, nocturnal, a wink.

## Three layers (never fewer)

- **Primary** — the words: **late / nite / bite** — lowercase always, tight-set (negative tracking, a bit of squish), in the custom hand-drawn lockup letterforms (Archie wink — see brand.md): rounded, tucked, a quiet baseline bounce. They punch hard but never shout.
- **Secondary** — one food beat reacts to each word landing.
- **Ambient** — the faceless world: silhouette crowd, trees, warm color field, slow parallax, the mouse breathing.

## Beat sheet (~5s)

| t | Primary | Secondary | Ambient |
|---|---------|-----------|---------|
| 0.00s | — | — | Deep navy. One unlit bulb low-frame. Crowd + trees as flat darker shapes, 1–2px drift. |
| 0.30s | **LATE** anticipation (scale 0.9, ~80ms) | — | — |
| 0.38s | **LATE** PUNCH (0.9→1.04, x −8→0, 140ms) | **pizza rolls in from 9 o'clock** — arc + rotate, squash on contact, wobble follow-through | color field warms a notch |
| 0.52s | settle 1.04→1.0 (420ms) → **breath ~500ms** | — | crowd sways, trees parallax |
| 1.50s | **NITE** PUNCH | **bulb screws into socket** — tiny mouse on the bulb, tail round the thread, slow half-turn screw, one yawn, stays asleep; bulb flicks on | warm bloom washes scene; crowd + trees gain rim-light + depth |
| 2.90s | **BITE** PUNCH | soft "chomp" scale-pulse | a steam wisp rises |
| 3.80s | **Lockup** — words tighten to final wordmark; discreet **"est. 2015"** fades in beneath; hold ~700ms | mouse: one last sleepy tail-twitch | bulb glow stabilizes |
| 4.60s | **Hand-off** — card lifts + dissolves (EXIT, ~280ms) into Right Now | — | the bulb's glow *becomes* the app's warm background |

## Rules honored (the anti-smell checklist)

- Three layers present throughout — never flat.
- One word punching at a time (1/3-in-motion); props stay secondary.
- Enter > exit (entrances 140–420ms; exit 280ms).
- No linear on spatial moves; arcs + overshoot on every entrance (anticipation + follow-through).
- **Tap anywhere = skip** → cut to lockup (200ms) → app. Never trap a returning user.
- `prefers-reduced-motion` → cross-fade straight to the final lockup, no jabs.

## Build

- Wordmark + master timeline: `react-native-reanimated` (already in the murderbox stack), hand-keyed.
- Mouse + bulb (rigged) and pizza: **Rive** or **Lottie** vector — original art, not generated.
- Asset budget: tiny (vector), 60–120fps.

### Reanimated engineering notes (4.4.x, New Architecture)

- Pinned 4.4.1 + react-native-worklets 0.9.1 (murderbox-proven pair); New Arch + Hermes — the architecture's happy path. All beat logic in worklets via shared values; zero JS-thread animation.
- Use the modern scheduling APIs (`scheduleOnRN` / `scheduleOnUI`, not the legacy `runOnJS` / `runOnUI` names).
- Springs over duration-curves for the Android M3 Expressive dialect — 4.x energy-based spring physics stops naturally; map PUNCH to a spring there, keep the cubic-bezier on iOS/web if the feel differs.
- Animated-node budget per beat: one word + one prop + ambient ≤ a handful of animated nodes; list screens get near-zero per-row animation (known FPS cliff: many animated components in scroll).
- Avoid `scrollTo`-driven animation (known Fabric/Android frame inconsistency); the cold open never scrolls.
- No feature-flag cargo-culting: flags (e.g. Android synchronous prop-update experiments) are flipped only against a regression observed in agent-device runs, then re-measured. Tooling-soundness law applies to flags too.
- Worklet debugging: console logging misbehaves inside worklets — verify with frame timing evidence, not prints.
- Android is the variability platform — it goes first in every perf check, not last.

> The mouse is the brand's one easter egg (per the homage rule) and a mascot seed —
> the Late Nite Bite answer to murderbox's Tito.

## Screw-in beat — study status

Lives at `src/splash/ScrewInStudy.tsx`, dev route `/study`, tap to replay. Design
loop = web export + playwright contact sheet (deterministic t₀ via click,
`/tmp/lnb-capture.cjs`); sign-off loop = agent-device frame evidence on a real
build (pending first dev build); flow loop = maestro, arrives with Phase 1.

- **v1** failed review: pivoted at view center (read as pendulum wobble, not screwing); no anticipation; glow faded instead of flicking.
- **v2** passed the static contact sheet: thread-block pivot (translate-rotate-translate), 90ms anticipation lift, incandescent 2-pulse flicker (0 → 0.7 → 0.25 → 1), PUNCH settle at 990ms.
- **v3 next:** mouse on its own layer with rotational lag so it reads asleep-and-limp while the bulb turns; sheen held screen-space during rotation; live-rhythm judgment (flicker timing) needs motion, not stills.

## Mark punch list (v4, `src/splash/BulbMark.tsx`)

Grounded critiques, to be resolved during the motion pass — not as drive-bys:

- Mark geometry now lives twice (`assets/source/mark.svg` + `src/splash/BulbMark.tsx`) — unify with a codegen step so the SVG is the single source.
- Mouse body is ellipse + haunch circle; rear bulges slightly — merge into one smooth bezier body path.
- Tail crossing at the neck (106,161 → 87,171) reads ambiguous against the neck cone — clip or shade it behind.
- Sheen is a static cream ellipse — in motion it becomes a gradient sweep when the bulb wakes.
- Glow gradient is perfectly circular — bias the bloom slightly upward (per mark-1986 reference).
- Verify 3.5-unit tail strokes at small render sizes on device; consider scale-aware stroke width.

## Captured sparks (came to us, not forced)

- Creature asleep on a streetlamp (round 1-A accident) — candidate for a rare in-app delight corner: the mouse naps elsewhere in the world.
- Mouse + tail visible as silhouette *through* the lit glass (from the rejected photoreal frame) — candidate final-lockup beat: glow blooms, one beat of tail shadow through the bulb.
- Bulb hung impossibly large, moon-scale (direction C) — candidate ambient-layer composition for the cold open's world.
- Ambient layer as a living shader/mesh gradient (typegpu / react-native-wgpu are in-family via murderbox) — the navy field breathes, the amber bloom is real light, all GPU, all 60fps+.
- "nite" is the lit word — in the lockup and the cold open, nite takes the amber while late/bite stay cream (locked into the lockup study, echoes the bulb beat).
