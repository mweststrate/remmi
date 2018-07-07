import { Lens, Merge, shallowEqual, noop, Disposer } from "./internal";

const readListeners = new Set<(lens: Lens) => void>()

export function notifyRead(lens: Lens) {
    readListeners.forEach(h => h(lens)) // optimize
}

export class Tracker {
    merge: Merge = new Merge([])
    mergeSub: Disposer = this.merge.subscribe(noop)

    constructor(private onInvalidate: () => void) {

    }

    public track<T>(fn: () => T): T {
        const dependencies = new Set<Lens>()
        const readListener = dependencies.add.bind(dependencies)
        readListeners.add(readListener)
        try {
            return fn()
        } finally {
            const newDeps = Array.from(dependencies)
            if (!shallowEqual(newDeps, this.merge.bases)) {
                const { mergeSub } = this
                // optimization; don't create merge if only one dep
                this.merge = new Merge(newDeps as any) // TODO: fix typings
                this.mergeSub = this.merge.subscribe(this.onInvalidate)
                mergeSub()
            }
            readListeners.delete(readListener)
        }
    }

    public dispose() {
        this.mergeSub()
    }
}

export function autorun(fn: () => void): Disposer {
    const t = new Tracker(() => {
        t.track(fn)
    })
    const res = t.dispose.bind(t)
    t.track(fn)
    return res
}