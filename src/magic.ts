import {createObjectProxy, reconcileObject} from './types/object'
import {createArrayProxy, reconcileArray} from './types/array'
import {createMap, reconcileMap} from './types/map'

type Thunk = () => void

// TODO: check hasSymobl
export const STATE = Symbol('remmi')
export const KEYS = Symbol('remmi-keys')

enum ArchType {
  Object,
  Array,
  Reference,
  Map
}

interface ArchTypeHandler {
  createProxy(state: CursorState): any // TODO: better type
  reconcile(state: CursorState, newValue, oldValue, pending: Set<TrackingState>)
}

function getArchType(value: any): ArchType {
  if (handleAsReference(value)) return ArchType.Reference
  if (Array.isArray(value)) return ArchType.Array
  return ArchType.Object
}
const handlers: Record<ArchType, ArchTypeHandler> = {
  [ArchType.Object]: {
    createProxy: createObjectProxy,
    reconcile: reconcileObject
  },
  [ArchType.Array]: {
    createProxy: createArrayProxy,
    reconcile: reconcileArray
  },
  [ArchType.Reference]: {
    createProxy: createObjectProxy,
    reconcile() {} // TODO: replace with reconcile: die,
  },
  [ArchType.Map]: {
    createProxy: createMap,
    reconcile: reconcileMap,
  }
}

let currentlyTracking: TrackingState | undefined = undefined

export function update(cursor, next) {
  if (!isCursor(cursor)) throw new Error('Nope') // TODO: better error
  const state: CursorState = cursor[STATE]
  if (state.parent) throw new Error('Nope nope') // TODO: better error
  // optimization: if we now the max set of tracking states, we
  // could maybe stop diffing if we saw them all?
  const pendingUpdates = new Set<TrackingState>()
  state.update(next, pendingUpdates)
  pendingUpdates.forEach(tracker => {
    tracker.notifyChanged()
  })
}

export function cursor<T>(initial: T): T {
  // TODO: add overload cursor()
  // TODO: add overload cursor(basecursor, ...pathParts)
  // TODO: return T & { [STATE]} or something alike (recursive)
  return createProxy(initial).proxy
}

export class CursorState {
  // optmization: create lazily
  readonly subscribers = new Set<TrackingState>()
  // TODO: data structure should depend on archetype?
  readonly children = new Map<PropertyKey, CursorState>()
  base: any
  readonly proxy!: any
  isRef: boolean
  parent?: CursorState
  prop?: PropertyKey
  // TODO: store parent / prop or path, so that we can print nice error messages,

  constructor(base, parent?: CursorState, prop?: PropertyKey) {
    this.parent = parent
    this.prop = prop
    this.base = base
    this.isRef = handleAsReference(base)
  }

  read(grab?: boolean) {
    // we always return the proxy (the cursor), unless the value is primitive
    if (this.isRef || grab) {
      if (currentlyTracking) {
        this.subscribers.add(currentlyTracking)
        currentlyTracking.dependencies.add(this)
      }
      return this.base
    } else {
      if (!currentlyTracking) {
        console.warn(
          'Cursors should not be read directly outside a tracking context. Use a tracking context or use current if you want to peek at the current value of the cursor'
        )
      }
      return this.proxy
    }
  }

  update(newValue, pending: Set<TrackingState>, _markForRemoval?: boolean) {
    // TODO: if _markForRemoval this means that we can safely dispose this cursor
    if (newValue === this.base) {
      return
    }
    const oldValue = this.base
    const oldType = getArchType(oldValue)
    const newType = getArchType(newValue)
    this.base = newValue
    if (newType === ArchType.Reference || newType !== oldType) {
      this.clearAllChildren(pending)
    } else {
      handlers[newType].reconcile(this, newValue, oldValue, pending)
    }
    // any previous subscribers are to be updated
    this.subscribers.forEach(tracker => pending.add(tracker)) // optimization: extract closure
    this.subscribers.clear()
  }

  clearChild(key: PropertyKey, pending: Set<TrackingState>) {
    this.children.get(key)?.update(undefined, pending)
    this.children.delete(key) // TODO: this should be safe, right?!
  }

  clearAllChildren(pending: Set<TrackingState>) {
    if (!this.children.size) return
    this.children.forEach(cursor => {
      cursor.update(undefined, pending) // optimize, extract closure?
    })
    this.children.clear()
  }
}

export function createProxy(value: any, parent?: CursorState, prop?: PropertyKey): CursorState {
  const cursorstate = new CursorState(value, parent, prop)
  const proxy = handlers[getArchType(value)].createProxy(cursorstate)
  // @ts-ignore
  cursorstate.proxy = proxy
  if (parent) {
    parent.children.set(prop!, cursorstate)
  }
  return cursorstate
}

export function isCursor(thing): thing is {[STATE]: CursorState} {
  return thing && thing[STATE] ? true : false
}

export class TrackingState {
  // TODO: create interface
  readonly dependencies = new Set<CursorState>()
  public changed = false
  onChange?: Thunk

  subscribe(onChange: Thunk): Thunk {
    if (this.onChange) throw new Error('onChange already set')
    this.onChange = onChange
    if (this.changed) this.notifyChanged() // changed before subscription happened, invalidate now
    return this.dispose
  }

  notifyChanged() {
    this.changed = true
    this.onChange?.()
    // TODO: if all cursor originated from 1 root cursor, this wouldn't be needed
    this.dispose()
  }

  dispose = () => {
    this.dependencies.forEach(cursor => cursor.subscribers.delete(this))
  }
}

export function track<T, R>(
  base: T, // TODO: as second or last argument
  fn: (value: T) => R,
  autoGrab = false
): {result: R; trackingState: TrackingState} {
  try {
    currentlyTracking = new TrackingState()
    let result = fn(base)
    if (autoGrab) {
      result = autoGrabber(result)
    }
    return {result, trackingState: currentlyTracking}
  } finally {
    currentlyTracking = undefined
  }
}

export function current(cursor) {
  if (!isCursor(cursor)) throw new Error('Expected cursor')
  const cursorState: CursorState = cursor[STATE]
  const res = cursorState.read(true)
  if (isCursor(res)) return current(res)
  return res
}

function autoGrabber(base) {
  if (isCursor(base)) return current(base)
  if (handleAsReference(base)) return base
  // TODO: map and set
  if (Array.isArray(base)) {
    // TODO: can be optimized by using immer?
    return base.map(autoGrabber)
  } else {
    const res = {}
    for (const i in base) {
      // TODO: non-enumerables, prototype and such?
      res[i] = autoGrabber(base[i])
    }
    return res
  }
  return base
}

function handleAsReference(value: any): boolean {
  if (!value || typeof value !== 'object') return true
  if (isCursor(value)) return true
  if (Array.isArray(value) || value instanceof Map || value instanceof Set) return false
  const proto = Object.getPrototypeOf(value)
  if (proto === null || proto === Object.prototype) return false
  return true
}
