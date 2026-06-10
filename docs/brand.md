# Late Nite Bite — Brand Definition

The friend who's still up and knows what's still open.

## Heritage law: homage, not nostalgia

Keep: the name, the "open right now" DNA, a discreet **est. 2015**, one easter egg (the mouse).
Never: retro skins, 2015 cosplay, nostalgia marketing. The homage is structural, not cosmetic.

## Personality

**Warm, nocturnal, a wink — in that order.** Competence first, play second. The app is dead reliable about food, and allows itself exactly one smile per surface.

## The anti-cringe law

Lighthearted, never cringe. Playfulness lives in **craft** — motion, copy precision, the mouse — never in trend-chasing.

- No memes, no "fellow kids" energy, no exclamation spam, no emoji spray.
- If a joke needs explaining or a trend needs chasing: cut it.
- **Nothing shipped smells of AI.** Image/video models are moodboard-only; every shipped asset is hand-keyed vector and motion. Elegance is hand-made.
- **Assets are code.** The mark is versioned vector source (`assets/source/mark.svg`); icon, adaptive icon, splash image, and favicon compile from it (`pnpm assets`). No hand-exports, no drift — change the source, everything downstream regenerates.

## Voice

Lowercase-casual, short, concrete, honest.

| yes | no |
|---|---|
| open right now | Discover amazing late-night eats! |
| closes in 38m | Hurry! Closing soon! |
| hours unknown — trust your gut or call | (pretending to know) |
| nothing's open. rough. | No results found :( |
| est. 2015 | ★ CELEBRATING 11 YEARS ★ |

## Visual language: the night, behind glass

A two-layer world:

1. **Content is the night.** Deep-navy field, warm amber bulb-glow, edge-to-edge. Brand color lives *here* — in content and background, never in nav chrome.
2. **Chrome speaks the platform's native material.** Controls and navigation only — filter bar, floating Navigate, tabs — never content surfaces, never full-screen material sheets. Content runs edge-to-edge beneath so the chrome has something to react to.

Two dialects, one night:

- **iOS — Liquid Glass** (iOS 26). `expo-glass-effect` `GlassView` guarded by `isGlassEffectAPIAvailable()` → `BlurView` on older iOS. Never `opacity < 1` on glass; no scrollables inside glass.
- **Android — Material 3 Expressive.** No fake glass: tonal translucent `lnb-surface` chrome, M3 shapes and ripples, springy Expressive motion (the PUNCH family maps to spring physics), system navigation bar via native tabs, edge-to-edge as Android 16 expects. Dynamic color stays off in v1 — the night is the brand; revisit as a Phase 2 accent option.
- **Web / fallback** — tinted translucent `lnb-surface`. Reduce-transparency on → solid surfaces, everywhere.

Shared discipline: related controls share one chrome cluster; unrelated groups get space, not borders; system defaults first, tuned lightly.

### Tokens (source of truth: `src/global.css`)

| token | dark (the brand) | light (paper) |
|---|---|---|
| `lnb-bg` | deep navy `#0A101C` | warm paper `#FAF7F0` |
| `lnb-glow` | bulb amber `#FFB84D` | amber ink `#BA6E0C` |
| `lnb-open` / `lnb-closed` | green / muted red | deeper pair |

Night mode is the soul. Light mode is the morning-after paper edition. Never neon, never arcade.

## Motion is the personality channel

PUNCH / BREATHE / EXIT — the signature curves (`docs/splash-cold-open.md`). Entrances snap, settles breathe, exits hurry, ambient never stops breathing.

**60fps floor, 120 on ProMotion, UI-thread only.** A dropped frame is a brand bug — checked per release with agent-device runs on real hardware.

## The mouse

A sleeping mouse — screws in the bulb with its tail, does not want to be woken. Easter egg first, mascot seed second: LNB's answer to murderbox's Tito.

Rules: never blocks a task, never says marketing words, asleep by default, appears in the cold open and rare delight corners only.

## The craft loop

Iteration is the key to success — with fidelity.

1. Every change is **grounded in a named critique** — something observed and stated before touching the work. No churn, no vibes-edits.
2. Keep a living **punch list** of known weaknesses; attack them when already in the medium, not as drive-bys.
3. **Capture what comes to us.** Happy accidents and emergent ideas get written down the moment they appear (a "sparks" list per piece) — used later on merit, never forced in the moment.
4. AI output is critiqued by the same standard as hand work, then rebuilt by hand.

## Type

Brand face deliberately undecided — system stack until the design pass picks one on purpose. A default-font shrug is not a decision.

## Naming

"Late Nite Bite" in prose · **late nite bite** lockup — always lowercase, tight-set with a bit of kerning squish (the wordmark obeys the voice; it never shouts) · `latenitebite` slug · "LNB" internal only.

### The lockup (Archie wink)

The lockup is **custom hand-drawn lettering**, not a typed font: rounded terminals, letters tucked into and leaning on each other, a quiet baseline bounce — the warmth of comic-diner lettering (Archie at Pop's: late-night booths and milkshakes is exactly our lineage). It's a wink, never cosplay: no comic outlines, no halftones, no red-and-yellow. Amber/cream on the night navy, drawn in the same craft loop as the bulb mark. The splash punch words (late / nite / bite) carry the same letterforms.

Locked parameters (study v3, 2026-06-09): squish ≈ −0.10em · baseline bounce max one letter per word, ~3% of em · **bite always planted level** (it's the landing) · stacked lockup reads as one unit (tight leading) · **nite always takes the amber** — the lit word between cream siblings; cream `#F2E9DA`, amber `#FFB84D`, on navy `#0A101C`.
