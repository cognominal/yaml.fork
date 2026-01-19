import type { BlockMap } from '../parse/cst.ts'
import type { Schema } from '../schema/Schema.ts'
import type { StringifyContext } from '../stringify/stringify.ts'
import { stringifyCollection } from '../stringify/stringifyCollection.ts'
import { Collection } from './Collection.ts'
import { addPairToJSMap } from './addPairToJSMap.ts'
import { isPair, isScalar, SHIVA } from './identity.ts'
import type { ParsedNode, Range } from './Node.ts'
import { Pair } from './Pair.ts'
import type { ToJSContext } from './toJS.ts'
import { findPair } from './YAMLMap.ts'
import { YAMLSeq } from './YAMLSeq.ts'

export declare namespace YAMLShiva {
  interface Parsed<
    K extends ParsedNode = ParsedNode,
    V extends ParsedNode | null = ParsedNode | null,
    S extends ParsedNode = ParsedNode
  > extends YAMLShiva<K, V, S> {
    items: Pair<K, V>[]
    range: Range
    seq: YAMLSeq<S>
    seqRange: Range
    srcToken?: BlockMap
  }
}

export class YAMLShiva<
  K = unknown,
  V = unknown,
  S = unknown
> extends Collection {
  items: Pair<K, V>[] = []
  seq: YAMLSeq<S>

  constructor(schema?: Schema, seq?: YAMLSeq<S>) {
    super(SHIVA, schema)
    this.seq = seq ?? new YAMLSeq(schema)
  }

  add(pair: Pair<K, V> | { key: K; value: V }, overwrite?: boolean): void {
    let next: Pair<K, V>
    if (isPair(pair)) next = pair
    else next = new Pair(pair.key, pair.value)
    const prev = findPair(this.items, next.key)
    if (prev) {
      if (!overwrite) throw new Error(`Key ${next.key} already set`)
      prev.value = next.value
    } else {
      this.items.push(next)
    }
  }

  delete(key: unknown): boolean {
    const pair = findPair(this.items, key)
    if (!pair) return false
    this.items.splice(this.items.indexOf(pair), 1)
    return true
  }

  get(key: unknown, keepScalar?: boolean): unknown {
    const pair = findPair(this.items, key)
    const node = pair?.value as any
    return (!keepScalar && isScalar(node) ? node.value : node) ?? undefined
  }

  has(key: unknown): boolean {
    return !!findPair(this.items, key)
  }

  set(key: unknown, value: unknown): void {
    const prev = findPair(this.items, key)
    if (prev) prev.value = value as V
    else this.items.push(new Pair(key as K, value as V))
  }

  toJSON(_?: unknown, ctx?: ToJSContext): Record<string, unknown> {
    const map: Record<string, unknown> = {}
    if (ctx?.onCreate) ctx.onCreate(map)
    for (const item of this.items) addPairToJSMap(ctx, map, item as Pair)
    return map
  }

  toString(
    ctx?: StringifyContext,
    onComment?: () => void,
    onChompKeep?: () => void
  ): string {
    if (!ctx) return JSON.stringify(this)
    for (const item of this.items) {
      if (!isPair(item))
        throw new Error(
          `Map items must all be pairs; found ${JSON.stringify(item)} instead`
        )
    }
    if (!ctx.allNullValues && this.hasAllNullValues(false))
      ctx = Object.assign({}, ctx, { allNullValues: true })

    const mapStr = stringifyCollection(this, ctx, {
      blockItemPrefix: '',
      flowChars: { start: '{', end: '}' },
      itemIndent: ctx.indent || '',
      onChompKeep,
      onComment
    })

    const seqCtx = Object.assign({}, ctx)
    let seqStr = stringifyCollection(this.seq, seqCtx, {
      blockItemPrefix: '- ',
      flowChars: { start: '[', end: ']' },
      itemIndent: seqCtx.indent || '',
      onChompKeep,
      onComment
    })
    if (seqStr && seqCtx.indent && !ctx.inFlow)
      seqStr = `${seqCtx.indent}${seqStr}`

    if (!mapStr || mapStr === '{}' || mapStr.trim() === '') return seqStr
    if (!seqStr || seqStr === '[]' || seqStr.trim() === '') return mapStr
    return `${mapStr}\n${seqStr}`
  }
}
