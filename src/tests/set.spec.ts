import {cursor, track, isCursor} from '../remmi'
import {update, current} from '../magic'
import {simpleTest} from './utils'

test('set iteration', () => {
  const x = new Set(['a', 'b'])
  const x$ = cursor(x)
  expect(Array.from(x$)).toEqual(['a', 'b'])
  update(x$, new Set(['c', 'b']))
  expect(Array.from(x$)).toEqual(['c', 'b'])
  expect(Array.from(x$.values())).toEqual(['c', 'b'])
  expect(Array.from(x$.keys())).toEqual(['c', 'b'])
  expect(Array.from(x$.entries())).toEqual([
    ['c', 'c'],
    ['b', 'b']
  ])

  const res: string[] = []
  x$.forEach((k, v) => {
    res.push(k, v)
  })
  expect(res).toEqual(['c', 'c', 'b', 'b'])
})

test('set basics', () => {
  const x = new Set(['a'])

  simpleTest(x, s => s.has('a'), new Set(['a']), false)
  simpleTest(x, s => s.has('a'), new Set(['a', 'd']), true) // could be false, see optimizations in Set
  simpleTest(x, s => s.has('a'), new Set(['b']), true)

  simpleTest(x, s => s.size, new Set(['b']), false)
  simpleTest(x, s => s.size, new Set(['b', 'c']), true)
})

test('sets of objects', () => {
  const a = {x: 1}
  const b = {x: 2}
  const x = new Set([a])

  simpleTest(x, s => s.has(a), new Set([a]), false)
  simpleTest(x, s => s.has(a), new Set([a, {x: 2}]), true) // ideally false

  simpleTest(x, s => Array.from(s)[0].x, new Set([a]), false)
  simpleTest(x, s => Array.from(s)[0].x, new Set([{x: 2}]), true)
  simpleTest(x, s => Array.from(s)[0].x, new Set([{x: 1}]), false)
  simpleTest(x, s => Array.from(s)[0].x, new Set([a, {x: 2}]), false)
  simpleTest(x, s => Array.from(s)[0].x, new Set([{x: 2}, a]), true)
})

test('swaps in sets of objects', () => {
  const a = {x: 1}
  const b = {x: 2}
  const x = new Set([a, b])

  // different set, but nothing grabbed
  simpleTest(x, s => Array.from(s), new Set([0, 1]) as any, false)
  // same set
  simpleTest(x, s => Array.from(s), new Set([a, b]), false)
  // swap items, but never grab anything
  simpleTest(x, s => Array.from(s), new Set([b, a]), false) 
  // swap and grab
  simpleTest(
    x,
    s => {
      const r = Array.from(s)
      current(r[0])
      current(r[1])
    },
    new Set([a, b]),
    false
  )
  simpleTest(
    x,
    s => {
      const r = Array.from(s)
      current(r[0])
      current(r[1])
    },
    new Set([b, a]),
    true
  )
  // swapped, but same length
  simpleTest(x, s => s.size, new Set([b, a]), false)
})
