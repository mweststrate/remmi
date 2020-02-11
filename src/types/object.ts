import {CursorState, createProxy, KEYS, STATE, TrackingState} from '../magic'

export function createObjectProxy(cursorstate: CursorState) {
  return new Proxy(cursorstate, objectTraps)
}

export function reconcileObject(cursorState: CursorState, newValue: any, oldValue: any, pending: Set<TrackingState>) {
  const keys = Reflect.ownKeys(newValue)
  const newKeysSet = new Set(keys)
  cursorState.children.forEach((child: CursorState, prop) => {
    if (prop === KEYS) {
      // TODO: store keySet, not keys?
      child.update(keys, pending)
    } else if (!newKeysSet.has(prop)) {
      cursorState.clearChild(prop, pending)
    } else {
      child.update(newValue[prop], pending)
    }
  })
}

export const objectTraps: ProxyHandler<any> = {
  get(state: CursorState, prop) {
    if (prop === STATE) return state
    // TODO: if we support ES5, we should warn if trying to read a non-existing property!
    const child =
      state.children.get(prop) ||
      createProxy(prop === KEYS ? Reflect.ownKeys(state.base) : state.base[prop], state, prop)
    return child.read()
  },
  getPrototypeOf(target) {
    return Reflect.getPrototypeOf(target.base)
  },
  isExtensible(target) {
    return Reflect.isExtensible(target.base)
  },
  preventExtensions(target) {
    return Reflect.preventExtensions(target.base)
  },
  getOwnPropertyDescriptor(target, p) {
    return Reflect.getOwnPropertyDescriptor(target.base, p)
  },
  has(target, p: PropertyKey) {
    return Reflect.has(target.base, p)
  },
  ownKeys(target) {
    return target.proxy[KEYS]
  },
  set() {
    // TODO: dedupe error msgs below
    throw new Error('Cursors should not be written to directly, use update instead')
  },
  deleteProperty() {
    throw new Error('Cursors should not be written to directly, use update instead')
  },
  defineProperty() {
    throw new Error('Cursors should not be written to directly, use update instead')
  },
  setPrototypeOf() {
    throw new Error('Not supported')
  },
  apply() {
    throw new Error('Not supported')
  },
  construct() {
    throw new Error('Not supported')
  }
}
