# Acorn AST Output (Draft Spec)

## Goal

Add an option to the YAML parser that returns an Acorn-compatible ESTree AST
instead of JavaScript values. The AST represents a JS expression that recreates
the parsed YAML value.

## Public API

### New option

`ParseOptions` gains an `ast` option:

```ts
type AcornAstOptions = {
  format: 'acorn'
  /** Include `start`/`end` offsets when available. Default: false. */
  range?: boolean
  /** Include `loc` objects when available. Default: false. */
  locations?: boolean
}

type ParseOptions = {
  ...
  /**
   * Return an Acorn-compatible ESTree AST instead of JS values.
   *
   * Default: undefined
   */
  ast?: 'acorn' | AcornAstOptions
}
```

### `YAML.parse`

When `options.ast` is set to `'acorn'` (or `{ format: 'acorn' }`),
`YAML.parse()` returns a `Program` node whose body contains a single
`ExpressionStatement` representing the parsed YAML value.

`reviver` is not supported with AST output and will throw if provided.

```ts
import YAML from 'yaml'

const ast = YAML.parse('a: 1\n', { ast: 'acorn' })
// ast.type === 'Program'
```

### `YAML.parseAllDocuments`

When `options.ast` is set, `YAML.parseAllDocuments()` returns an array of
`Program` nodes, one per document in the stream. For empty streams, the current
`EmptyStream` semantics still apply (no ASTs are returned).

### `YAML.parseDocument`

`YAML.parseDocument()` continues to return a `Document`. A new method is
added to `Document`:

```ts
doc.toAcorn(options?: AcornAstOptions): Program
```

`YAML.parseDocument()` ignores `options.ast`; this avoids changing its return
type and keeps current behavior stable.

## AST Shape

The AST follows Acorn/ESTree conventions. The output is a JS expression that,
when evaluated, yields a value equivalent to `doc.toJS()` using the same parse
options.

### Root

- `Program` (sourceType: `'script'`)
  - `body: [ExpressionStatement]`
  - `ExpressionStatement.expression` is the value expression

### Scalars

- `null` -> `Literal { value: null }`
- boolean -> `Literal { value: true | false }`
- number -> `Literal { value: number }`
- bigint (when `intAsBigInt: true`) -> `Literal { value: bigint, bigint: string }`
- string -> `Literal { value: string }`

### Sequences

- YAML sequences -> `ArrayExpression`

### Mappings

- YAML mappings -> `ObjectExpression` with `Property` entries
- Property keys:
  - string keys -> `Property.key = Literal { value: string }`, `computed = false`
  - non-string keys:
    - if `mapAsMap: true`, use `NewExpression` (`new Map([...])`)
    - otherwise, coerce to string as `doc.toJS()` does and use a string key

### Special Tags

- Tagged scalars/collections resolve through the schema exactly as in `toJS()`.
  The AST represents the resolved JS value, not the tag itself.

### Other JS Values

- `Date` -> `new Date(<iso-string>)`
- `Map` -> `new Map([[key, value], ...])`
- `Set` -> `new Set([value, ...])`
- `Uint8Array` -> `Uint8Array.from([bytes...])`
- `Buffer` (when available) -> `Buffer.from([bytes...])`
- `RegExp` -> `new RegExp(source, flags)`
- Unsupported values (functions, symbols, non-plain objects) throw `TypeError`.

## Location Data

Location fields are reserved but not emitted in the initial implementation.
`range`/`loc` options are accepted for forward compatibility and currently have
no effect.

## Non-Goals

- No evaluation helpers are added.
- No Acorn dependency is introduced; the AST is constructed directly in
  ESTree-compatible shape.
- No attempt is made to preserve YAML anchors/aliases in the AST; aliases are
  resolved by the same rules as `toJS()`.
