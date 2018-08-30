import {
    fail,
    Lens,
    Handler,
    notifyRead,
    once,
    TransformConfig,
    Pipe,
    subscribe,
    notify,
    isLens,
    KeyedLens,
    select
} from "../internal"

let lensId = 0

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
                    this.changedDerivations!.forEach(d =>
                        d.propagateReady(true)
                    )
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
            this.resume()
        }
        const disposer = subscribe(this.subscriptions, handler)
        return once(() => {
            // optimize: shouldn't need additional closure
            disposer()
            if (!this.hot) {
                this.state = undefined // prevent leaking mem
                this.suspend()
            }
        })
    }

    registerDerivation(lens: BaseLens) {
        if (!this.hot) {
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
        if (cacheKey !== undefined) this.selectorCache.delete(cacheKey)
        if (!this.hot) {
            this.state = undefined // prevent leaking mem
            this.suspend()
        }
    }

    do(...things: any[]): any {
        return things.reduce((acc, transformer, index) => {
            if (!isLens(acc))
                return fail(
                    `The transformer at argument ${index -
                        1} of '.do()' should produce a lens, but it returned a: (${typeof acc}) '${acc}`
                )
            // So, this is ok even if acc is not a lens anymore, just becomes a general chain...
            if (typeof transformer !== "function")
                return fail(
                    `Not a valid transformer at argument ${index} of '.do()', got: (${typeof transformer}) '${transformer}'`
                )
            return transformer(acc)
        }, this)
    }

    toString() {
        return `Lens[${this.describe()}\n]`
    }

    transform<R>(config: Partial<TransformConfig<T, R>>): Lens<R> {
        if (
            config.cacheKey !== undefined &&
            this.selectorCache.has(config.cacheKey)
        )
            return this.selectorCache.get(config.cacheKey)!
        return new Pipe(this, config)
    }

    select(...args: any[]): KeyedLens<any> {
        return this.do(...args.map(select))
    }

    abstract recompute(): T

    abstract resume(): void

    abstract suspend(): void

    abstract update(producer: ((draft: T) => void)): void

    abstract getCacheKey(): any

    abstract describe(): string
}
