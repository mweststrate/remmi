import {
    fail,
    Lens,
    Handler,
    Disposer,
    notifyRead,
    once,
    select
} from "../internal"

let lensId = 0;

export abstract class BaseLens<T = any> implements Lens<T> {
    readonly selectorCache = new Map<any, BaseLens>()

    // optimization: initialize fields as empty
    // optimization: no forEach
    readonly subscriptions: Handler<T>[] = []
    readonly derivations: BaseLens[] = []
    readonly parents: BaseLens[] = []
    changedDerivations?: BaseLens[]

    lensId = ++lensId
    dirty = 0
    changedParents = 0
    state?: T

    propagateChanged() {
        if (++this.dirty === 1) {
            this.changedDerivations = this.derivations.slice()
            this.changedDerivations.forEach(d => d.propagateChanged())
        }
    }

    propagateReady(changed: boolean) {
        if (changed) this.changedParents++
        if (this.dirty > 0 && --this.dirty === 0) {
            if (this.changedParents) {
                this.changedParents = 0
                const old = this.state
                this.state = this.recompute()
                if (this.state !== old) {
                    notify(this.subscriptions, this.state)
                    this.changedDerivations!.forEach(d => d.propagateReady(true))
                    return
                }
            }
            this.changedDerivations!.forEach(d => d.propagateReady(false))
            this.changedDerivations = undefined
        }
    }

    protected get hot() {
        return this.subscriptions.length || this.derivations.length
    }

    value() {
        const res = this.hot ? this.state! : this.recompute()
        notifyRead(this)
        return res
    }

    subscribe(handler: Handler<T>) {
        if (!this.hot) {
            // this.state = this.recompute() // TODO: do this lazily?
            this.resume()
        }
        const disposer = subscribe(this.subscriptions, handler)
        return once(() => { // optimize: shouldn't need additional closure
            disposer()
            if (!this.hot) {
                this.state = undefined // prevent leaking mem
                this.suspend()
            }
        })
    }

    registerDerivation(lens: BaseLens) {
        if (!this.hot) {
            // this.state = this.recompute() // TODO: do this lazily?
            this.resume()
        }
        this.derivations.push(lens)
        const cacheKey = lens.getCacheKey()
        if (cacheKey !== undefined) {
            // not entirely happy on only caching selectors as long as the lens is hot,
            // but without a map of weak references we can otherwise not prevent leaking memory...
            this.selectorCache.set(cacheKey, lens)
        }
    }

    removeDerivation(lens: BaseLens) {
        const idx = this.derivations.indexOf(lens)
        if (idx === -1) fail("Illegal state") // todo fail
        this.derivations.splice(idx, 1)
        const cacheKey = lens.getCacheKey()
        if (cacheKey !== undefined)
            this.selectorCache.delete(cacheKey)
        if (!this.hot) {
            this.state = undefined // prevent leaking mem
            this.suspend()
        }
    }

    view(...things: any[]): any {
        // TODO: put read / write from cache here?
        return things.reduce((acc, factory) => {
            if (factory.isBuilder === true)
                return factory(acc)
            // TOOO: better split out?
            if (typeof factory === "string" || typeof factory === "number" || typeof factory === "function")
                return select(factory)(acc) // optimize, just the select creator function directly
            fail("Not a valid view or view factory: " + factory)
        }, this)
    }

    toString() {
        return `Lens[${this.describe()}]`
    }

    abstract recompute(): T;

    abstract resume(): void;

    abstract suspend(): void;

    abstract update(producer: ((draft: T) => void)): void

    // TODO: should be static
    abstract getCacheKey(): any;

    abstract describe(): string
}


function notify(subscriptions: Handler[], value: any) {
    subscriptions.forEach(f => f(value)) // optimize
}

function subscribe(subscriptions: Handler[], handler: Handler): Disposer {
    subscriptions.push(handler)
    return () => {
        const idx = subscriptions.indexOf(handler)
        if (idx !== -1) subscriptions.splice(idx, 1)
    }
}

export function isLens(thing: any): thing is Lens {
    return thing instanceof BaseLens
}
