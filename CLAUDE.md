# LateNiteBite — agent context

## Commands

| task | command |
|------|---------|
| start (dev) | `pnpm start` |
| web (dev) | `pnpm web` |
| iOS (dev) | `pnpm ios` |
| Android (dev) | `pnpm android` |
| typecheck | `pnpm typecheck` |
| test | `pnpm test` |
| lint | `pnpm lint` |
| build (web export) | `pnpm build` |
| compile assets | `pnpm assets` |

## Structure

```
app/           expo-router routes (typed routes enabled)
src/           all non-route source (@/* → ./src/*)
  core/        data spine — Overpass fetcher, open-now engine, ranking (do not redesign)
  splash/      cold open components
  tw/           typed Tailwind primitives
  global.css   Tailwind / Uniwind token definitions
docs/          product.md · brand.md · splash-cold-open.md — canon, read first
assets/        compiled outputs
assets/source/ vector source files (mark.svg is the single source)
scripts/       asset compilation
```

## Canon docs — read before touching anything

- `docs/product.md` — core loop, phase map, performance law, $0 constraint
- `docs/brand.md` — chrome law (iOS Liquid Glass / Android M3 Expressive), motion identity, anti-cringe law
- `docs/splash-cold-open.md` — cold open beat sheet, 60fps gates, Reanimated rules

## Laws

- **60fps floor everywhere; 120 on ProMotion.** All motion on the UI thread (Reanimated worklets). A dropped frame is a brand bug.
- **No AI-generated shipped assets.** Image/video models are moodboard-only. Every shipped asset is hand-keyed vector.
- **Assets are code.** `assets/source/mark.svg` is the single source; icon, adaptive icon, splash, favicon all compile via `pnpm assets`. Do not hand-export.
- **No inline comments.** Code is self-documenting.
- **TypeScript strict.** No `any`, no type assertions without justification.
- **Tooling only when soundly applicable.** Don't adopt a library because it exists; cite the LNB use case.
- **Agentic verification before human review.** Never ask the human to look at a surface you haven't driven agentically first — same server, same route, same interaction, evidence attached.
- **Branch names describe the human task.** Never append `-codex`, `_codex`, or similar AI-origin markers.
- **Server components first.** Minimize client JS.
- **No AI-gimmick features.** The product is honest data + client compute, not an AI layer.

## Stack

Expo SDK 56 · expo-router 56 (typed routes) · React 19 · RN 0.85 · Hermes · New Architecture · Reanimated 4 + Worklets · Uniwind 1.8 (Tailwind v4) · TanStack Query 5 · Zod 4 · lucide-react-native · TypeScript 6 strict · pnpm · vitest

## Multi-agent workflow

Codex runs engineering bulk in parallel. Fable agents handle orchestration and audits. Human + Claude own creative direction. Each agent operates within this CLAUDE.md boundary — do not override canon docs or touch `.moodboard/`.
