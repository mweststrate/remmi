import {cursor, track, isCursor} from '../remmi'
import {update, current} from '../magic'
import {simpleTest} from './utils'

test('map basics', () => {
  const x = new Map([['a', 1]])

  simpleTest(x, s => s.get('a'), new Map([['a', 2]]), true)
  simpleTest(x, s => s.get('a'), new Map([['a', 1]]), false)
  simpleTest(
    x,
    s => s.get('a'),
    new Map([
      ['a', 1],
      ['b', 2]
    ]),
    false
  )
})

test('map iteration', () => {
  const x = new Map([['a', 1]])

  const x$ = cursor(x)
  expect(Array.from(x$)).toEqual([['a', 1]])
  update(
    x$,
    new Map([
      ['c', 2],
      ['b', 3]
    ])
  )
  expect(Array.from(x$)).toEqual([
    ['c', 2],
    ['b', 3]
  ])
  expect(Array.from(x$.values())).toEqual([2, 3])
  expect(Array.from(x$.keys())).toEqual(['c', 'b'])
  expect(Array.from(x$.entries())).toEqual([
    ['c', 2],
    ['b', 3]
  ])

  const res: any[] = []
  x$.forEach((v, k) => {
    res.push(v, k)
  })
  expect(res).toEqual([2, 'c', 3, 'b'])
})

test('maps of objects', () => {
  const a = {x: 1}
  const b = {x: 2}
  const x = new Map([["a", a], ["b", b]])

  simpleTest(x, s => s.has("a"), new Map([["a", a], ["b", b]]), false)
  simpleTest(x, s => s.has("a"), new Map([["a", a]]), true) // ideally false

  simpleTest(x, s => Array.from(s.values())[0].x, new Map([["a", a]]), false)
  simpleTest(x, s => Array.from(s.values())[0].x, new Map([["a", b]]), true)
  simpleTest(x, s => Array.from(s.values())[0].x, new Map([["a", {x: 1}]]), false)
  simpleTest(x, s => Array.from(s.values())[0].x, new Map([["a", {x: 1}], ["b", b], ["c", a]]), false)
})

test('swaps in maps of objects', () => {
  const a = {x: 1}
  const b = {x: 2}
  const x = new Map([["a", a], ["b", b]])

  // different set, but nothing grabbed
  simpleTest(x, s => Array.from(s), new Map([[0, 1], [2,3]]) as any, false)
  // same set
  simpleTest(x, s => Array.from(s), new Map([["a", a], ["b", b]]), false)
  // swap items, but never grab anything
  simpleTest(x, s => Array.from(s), new Map([["b", b], ["a", a]]), false)
  // grab, no swap
  simpleTest(
    x,
    s => {
      const r = Array.from(s.values())
      current(r[0]) 
      current(r[1]) 
    },
    new Map([["a", a], ["b", b]]),
    false
  )
  // swap and grab
  simpleTest(
    x,
    s => {
      const r = Array.from(s.values())
      current(r[0]) // now b
      current(r[1]) // now a
    },
    new Map([["a", b], ["b", a]]),
    true
  )
  simpleTest(
    x,
    s => {
      const r = Array.from(s.values())
      current(r[0]) // now b
      current(r[1]) // now a
    },
    new Map([["b", b], ["a", a]]),
    true
  )
  simpleTest(
    x,
    s => {
      const r = Array.from(s.values())
      current(r[0]) // still a
      current(r[1]) // still b
    },
    new Map([["b", a], ["a", b]]),
    true
  )
  simpleTest(
    x,
    s => {
      // TODO: should this count as grabbing or getting cursors?
      const r = Array.from(s.keys()) // now ["b", "a"]
    },
    new Map([["b", a], ["a", b]]),
    true
  )

  // swapped, but same length
  simpleTest(x, s => s.size, new Map([["b", b], ["a", a]]), false)
})
