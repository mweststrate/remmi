import {createStore, track, isLens} from './remmi'
import {update, current} from './magic'

function simpleTest<T, R>(
  baseState: T,
  trackFn: (v: T) => R,
  newState: T,
  shouldTrigger: boolean
) {
  const lens = createStore(baseState)

  const {trackingState} = track(lens, trackFn)
  let changed = false
  trackingState.subscribe(() => {
    changed = true
  })

  update(lens, newState)
  expect(changed).toBe(shouldTrigger)
}

test('simple object tracking', () => {
  simpleTest({x: 1}, s => s.x, {x: 2}, true)
  simpleTest({x: 1}, s => s.x, {x: 1}, false)
  simpleTest({x: 1}, s => s.x, {x: 1, y: 2}, false)
  simpleTest({x: 1}, s => s.x, {}, true)
  simpleTest({x: 1}, s => Object.keys(s), {y: 0}, true)
  simpleTest({x: 1}, s => Object.keys(s), {x: 0}, false)
  simpleTest({x: 1}, s => Object.entries(s), {x: 0}, true)
  simpleTest({x: 1}, s => Object.entries(s), {x: 1}, false)
  simpleTest({x: 1}, s => Object.entries(s), {}, true)
  simpleTest({x: 1}, s => Object.entries(s), {x: 1, y: 2}, true)
})

test('simple array tracking', () => {
  simpleTest([1, 2, 3], s => s[1], [1, 3], true)
  simpleTest([1, 2, 3], s => s[1], [], true)
  simpleTest([1, 2, 3], s => s[1], [1, 2], false)

  simpleTest([1, 2, 3], s => s.map(x => x + 1), [1, 2], true)
  simpleTest([1, 2, 3], s => s.map(x => x + 1), [1, 2, 3], false)
  simpleTest([1, 2, 3], s => s.map(x => x + 1), [3, 2, 1], true)

  simpleTest([1, 2], s => Array.from(s), [1, 2], false)
  simpleTest([1, 2], s => Array.from(s), [1, 3], true)
})

test('isLens', () => {
  const x = createStore({x: {y: 1}, z: 2})
  expect(isLens(x)).toBe(true)
  expect(isLens(x.x)).toBe(true)
  // TODO: supress warnings
  expect(isLens(x.x.y)).toBe(false)
  expect(isLens(x.z)).toBe(false)
})

test('object + current', () => {
  simpleTest({x: 1}, s => s, {x: 1}, false)
  simpleTest({x: 1}, s => s, {}, false)
  simpleTest({x: 1}, s => s, {x: 2}, false)

  simpleTest({x: 1}, s => current(s), {x: 1}, true)
  const base = {x: 1}
  simpleTest(base, s => current(s), base, false)
})

test('deep', () => {
  simpleTest(
    {x: {y: {z: 1, zz: 2}}, a: {}},
    s => s.x.y.z,
    {x: {y: {z: 1}}},
    false
  )

  simpleTest(
    {x: {y: {z: 1, zz: 2}}, a: {}},
    s => s.x.y.z,
    {x: {y: {z: 2}}},
    true
  )

  simpleTest(
    {x: {y: {z: 1, zz: 2}}, a: {}},
    s => s.x.y.z,
    {x: {y: {z: 1, zz: 3}}},
    false
  )
})
