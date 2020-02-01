type Thunk = () => void
const STATE = Symbol('rememo')
const KEYS = Symbol('rememo-keys')

let currentlyTracking: TrackingState | undefined = undefined

// TODO: change dataSource to be a Lens as well, and expose set / current as separate api's?
// TODO: create interface
export class DataSource<T=any> {
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

export function createStore<T>(initial: T): DataSource<T> {
  return new DataSource(initial)
  // TODO: or return dataSource.root, and expose a `set` api?
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
    if (!wasRef && isRef) {
      this.clearAllChildren(pending)
    } else if (!wasRef && !this.isRef) {
      // TODO: support map and set as well
      const isArray = Array.isArray(newValue)
      if (isArray !== wasArray) {
        // dont recurse if we had a completely different type of data structure
        this.clearAllChildren(pending)
      } else {
        if (isArray) {
          const common = Math.min(newValue.length, oldValue.length)
          for (let i = 0; i < common; i++) {
            this.children.get('' + i)!.update(newValue[i], pending)
          }
          for (let i = common; i < oldValue.length; i++) {
            this.clearChild('' + i, pending)
          }
          this.children.get('length')?.update(newValue.length, pending)
        } else {
          const keys = Reflect.ownKeys(newValue)
          const newKeysSet = new Set(keys)
          this.children.forEach((child: LensState, prop) => {
            if (prop === KEYS) {
              child.update(keys, pending)
            } else if (!newKeysSet.has(prop)) {
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
    parent.children.set(prop!, lensstate)
  }
  return lensstate
}

export function isLens(thing): thing is {[STATE]: LensState} {
  return thing && thing[STATE] ? true : false
}

export class TrackingState { // TODO: create interface
  readonly dependencies = new Set<LensState>()
  public changed = false
  onChange?: Thunk

  subscribe(onChange: Thunk): Thunk {
    if (this.onChange) throw new Error("onChange already set")
    this.onChange = onChange
    if (this.changed) this.notifyChanged() // changed before subscription happened, invalidate now
    return this.dispose
  }

  notifyChanged() {
    this.changed = true
    this.onChange?.()
    this.dispose()
  }

  dispose = () => {
    this.dependencies.forEach(lens => lens.subscribers.delete(this))
  }
}

export function track<T, R>(
  base: T,
  fn: (value: T) => R,
  autoGrab = false
): {result: R; trackingState: TrackingState} {
  try {
    currentlyTracking = new TrackingState()
    let result = fn(base)
    if (autoGrab) {
      result = autoGrabber(result)
    }
    return { result, trackingState: currentlyTracking}
  } finally {
    currentlyTracking = undefined
  }
}

export function current(lens) {
  if (!isLens(lens)) throw new Error('Expected lens')
  const lensState: LensState = lens[STATE]
  const res = lensState.read(true)
  if (isLens(res)) return current(res)
  return res
}

function autoGrabber(base) {
  if (isLens(base)) return current(base)
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
    return res;
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
      state.children.get(prop) || createProxy(prop === KEYS ? Reflect.ownKeys(state.base) : state.base[prop], state, prop)
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
