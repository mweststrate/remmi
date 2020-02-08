import {CursorState, createProxy, KEYS, STATE, TrackingState} from '../magic'
import {objectTraps} from './object'

export function createArrayProxy(cursorstate: CursorState) {
  return new Proxy([cursorstate], arrayTraps)
}

export function reconcileArray(cursorState: CursorState, newValue: any, oldValue: any, pending: Set<TrackingState>) {
  const common = Math.min(newValue.length, oldValue.length)
  for (let i = 0; i < common; i++) {
    cursorState.children.get('' + i)?.update(newValue[i], pending)
  }
  for (let i = common; i < oldValue.length; i++) {
    cursorState.clearChild('' + i, pending)
  }
  cursorState.children.get('length')?.update(newValue.length, pending)
}

const arrayTraps: ProxyHandler<any> = {
  ...objectTraps,
  get(target: CursorState[], prop) {
    const state = target[0]
    if (prop === STATE) return state
    const child =
      state.children.get(prop) ||
      createProxy(prop === KEYS ? Reflect.ownKeys(state.base) : state.base[prop], state, prop)
    return child.read()
  },
  getPrototypeOf(target) {
    return Reflect.getPrototypeOf(target[0].base)
  },
  isExtensible(target) {
    return Reflect.isExtensible(target[0].base)
  },
  preventExtensions(target) {
    return Reflect.preventExtensions(target[0].base)
  },
  getOwnPropertyDescriptor(target, p) {
    return Reflect.getOwnPropertyDescriptor(target[0].base, p)
  },
  has(target, p: PropertyKey) {
    return Reflect.has(target[0].base, p)
  },
  ownKeys(target) {
    return target[0].proxy[KEYS]
  }
}
