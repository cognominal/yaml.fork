# lyaml plan (SHIVA)

## Goal & Scope

- Define **lyaml** as a YAML-adjacent extension for
  "Shiva" objects: collections that can be both a mapping
  and a sequence, serialized without an intermediate wrapper.
- Provide a concise representation for DOM-like trees and
  allow lyaml-only parsing/serialization via a feature flag.
- Start with DOM serialization and generalize to other
  Shiva-shaped objects later.

## Core Data Model

A Shiva object has:

- **name**: an identifier (e.g., HTML tag name)
- **map**: key/value attributes
- **seq**: ordered children

Proposed adapter (types clarified):

```ts
interface ShivaAdapter {
  name(): string
  map(): Record<string, unknown> | Map<string, unknown>
  seq(): unknown[]
}
```

## Syntax Rules

### Block style

- Use a mapping key for the Shiva name.
- Inside that mapping, serialize a **map section first**,
  followed by a **sequence section** at the same indentation.
- The transition from map to sequence is determined by the
  first `-` item at the same indentation level.

Example (from HTML):

```lyaml
- h1:
    id: id
    class: a b
    - some
    - b:
      - bold
    - text
```

### Flow style (deferred)

- Not in v1; revisit after block syntax is stable.

### Empty parts

- Empty map: omit map keys and start sequence immediately.
- Empty seq: map-only Shiva is valid.
- Both empty: allowed but discouraged.

### Strict boundary rules

- A Shiva block has at most one map section and at most one
  seq section.
- If both are present, the seq section **must** follow the
  map section; no map entries may appear after the first `-`
  at the same indent.
- A same-indent `-` ends the map section immediately.
- Any map entry after that is a parse error in lyaml mode.

## YAML Mapping & Tagging

- Do not require explicit tags in lyaml mode.
- Add a parser/stringifier flag (e.g. `lyaml: true`) that
  enables Shiva collection handling.
- In lyaml mode, interpret a block mapping that contains
  a map section followed by same-indent sequence items as
  a **map+seq combo**.

## API Flag Wiring

- Use `lyaml?: boolean` as the option name.
- Add it to parse/stringify option types (or a dedicated
  `LyamlOptions` reused across entry points).
- Extend `ParseOptions`, `DocumentOptions`, and
  `ToStringOptions` in `src/options.ts` to accept the flag.
- Thread the flag from `src/public-api.ts` entry points:
  `parse`, `parseDocument`, `parseAllDocuments`, `stringify`.
- Pass `lyaml` into `Parser` and `Composer` (constructor or
  context), and into `createStringifyContext` in
  `src/stringify/stringify.ts`.
- When `lyaml` is falsy, preserve current YAML behavior.

## Added/Modified Signatures

- `LyamlOptions` (src/options.ts)

```ts
export type LyamlOptions = {
  lyaml?: boolean
}
```

- `ParseOptions`, `DocumentOptions`, `ToStringOptions` add:

```ts
lyaml?: boolean
```

- `parse` (src/public-api.ts)

```ts
export function parse(
  src: string,
  options?: ParseOptions &
    DocumentOptions &
    SchemaOptions &
    ToJSOptions &
    LyamlOptions
): any
```

- `parseDocument` (src/public-api.ts)

```ts
export function parseDocument<
  Contents extends Node = ParsedNode,
  Strict extends boolean = true
>(
  source: string,
  options?: ParseOptions & DocumentOptions & SchemaOptions & LyamlOptions
): Contents extends ParsedNode
  ? Document.Parsed<Contents, Strict>
  : Document<Contents, Strict>
```

- `parseAllDocuments` (src/public-api.ts)

```ts
export function parseAllDocuments<
  Contents extends Node = ParsedNode,
  Strict extends boolean = true
>(
  source: string,
  options?: ParseOptions &
    DocumentOptions &
    SchemaOptions &
    LyamlOptions
): Array<...> | EmptyStream
```

- `stringify` (src/public-api.ts)

```ts
export function stringify(
  value: any,
  options?: DocumentOptions &
    SchemaOptions &
    ParseOptions &
    CreateNodeOptions &
    ToStringOptions &
    LyamlOptions
): string
```

- `Parser` (src/parse/parser.ts)

```ts
constructor(
  onNewLine?: (offset: number) => void,
  options?: LyamlOptions
)
```

- `Composer` (src/compose/composer.ts)

```ts
constructor(
  options: ParseOptions &
    DocumentOptions &
    SchemaOptions &
    LyamlOptions = {}
)
```

- `StringifyContext` (src/stringify/stringify.ts)

```ts
export type StringifyContext = {
  ...
  lyaml?: boolean
}
```

- `createStringifyContext` (src/stringify/stringify.ts)

```ts
export function createStringifyContext(
  doc: Document,
  options: ToStringOptions & LyamlOptions
): StringifyContext
```

- `ShivaNode` (new file)

```ts
export class ShivaNode extends Collection {
  map: YAMLMap
  seq: YAMLSeq
  toString(
    ctx?: StringifyContext,
    onComment?: () => void,
    onChompKeep?: () => void
  ): string
}
```

## Implementation Plan (Reuse Existing Routines)

1. **Add a lyaml feature flag**
   - Extend parse/stringify options with `lyaml?: boolean`.
   - Thread the flag through `Parser`, `Composer`, and
     `StringifyContext`.

2. **Create a Shiva node class**
   - Extend `YAMLMap` or `YAMLSeq`, or define a new
     `ShivaNode` collection holding both map and seq sections.
   - Reuse `resolveBlockMap` + `resolveBlockSeq` for parsing
     mechanics.

3. **Parser/compose changes (lyaml only)**
   - In lyaml mode, allow block map items to transition into
     sequence items at the same indentation level.
   - Reuse existing CST tokens; avoid changing the lexer.

4. **Stringify support**
   - Add a custom `stringify` handler or override `toString`
     on the Shiva node.
   - Reuse `stringifyCollection` to emit map entries then
     sequence items.

5. **Adapter integration**
   - Provide a helper that converts `ShivaAdapter` into the
     Shiva node.
   - Keep standard YAML behavior unchanged unless `lyaml`
     is enabled.

## Testing Plan

### Tests to add

- HTML example round-trip (block style).
- Empty map / empty seq behavior.
- DOM node variants: element, text, comment, document,
  doctype.
- Ensure standard YAML parsing unchanged when `lyaml`
  flag is disabled.

### Commands

- Single test: `npm test -- tests/doc/shiva.test.ts`
- Single pattern: `npx vitest run -t "lyaml"`
- Full suite (optional): `npm test`

## Notes / Edge Cases

- Anchors/tags inside map/seq must be preserved.
- Error handling should follow `Document#errors` instead of
  throwing.
- Define how `name()` is represented if flow style is added
  later.


