import {__extends, iteratorSymbol} from '../utils'
import {CursorState, STATE, createProxy, KEYS, TrackingState} from '../magic'

export function createMap(cursorstate: CursorState) {
  // @ts-ignore
  return new DraftMap(cursorstate)
}

export function reconcileMap(cursorState: CursorState, newValue: Map<any, any>, oldValue: Map<any, any>, pending: Set<TrackingState>) {
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
    const child =
      state.children.get(key) ||
      createProxy(key === KEYS ? new Set(state.base.keys()) : state.base.get(key), state, key)
    return child.read()
  }

  // TODO: rename and lift
  p._keys = function(): Set<any> {
    return this.get(KEYS)
  }

  p.keys = function(): IterableIterator<any> {
    this._keys()
    return this[STATE].base.keys()
  }

  p.has = function(key: any): boolean {
    // TODO: accept lens?
    return this._keys().has(key) // optimization: keep a separate has map
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
    // TODO: fix, no map
    return this._keys().map(key => this.get(key))[iteratorSymbol]
  }

  p.entries = function(): IterableIterator<[any, any]> {
    // TODO: fix, no map
    return this._keys().map(key => [key, this.get(key)])[iteratorSymbol]
  }

  p[iteratorSymbol] = function() {
    return this.entries()
  }

  p.set = p.delete = p.clear = function(key: any, value: any) {
    // TODO: reuse the generic one
    throw new Error('Cannot modify cursors')
  }

  return DraftMap
})(Map)
