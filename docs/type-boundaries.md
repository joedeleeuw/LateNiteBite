# Type Boundaries

This rule is not specific to spot photos. Spot photos exposed the issue because one change crossed route params, API requests, provider credentials, provider responses, query keys, and UI props.

The app should follow one rule everywhere:

Parse once. Type once. Pass typed values inward.

## Ownership

Use generated or library-owned types first. Expo, React Native, Expo Router, provider SDKs, and generated schemas win over local copies.

When no generated type exists, define one owned schema at the domain boundary and derive the TypeScript type from that schema. Do not create a second hand-written shape for the same data.

Manual type aliases are a smell unless they are:

- inferred from an owned schema,
- an owned domain union that describes real app state,
- a composed type at a boundary where no generated type exists,
- or a library prop type imported from the library.

Avoid aliases that only name a local object shape, a function type, a tuple, or a `Pick` that repeats an existing schema. Prefer inference from the function or schema that already owns the value.

## Parsing

Parse at the first boundary where unknown data enters the app:

- `request.json()` in API routes,
- `process.env` for configuration,
- route params and URL params,
- native module or permission responses when the SDK type is too loose,
- provider JSON responses,
- persisted data.

After parsing, downstream code receives the parsed value. It should not re-parse the same object, invent defaults, or branch through fallback shapes.

Required configuration and required typed input should fail loudly at the boundary. A screen can report the blocking condition and available actions, but domain code should not silently continue with guessed values.

## Domain Order

Run cleanup serially because these types compose. Do not parallelize adjacent domains in the same pass.

1. Core primitives: coordinates, spots, bounding boxes, opening state, ranked spots.
2. Configuration and API edges: environment variables, API request bodies, API responses.
3. Route and platform edges: route params, navigation targets, platform-specific behavior.
4. Source data adapters: Overpass, photo providers, native/location responses.
5. Domain transforms: right-now rows, display state, distance, food/category text.
6. UI integration: component props should use inferred domain values or library props, not parallel app shapes.
7. Tests and docs: keep behavior tests and delete source-shape tests.

Each domain pass should remove net code. If a pass adds a schema, it should also delete duplicate local types, repeated `Pick` shapes, redundant parses, or fallback branches.

## Checklist

For each domain:

1. Identify all ingress points.
2. Prefer generated/library types where available.
3. Compose one owned schema only when needed.
4. Export only schema-inferred or domain-owned types.
5. Parse once at ingress and pass typed values inward.
6. Delete duplicate aliases, repeated shape literals, and redundant `Pick` aliases.
7. Delete silent fallbacks for required data.
8. Verify with behavior, build, and export checks.
