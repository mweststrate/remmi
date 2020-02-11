import {cursor, track, isCursor} from '../remmi'
import {update, current} from '../magic'

export function simpleTest<T, R>(baseState: T, trackFn: (v: T) => R, newState: T, shouldTrigger: boolean) {
  const l = cursor(baseState)

  const {trackingState} = track(l, trackFn)

  update(l, newState)
  expect(trackingState.changed).toBe(shouldTrigger)
}
