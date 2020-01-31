type Thunk = () => void
const STATE = Symbol("rememo")

let currentlyTracking: TrackingState | undefined = undefined

class DataSource<T> {
    root: LensState

    constructor(initial: T) {
        this.root = createProxy(initial)
    }

    get(): T {
        return this.root.read()
    }

    set(next: T) {}
}

class LensState {
  // optimizable
    subscribers = new Set<TrackingState>()
    children = new Map<PropertyKey, LensState>()
    base: any
    proxy!: any
    isRef: boolean

    constructor(base) {
        this.isRef = handleAsReference(base)
        this.base = base
    }

    read(grab?: boolean) {
        // we always return the proxy (the lens), unless the value is primitive
        if (this.isRef || grab) {
            if (currentlyTracking) {
                currentlyTracking.dependencies.add(this)
            }
            return this.base
        } else {
            return this.proxy
        }
    }

    notifyChanged() {
        this.subscribers.splice(0).forEach(ts => ts.notifyDirty())
    }
}

function createProxy(
    value: any,
    parent?: LensState,
    prop?: PropertyKey
): LensState {
    // TODO: wrap another time or return value[STATE]?
    // if (isLens(value)) return value;
    const lensstate = new LensState(value)
    const proxy = new Proxy(lensstate, handlers)
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

    notifyDirty() {
        this.subscribers.splice(0).forEach(f => f())
    }
}

export function track(
    base: any,
    fn: (value, grab) => any,
    autoGrab = false
): {value: any; trackingState: TrackingState} {
    if (handleAsReference(base))
        throw new Error("Root should be immutable data structure")
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

function current(lens) {
    if (!isLens(lens)) throw new Error("Expected lens")
    const lensState: LensState = lens[STATE]
    return lensState.read(true)
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
    if (!value || typeof value !== "object") return true
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
          state.children.get(prop) ||
          createProxy(state.base[prop], state, prop)
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
      throw new Error("Lenses should not be written to")
  },
  deleteProperty() {
      throw new Error("Lenses should not be written to")
  },
  defineProperty() {
      throw new Error("Lenses should not be written to")
  },
  setPrototypeOf() {
      throw new Error("Not supported")
  },
  apply() {
      throw new Error("Not supported")
  },
  construct() {
      throw new Error("Not supported")
  }
}
