import {__extends, iteratorSymbol, setsAreEqual} from '../utils'
import {CursorState, STATE, createProxy, KEYS, TrackingState, isCursor} from '../magic'

export function createSet(cursorstate: CursorState) {
  // @ts-ignore
  return new DraftSet(cursorstate)
}

const SET_SIZE = Symbol("remmi-set-size")

let setChangeCounter = 0;

export function reconcileSet(cursorState: CursorState, newValue: Set<any>, oldValue: Set< any>, pending: Set<TrackingState>) {
  if (setsAreEqual(newValue, oldValue)) {
    return;
  }
  cursorState.children.forEach((_, child: CursorState) => {
    if (!newValue.has(child.base))
      cursorState.clearChild(child.base, pending)
  })
  // a different set always triggers the 'key collection'
  // TODO: introduce the concept of atoms, as subset of CursorState without children/proxy
  cursorState.children.get(KEYS)!.update(++setChangeCounter, pending)
  cursorState.children.get(SET_SIZE)?.update(newValue.size, pending);
}

// TODO: RENAME
const DraftSet = (function(_super) {
  if (!_super) {
    /* istanbul ignore next */
    throw new Error('Set is not polyfilled')
  }
  __extends(DraftSet, _super)
  // Create class manually, cause #502
  function DraftSet(this: any, cursorState: CursorState): any {
    this[STATE] = cursorState
    createProxy(setChangeCounter, cursorState, KEYS)
    return this
  }
  const p = DraftSet.prototype

  // TODO: rename & lift
  p._keys = function() {
    this[STATE].children.get(KEYS).read()
  }

  p._toCursor = function(baseValue) {
    // returns a lens for an entry
    if (isCursor(baseValue)) throw new Error("oops"); // TODO:
    const state: CursorState = this[STATE]
    // TODO: getOrCreateProxy should be an utility
    const child =
      state.children.get(baseValue) ||
      createProxy(baseValue, state, baseValue)
    return child
  }

  p.has = function(key: any): any {
    // TODO: accept lens?
    const state: CursorState = this[STATE]
    this._keys(); // optimize: use a hasMap?
    return state.base.has(key)
  }

  p[Symbol.iterator] = p.keys = p.values = function(): IterableIterator<any> {
    // TODO: indeed not needed? this._keys()
    const internalIt = this[STATE].base.values()
    return {
      [iteratorSymbol]: () => this.values(),
      next: () => {
        const r = internalIt.next()
        if (r.done) return r;
        const value = this._toCursor(r.value).read()
        return {
          done: false,
          value
        }
      }
    } as any
  }
  
  p.entries = function(): IterableIterator<[any, any]> {
    const internalIt = this.values()
    return {
      [iteratorSymbol]: () => this.entries(),
      next: () => {
        const r = internalIt.next()
        if (r.done) return r;
        return {
          done: false,
          value: [r.value, r.value]
        }
      }
    } as any
  }

  p.forEach = function(cb: (value: any, key: any, self: any) => void, thisArg?: any) {
    Array.from(this.values()).forEach(v => {
      cb.call(thisArg, v, v, this);
    })
  }
  
  // TODO: smaller build size if we create a util for Object.defineProperty
  Object.defineProperty(p, 'size', {
    get: function() {
      // TODO: reuse utility
      const child =
        this[STATE].children.get(SET_SIZE) ||
        createProxy(this[STATE].base.size, this[STATE], SET_SIZE)
      return child.read()
    },
    enumerable: true,
    configurable: true
  })

  p.add = p.delete = p.clear = function(key: any, value: any) {
    // TODO: reuse the generic one
    throw new Error('Cannot modify cursors')
  }

  return DraftSet
})(Set)
