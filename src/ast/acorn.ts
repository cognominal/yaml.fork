import type { Document as YAMLDocument } from '../doc/Document.ts'
import type { Node } from '../nodes/Node.ts'
import type { AcornAstOptions, ToJSOptions } from '../options.ts'

export type AcornNode = {
  type: string
  [key: string]: unknown
}

export type AcornProgram = AcornNode & {
  type: 'Program'
  sourceType: 'script'
  body: [AcornNode]
}

export function toAcorn(
  doc: YAMLDocument<Node, boolean>,
  options: (AcornAstOptions & ToJSOptions) | undefined = undefined
): AcornProgram {
  const { reviver, format: _format, ...toJsOptions } = options ?? {}
  if (reviver) {
    throw new TypeError('reviver is not supported with ast output')
  }
  const value = doc.toJS(toJsOptions)
  const expression = valueToExpression(value)
  return {
    type: 'Program',
    sourceType: 'script',
    body: [
      {
        type: 'ExpressionStatement',
        expression
      }
    ]
  }
}

function valueToExpression(value: unknown): AcornNode {
  if (value === null) return literal(value)
  if (value === undefined) return identifier('undefined')
  if (typeof value === 'string') return literal(value)
  if (typeof value === 'boolean') return literal(value)
  if (typeof value === 'number') return numberLiteral(value)
  if (typeof value === 'bigint') return bigintLiteral(value)
  if (Array.isArray(value)) return arrayExpression(value)
  if (value instanceof Date) return dateExpression(value)
  if (value instanceof Map) return mapExpression(value)
  if (value instanceof Set) return setExpression(value)
  if (isBuffer(value)) return bufferExpression(value)
  if (value instanceof Uint8Array) return uint8ArrayExpression(value)
  if (value instanceof RegExp) return regexpExpression(value)
  if (isPlainObject(value)) return objectExpression(value)
  throw new TypeError(`Unsupported value in acorn ast output: ${String(value)}`)
}

function literal(value: unknown): AcornNode {
  return { type: 'Literal', value }
}

function numberLiteral(value: number): AcornNode {
  if (Number.isNaN(value)) return identifier('NaN')
  if (value === Infinity) return identifier('Infinity')
  if (value === -Infinity)
    return {
      type: 'UnaryExpression',
      operator: '-',
      prefix: true,
      argument: identifier('Infinity')
    }
  return literal(value)
}

function bigintLiteral(value: bigint): AcornNode {
  return { type: 'Literal', value, bigint: value.toString() }
}

function identifier(name: string): AcornNode {
  return { type: 'Identifier', name }
}

function arrayExpression(items: unknown[]): AcornNode {
  return {
    type: 'ArrayExpression',
    elements: items.map(valueToExpression)
  }
}

function arrayExpressionFromExpressions(items: AcornNode[]): AcornNode {
  return {
    type: 'ArrayExpression',
    elements: items
  }
}

function objectExpression(value: Record<string, unknown>): AcornNode {
  return {
    type: 'ObjectExpression',
    properties: Object.keys(value).map(key => ({
      type: 'Property',
      key: literal(key),
      value: valueToExpression(value[key]),
      kind: 'init',
      method: false,
      shorthand: false,
      computed: false
    }))
  }
}

function mapExpression(value: Map<unknown, unknown>): AcornNode {
  const entries = Array.from(value.entries()).map(([key, entryValue]) =>
    arrayExpressionFromExpressions([
      valueToExpression(key),
      valueToExpression(entryValue)
    ])
  )
  return newExpression(identifier('Map'), [
    arrayExpressionFromExpressions(entries)
  ])
}

function setExpression(value: Set<unknown>): AcornNode {
  return newExpression(identifier('Set'), [arrayExpression(Array.from(value))])
}

function dateExpression(value: Date): AcornNode {
  return newExpression(identifier('Date'), [literal(value.toISOString())])
}

function regexpExpression(value: RegExp): AcornNode {
  return newExpression(identifier('RegExp'), [
    literal(value.source),
    literal(value.flags)
  ])
}

function bufferExpression(value: Uint8Array): AcornNode {
  return callExpression(
    memberExpression(identifier('Buffer'), identifier('from')),
    [arrayExpression(Array.from(value))]
  )
}

function uint8ArrayExpression(value: Uint8Array): AcornNode {
  return callExpression(
    memberExpression(identifier('Uint8Array'), identifier('from')),
    [arrayExpression(Array.from(value))]
  )
}

function callExpression(callee: AcornNode, args: AcornNode[]): AcornNode {
  return {
    type: 'CallExpression',
    callee,
    arguments: args
  }
}

function newExpression(callee: AcornNode, args: AcornNode[]): AcornNode {
  return {
    type: 'NewExpression',
    callee,
    arguments: args
  }
}

function memberExpression(object: AcornNode, property: AcornNode): AcornNode {
  return {
    type: 'MemberExpression',
    object,
    property,
    computed: false,
    optional: false
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

function isBuffer(value: unknown): value is Uint8Array {
  return typeof Buffer === 'function' && Buffer.isBuffer(value)
}
