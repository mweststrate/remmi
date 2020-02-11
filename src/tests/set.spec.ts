import {cursor, track, isCursor} from '../remmi'
import {update, current} from '../magic'
import {simpleTest} from "./utils"

test("set iteration", () => {
  const x = new Set(["a","b"])
  const x$ = cursor(x);
  expect(Array.from(x$)).toEqual(["a", "b"])
  update(x$, new Set(["c", "b"]))
  expect(Array.from(x$)).toEqual(["c", "b"])
  expect(Array.from(x$.values())).toEqual(["c", "b"])
  expect(Array.from(x$.keys())).toEqual(["c", "b"])
  expect(Array.from(x$.entries())).toEqual([["c","c"], ["b","b"]])

  const res: string[] = []
  x$.forEach((k, v) => {
    res.push(k,v)
  })
  expect(res).toEqual(["c","c","b","b"])
})

test("set basics", () => {
  const x = new Set(["a"])

  simpleTest(x, s => s.has("a"), new Set(["a"]), false)
  simpleTest(x, s => s.has("a"), new Set(["a", "d"]), true) // could be false, see optimizations in Set
  simpleTest(x, s => s.has("a"), new Set(["b"]), true)

  simpleTest(x, s => s.size, new Set(["b"]), false)
  simpleTest(x, s => s.size, new Set(["b", "c"]), true)
})

test("sets of objects", () => {
  const a = { x: 1 }
  const x = new Set([a])

  simpleTest(x, s => s.has(a), new Set([a]), false)
  simpleTest(x, s => s.has(a), new Set([a, { x: 2}]), true) // ideally false

  simpleTest(x, s => (Array.from(s)[0].x), new Set([a]), false)
  debugger
  simpleTest(x, s => (Array.from(s)[0].x), new Set([{ x: 2}]), true)
  simpleTest(x, s => (Array.from(s)[0].x), new Set([a, { x: 2}]), false)
  simpleTest(x, s => (Array.from(s)[0].x), new Set([{ x: 1}]), false)
  simpleTest(x, s => (Array.from(s)[0].x), new Set([{ x: 2}, a]), true)
})
