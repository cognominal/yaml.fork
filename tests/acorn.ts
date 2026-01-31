import * as YAML from 'yaml'

describe('acorn ast', () => {
  test('object expression', () => {
    const ast = YAML.parse('a: 1\nb: true\n', { ast: 'acorn' }) as any
    expect(ast.type).toBe('Program')
    expect(ast.sourceType).toBe('script')
    const expr = ast.body[0].expression
    expect(expr.type).toBe('ObjectExpression')
    expect(expr.properties).toHaveLength(2)
    expect(expr.properties[0].key.value).toBe('a')
    expect(expr.properties[0].value.value).toBe(1)
    expect(expr.properties[1].key.value).toBe('b')
    expect(expr.properties[1].value.value).toBe(true)
  })

  test('mapAsMap uses Map expression', () => {
    const ast = YAML.parse('a: 1\nb: 2\n', {
      ast: 'acorn',
      mapAsMap: true
    }) as any
    const expr = ast.body[0].expression
    expect(expr.type).toBe('NewExpression')
    expect(expr.callee.name).toBe('Map')
    expect(expr.arguments[0].type).toBe('ArrayExpression')
    expect(expr.arguments[0].elements).toHaveLength(2)
  })

  test('number specials', () => {
    const ast = YAML.parse('[.inf, -.inf, .nan]', { ast: 'acorn' }) as any
    const expr = ast.body[0].expression
    expect(expr.type).toBe('ArrayExpression')
    expect(expr.elements[0].name).toBe('Infinity')
    expect(expr.elements[1].type).toBe('UnaryExpression')
    expect(expr.elements[2].name).toBe('NaN')
  })

  test('bigint literals', () => {
    const ast = YAML.parse('1\n', { ast: 'acorn', intAsBigInt: true }) as any
    const expr = ast.body[0].expression
    expect(typeof expr.value).toBe('bigint')
    expect(expr.bigint).toBe('1')
  })
})
