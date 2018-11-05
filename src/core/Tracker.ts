import {
    merge,
    Cursor,
    Merge,
    _shallowEqual,
    noop,
    Disposer,
    createStore
} from "../internal"

let readListener: undefined | ((lens: Cursor) => void)

export function notifyRead(lens: Cursor) {
    if (readListener) readListener(lens) // optimize
}

export class Tracker {
    merge: Cursor<any> = new Merge([])
    disposeMerge: Disposer = this.merge.subscribe(noop)

    constructor(private onInvalidate: () => void) {}

    public track<T>(fn: () => T): T {
        const dependencies = new Set<Cursor>()
        const prevListener = readListener
        readListener = dependencies.add.bind(dependencies)
        try {
            return fn()
        } finally {
            const newDeps = Array.from(dependencies)
            if (!_shallowEqual(newDeps, this.getDependencies())) {
                // don't create merge if only one dep
                const nextMerge: Cursor<any> =
                    newDeps.length === 0
                        ? (console.warn(
                              "[immer] The Tracker did not use any lenses"
                          ),
                          createStore(undefined))
                        : newDeps.length === 1 ? newDeps[0] : merge(...newDeps)
                if (nextMerge !== this.merge) {
                    const {disposeMerge} = this
                    this.merge = nextMerge
                    this.disposeMerge = this.merge.subscribe(this.onInvalidate)
                    disposeMerge()
                }
            }
            readListener = prevListener
        }
    }

    public dispose() {
        this.disposeMerge()
    }

    public getDependencies(): Cursor[] {
        return this.merge instanceof Merge ? this.merge.bases : [this.merge]
    }
}

/**
 * autorun takes a function, will run it once, and then will re-run every time that a cursor
 * that was dereferenced (using `.value()`) in the function changes. In other words,
 * it is basically an automatic `merge` + `subscribe` of cursors.
 *
 * Autorun is able to handle dynamically changing dependencies, that is, the set of cursors used is allowed to vary over time.
 *
 * @example
 * const myAge = createStore(20)
 * const yourAge = createStore(30)
 * autorun(() => {
 *   const avg = (myAge.value() + yourAge.value()) / 2
 *   console.log("Our average age is now: " + avg)
 * })
 * // prints 25
 * myAge.update(40)
 * // prints 35
 *
 * @export
 * @param {() => void} fn
 * @returns {Disposer}
 */
export function autorun(fn: () => void): Disposer {
    const t = new Tracker(() => {
        t.track(fn)
    })
    const res = t.dispose.bind(t)
    t.track(fn)
    return res
}
