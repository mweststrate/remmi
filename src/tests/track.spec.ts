import {cursor, track, isCursor} from '../remmi'
import {update, current} from '../magic'

function simpleTest<T, R>(baseState: T, trackFn: (v: T) => R, newState: T, shouldTrigger: boolean) {
  const l = cursor(baseState)

  const {trackingState} = track(l, trackFn)

  update(l, newState)
  expect(trackingState.changed).toBe(shouldTrigger)
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
  const x = cursor({x: {y: 1}, z: 2})
  expect(isCursor(x)).toBe(true)
  expect(isCursor(x.x)).toBe(true)
  // TODO: supress warnings
  expect(isCursor(x.x.y)).toBe(false)
  expect(isCursor(x.z)).toBe(false)
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
  simpleTest({x: {y: {z: 1, zz: 2}}, a: {}}, s => s.x.y.z, {x: {y: {z: 1}}}, false)
  simpleTest({x: {y: {z: 1, zz: 2}}, a: {}}, s => s.x.y.z, {x: {y: {z: 2}}}, true)
  simpleTest({x: {y: {z: 1, zz: 2}}, a: {}}, s => s.x.y.z, {x: {y: {z: 1, zz: 3}}}, false)
})

test('isArray', () => {
  const c = cursor([])
  expect(Array.isArray(c)).toBe(true)
  expect(c).toBeInstanceOf(Array)
})

// autograb

// subscribe, paths and cleanup

// add perf from mobx
