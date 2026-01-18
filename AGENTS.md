# AGENTS.md

This file guides agentic contributors working in this repo.
Follow these instructions unless a more specific AGENTS.md overrides them.

## Quick Start

- Repo root: `/Users/cog/mine/yaml.fork`.
- Install deps: `npm install` (npm v7+).
- Initialize submodules for tests: `git submodule update --init`.
- Node version: `^20.19 || ^22.12 || >=24`.
- Package type: ESM (`"type": "module"`).

## Common Commands

- Build: `npm run build` (rolldown).
- Lint: `npm run lint` (eslint `src/`).
- Format: `npm run prettier` (prettier --write).
- Test (core): `npm test` (vitest run).
- Test (types): `npm run test:types`.
- Test (dist build): `npm run test:dist`.
- Test (dist types): `npm run test:dist:types`.
- Full CI-ish: `npm run test:all`.
- Clean: `npm run clean` (git clean -fdxe node_modules).
- Docs preview: `npm run docs` (Middleman, in `docs-slate/`).
- Docs prepare: `npm run predocs`.

## Running a Single Test

- By file: `npx vitest run tests/doc/foo.test.ts`.
- By pattern: `npx vitest run -t "parse handles"`.
- With npm script: `npm test -- tests/doc/foo.test.ts`.
- Dist tests: `TEST_DIST=1 npx vitest run tests/doc/foo.test.ts`.

## Repo Structure

- `src/` library source (TypeScript).
- `tests/` vitest suites and fixtures.
- `dist/` build output (generated).
- `docs/` docs tooling and content.
- `docs-slate/` docs site (git submodule).

## Code Style Overview

- Keep changes small and focused; avoid unrelated refactors.
- Favor readability and correctness over cleverness.
- Respect YAML safety goals: be safe with bad input.
- Maintain compatibility with YAML 1.1 and 1.2.
- Avoid behaviors that could cause resource exhaustion.

## Formatting (Prettier)

- Single quotes for strings.
- No semicolons.
- Trailing commas: none.
- Arrow parens: avoid when possible.
- Run `npm run prettier` after large edits.

## ESLint Rules (Highlights)

- `camelcase` enforced in source files.
- `eqeqeq` enforced (allow `== null`).
- `no-var`; prefer `const`.
- `no-implicit-globals` (use module scope).
- `no-constant-condition` allows loop conditions.
- `no-fallthrough` requires `fallthrough` comment.
- `no-template-curly-in-string` is a warning.
- `array-callback-return` enforced.
- Tests relax `camelcase` and some TS safety rules.

## Imports & Modules

- Use ESM `import` / `export` syntax.
- Relative imports must include `.ts` extension.
- Type-only imports must use `import type`.
- Keep import groups ordered: node builtins, external, local.
- Avoid side-effect-only imports; explain if required.
- Do not add new dependencies without justification.

## TypeScript Practices

- `strict` mode is on; satisfy all strict checks.
- No unused locals or parameters (prefix unused with `_`).
- Use explicit types when inference is unclear.
- Avoid `any`; use `unknown` + narrowing.
- Prefer `type` exports/imports for types.
- Avoid namespaces; use modules.
- Keep public types stable; breaking changes need semver-major.

## Naming Conventions

- `camelCase` for variables and functions.
- `PascalCase` for classes and types.
- `UPPER_SNAKE_CASE` for constants (rare).
- File names: follow existing patterns in `src/`.
- Keep API names aligned with docs.

## Error Handling & Safety

- Parsing should be resilient; avoid throwing on bad input.
- Use `YAMLWarning`/`YAMLError` patterns if present.
- Validate inputs early; avoid unsafe coercions.
- Prefer returning errors in `Document#errors` where applicable.
- Ensure error messages are actionable and stable.

## Testing Expectations

- Add tests for behavior changes.
- Prefer tests in `tests/` that match existing layout.
- Use vitest globals (`describe`, `it`, `expect`).
- For new fixtures, put data in `tests/artifacts/`.
- Avoid modifying submodule data unless required.

## Build Output

- `dist/` is generated; don't edit directly.
- When touching build-related code, run `npm run build`.
- Dist tests use `TEST_DIST=1` or `npm run test:dist`.

## Docs & Site

- Docs build uses `docs-slate/` submodule.
- Use `npm run predocs` to update docs content.
- `npm run docs` runs the local docs server.

## REPL

- `npm run start` launches a Node REPL with YAML loaded.
- Helpful for quick parse/stringify experiments.

## Git & Contribution Notes

- Keep commits scoped; avoid mixing refactors and fixes.
- Declare LLM assistance in PRs (per CONTRIBUTING).

## Editor/Agent Rules

- Cursor rules: none found in `.cursor/rules/` or `.cursorrules`.
- Copilot rules: none found in `.github/copilot-instructions.md`.

## Common Gotchas

- Tests require submodules (`tests/json-test-suite`, `tests/yaml-test-suite`).
- Relative imports without `.ts` will fail lint.
- ESM context: use `import.meta` instead of `__dirname`.
- Keep runtime compatibility with Node 20.19+.

## Helpful Snippets

- Run a focused test: `npx vitest run tests/doc/parse.test.ts`.
- Run a single case: `npx vitest run -t "anchors"`.
- Lint a single file: `npx eslint src/parse/parser.ts`.
- Format a single file: `npx prettier --write src/parse/parser.ts`.

## When In Doubt

- Prefer safety and compatibility over new features.
- Read neighboring files before making structural changes.
- Ask for clarification if behavior is ambiguous.
- Keep public API behavior consistent with docs.

## Related Files

- `package.json` scripts define build/test/lint.
- `eslint.config.js` defines lint rules.
- `tsconfig.json` defines TS strictness.
- `vitest.config.js` defines test aliases.
- `docs/CONTRIBUTING.md` has contribution context.

## End

- Keep this file updated as commands or rules change.
