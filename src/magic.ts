type Thunk = () => void
const STATE = Symbol('rememo')

let currentlyTracking: TrackingState | undefined = undefined

class DataSource<T> {
  readonly root: LensState

  constructor(initial: T) {
    this.root = createProxy(initial)
  }

  get(): T {
    return this.root.read()
  }

  set(next: T) {
    // optimization: if we now the max set of tracking states, we
    // could maybe stop diffing if we saw them all?
    const pendingUpdates = new Set<TrackingState>()
    this.root.update(next, pendingUpdates)
    pendingUpdates.forEach(tracker => {
      tracker.notifyChanged()
    })
  }
}

class LensState {
  // optmization: create lazily
  readonly subscribers = new Set<TrackingState>()
  readonly children = new Map<PropertyKey, LensState>()
  base: any
  readonly proxy!: any
  isRef: boolean

  constructor(base) {
    this.isRef = handleAsReference(base)
    this.base = base
  }

  read(grab?: boolean) {
    // we always return the proxy (the lens), unless the value is primitive
    if (this.isRef || grab) {
      if (currentlyTracking) {
        this.subscribers.add(currentlyTracking)
        currentlyTracking.dependencies.add(this)
      }
      return this.base
    } else {
      return this.proxy
    }
  }

  update(newValue, pending: Set<TrackingState>, _markForRemoval?: boolean) {
    // TODO: if _markForRemoval this means that we can safely dispose this lens
    if (newValue === this.base) {
      return
    }
    const wasArray = Array.isArray(this.base)
    const wasRef = this.isRef
    const oldValue = this.base
    this.base = newValue
    const isRef = (this.isRef = handleAsReference(newValue))
    if (wasRef && !isRef) {
      this.clearAllChildren(pending)
    } else if (wasRef && this.isRef) {
      // TODO: support map and set as well
      const isArray = Array.isArray(newValue)
      if (isArray !== wasArray) {
        // dont recurse if we had a completely different type of data structure
        this.clearAllChildren(pending)
      } else {
        if (isArray) {
          const common = Math.min(newValue.length, oldValue.length)
          for (let i = 0; i < common; i++) {
            this.children.get('' + i).update(newValue[i], pending)
          }
          for (let i = common; i < oldValue.length; i++) {
            this.clearChild('' + i, pending)
          }
        } else {
          const newKeys = new Set<PropertyKey>(Object.keys(newValue))
          this.children.forEach((child: LensState, prop) => {
            if (!newKeys.has(prop)) {
              this.clearChild(prop, pending)
            } else {
              child.update(newValue[prop], pending)
            }
          })
        }
      }
    }
    // any previous subscribers are to be updated
    this.subscribers.forEach(tracker => pending.add(tracker)) // optimization: extract closure
    this.subscribers.clear()
  }

  clearChild(key: PropertyKey, pending: Set<TrackingState>) {
    this.children.get(key)!.update(undefined, pending)
    this.children.delete(key) // TODO: this should be safe, right?!
  }

  clearAllChildren(pending: Set<TrackingState>) {
    if (!this.children.size) return
    this.children.forEach(lens => {
      lens.update(undefined, pending) // optimize, extract closure?
    })
    this.children.clear()
  }
}

function createProxy(
  value: any,
  parent?: LensState,
  prop?: PropertyKey
): LensState {
  const lensstate = new LensState(value)
  const proxy = new Proxy(lensstate, handlers)
  // @ts-ignore
  lensstate.proxy = proxy
  if (parent) {
    parent.children.set(prop, lensstate)
  }
  return lensstate
}

export function isLens(thing): thing is {[STATE]: LensState} {
  return thing && thing[STATE] ? true : false
}

class TrackingState {
  dependencies = new Set<LensState>()
  subscribers: Thunk[] = []

  notifyChanged() {
    this.subscribers.splice(0).forEach(f => f())
  }

  dispose() {
    this.subscribers.splice(0)
    this.dependencies.forEach(lens => lens.subscribers.delete(this))
  }
}

export function track(
  base: any,
  fn: (value, grab) => any,
  autoGrab = false
): {value: any; trackingState: TrackingState} {
  if (handleAsReference(base))
    throw new Error('Root should be immutable data structure')
  try {
    currentlyTracking = new TrackingState()

    const proxied = proxyValue(base, undefined, undefined)

    let res = fn(proxied, grab)
    // TODO:    if (autoGrab) res = autoGrabber(res, grab)
    return {value: res, trackingState: currentlyTracking}
  } finally {
    currentlyTracking = undefined
  }
}

export function current(lens) {
  if (!isLens(lens)) throw new Error('Expected lens')
  const lensState: LensState = lens[STATE]
  return lensState.read(true) // TODO: should apply current to the result if lens?
}

function autoGrabber(base, grab) {
  // TODO: avoid the need on grab, pick it globally?
  if (handleAsReference(base)) return base
  if (isLens(base)) return grab(base)
  // TODO: map and set
  if (Array.isArray(base)) {
    for (let i = 0; i < base.length; i++) {
      const value = base[i]
      if (isLens(value)) base[i] = grab(value)
      else autoGrabber(value, grab) // recurse
    }
  } else {
    for (const i in base) {
      // TODO: dedupe
      const value = base[i]
      if (isLens(value)) base[i] = grab(value)
      else autoGrabber(value, grab) // recurse
    }
  }
  return base
}

function handleAsReference(value: any): boolean {
  if (!value || typeof value !== 'object') return true
  if (isLens(value)) return true
  if (Array.isArray(value) || value instanceof Map || value instanceof Set)
    return false
  const proto = Object.getPrototypeOf(value)
  if (proto === null || proto === Object.prototype) return false
  return true
}

const handlers: ProxyHandler<any> = {
  get(state: LensState, prop) {
    if (prop === STATE) return state
    // TODO: if we support ES5, we should warn if trying to read a non-existing property!
    const child =
      state.children.get(prop) || createProxy(state.base[prop], state, prop)
    return child.read()
  },
  getPrototypeOf(target) {
    return Reflect.getPrototypeOf(target)
  },
  isExtensible(target) {
    return Reflect.isExtensible(target)
  },
  preventExtensions(target) {
    return Reflect.preventExtensions(target)
  },
  getOwnPropertyDescriptor(target, p) {
    return Reflect.getOwnPropertyDescriptor(target, p)
  },
  has(target, p: PropertyKey) {
    return Reflect.has(target, p)
  },
  enumerate(target) {
    return Reflect.enumerate(target) as any
  },
  ownKeys(target) {
    return Reflect.ownKeys(target)
  },
  set() {
    // TODO: dedupe error msgs below
    throw new Error('Lenses should not be written to')
  },
  deleteProperty() {
    throw new Error('Lenses should not be written to')
  },
  defineProperty() {
    throw new Error('Lenses should not be written to')
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
