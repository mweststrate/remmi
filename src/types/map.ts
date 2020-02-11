import {__extends, iteratorSymbol} from '../utils'
import {CursorState, STATE, createProxy, KEYS, TrackingState} from '../magic'

export function createMap(cursorstate: CursorState) {
  // @ts-ignore
  return new DraftMap(cursorstate)
}

export function reconcileMap(
  cursorState: CursorState,
  newValue: Map<any, any>,
  oldValue: Map<any, any>,
  pending: Set<TrackingState>
) {
  const keys = new Set(newValue.keys())
  cursorState.children.forEach((child: CursorState, prop) => {
    if (prop === KEYS) {
      // TODO: first check if the set changed!
      child.update(keys, pending)
    } else if (!keys.has(prop)) {
      cursorState.clearChild(prop, pending)
    } else {
      child.update(newValue.get(prop), pending)
    }
  })
}

// TODO: RENAME
const DraftMap = (function(_super) {
  if (!_super) {
    /* istanbul ignore next */
    throw new Error('Map is not polyfilled')
  }
  __extends(DraftMap, _super)
  // Create class manually, cause #502
  function DraftMap(this: any, cursorState: CursorState): any {
    this[STATE] = cursorState
    return this
  }
  const p = DraftMap.prototype

  p.get = function(key: any): any {
    // TODO: accept lens?
    const state: CursorState = this[STATE]
    const child = state.children.get(key) || createProxy(state.base.get(key), state, key)
    return child.read()
  }

  // TODO: rename and lift
  p._keys = function(): Set<any> {
    const state: CursorState = this[STATE]
    const child = state.children.get(KEYS) || createProxy(new Set(state.base.keys()), state, KEYS)
    return child.read()
  }

  p.keys = function(): IterableIterator<any> {
    return this._keys()
  }

  p.has = function(key: any): boolean {
    // TODO: accept lens?
    return this._keys().has(key)
  }

  // TODO: smaller build size if we create a util for Object.defineProperty
  Object.defineProperty(p, 'size', {
    get: function() {
      return this._keys().size
    },
    enumerable: true,
    configurable: true
  })

  p.forEach = function(cb: (value: any, key: any, self: any) => void, thisArg?: any) {
    this._keys().forEach(key => {
      cb.call(thisArg, this.get(key), key, this)
    })
  }

  // TODO: or create fresh iterators
  p.values = function(): IterableIterator<any> {
    const internalIt = this._keys().values()
    return {
      [iteratorSymbol]: () => this.values(),
      next: () => {
        const r = internalIt.next()
        if (r.done) return r;
        return {
          done: false,
          value: this.get(r.value)
        }
      }
    } as any
  }

  p[iteratorSymbol] = p.entries = function(): IterableIterator<[any, any]> {
    const internalIt = this._keys().values()
    return {
      [iteratorSymbol]: () => this.entries(),
      next: () => {
        const r = internalIt.next()
        if (r.done) return r;
        return {
          done: false,
          value: [r.value, this.get(r.value)]
        }
      }
    } as any
  }

  p.set = p.delete = p.clear = function(key: any, value: any) {
    // TODO: reuse the generic one
    throw new Error('Cannot modify cursors')
  }

  return DraftMap
})(Map)
