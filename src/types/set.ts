import {__extends, iteratorSymbol, setsAreEqual} from '../utils'
import {CursorState, STATE, createProxy, TrackingState, isCursor} from '../magic'
import { reconcileArray } from './array';

export function createSet(cursorstate: CursorState) {
  // @ts-ignore
  return new DraftSet(cursorstate)
}

let setChangeCounter = 0;

export function reconcileSet(cursorState: CursorState, newValue: Set<any>, oldValue: Set< any>, pending: Set<TrackingState>) {
  if (setsAreEqual(newValue, oldValue)) {
    return;
  }
  reconcileArray(cursorState, Array.from(newValue), Array.from(oldValue), pending)
  // a different set always triggers the 'key collection'
  // TODO: introduce the concept of atoms, as subset of CursorState without children/proxy
  cursorState.children.get(ANY_SET_CHANGE)!.update(++setChangeCounter, pending)
  // cursorState.children.get(SET_SIZE)?.update(newValue.size, pending);
}

const ANY_SET_CHANGE = Symbol("remmi-any-set-change");

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
    // TODO: should use an atom abstraction
    // optimization: create lazily, like size and the others
    createProxy(setChangeCounter, cursorState, ANY_SET_CHANGE)
    return this
  }
  const p = DraftSet.prototype

  // TODO: rename & lift
  p._keys = function() {
    this[STATE].children.get(ANY_SET_CHANGE)!.read()
  }

  p._toCursor = function(idx: number, baseValue) {
    // returns a lens for an entry
    if (isCursor(baseValue)) throw new Error("oops"); // TODO:
    const state: CursorState = this[STATE]
    // TODO: getOrCreateProxy should be an utility
    const child =
      state.children.get('' + idx) ||
      createProxy(baseValue, state, '' + idx)
    return child
  }

  p.has = function(key: any): any {
    // TODO: accept lens as key?
    this._keys(); // optimize: use a hasMap?
    return this[STATE].base.has(key)
  }

  // TODO: one could argue that .keys() is different, and that it should return non-lensed values!
  p[Symbol.iterator] = p.keys = p.values = function(): IterableIterator<any> {
    const internalIt = this[STATE].base.values()
    let idx = 0;
    return {
      [iteratorSymbol]: () => this.values(),
      next: () => {
        const r = internalIt.next()
        if (r.done) return r;
        const value = this._toCursor(idx++, r.value).read()
        return {
          done: false,
          value
        }
      }
    } as any
  }
  
  // TODO one could argue that the entries are actual key => value, that is base => cursor
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
    // TODO: see question above, use entries() and pass k,v?
    Array.from(this.values()).forEach(v => {
      cb.call(thisArg, v, v, this);
    })
  }
  
  // TODO: smaller build size if we create a util for Object.defineProperty
  Object.defineProperty(p, 'size', {
    get: function() {
      // TODO: reuse utility
      const child =
        this[STATE].children.get('length') || // 'length' is supported by the array reconciler used for sets
        createProxy(this[STATE].base.size, this[STATE], 'length')
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
