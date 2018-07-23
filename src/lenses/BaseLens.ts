import {
    fail,
    Select,
    SelectField,
    ReadOnly,
    Recorder,
    createStore,
    All,
    Lens,
    Handler,
    Disposer,
    Selector,
    notifyRead,
    once,
    ShallowEqual,
    emptyArray,
    defaultLog,
    Log,
    RenderLens,
    RenderLenses,
    IModelDefinition,
    Model
} from "../internal"
import { ILogger } from "./Log";
import * as React from "react";

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
    state: T

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
        // if (this.dirty < 0) {
        //     fail("illegal state")
        // }
    }

    protected get hot() {
        return this.subscriptions.length || this.derivations.length
    }

    value() {
        const res = this.hot ? this.state : this.recompute()
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

    build(...things: any[]): any {
        return things.reduce((acc, factory) => {
            return factory(acc)
        }, this)
    }

    toString() {
        return `Lens[${this.describe()}]`
    }

    abstract recompute(): T;

    abstract resume();

    abstract suspend();

    abstract update(producer: ((draft: T) => void)): void

    abstract getCacheKey(): any;

    abstract describe(): string

    readOnly() {
        return new ReadOnly(this)
    }

    shallowEqual() {
        return new ShallowEqual(this)
    }

    fork(recordActions: true): Recorder<T>
    fork(recordActions?: boolean): Lens<T>
    fork(recordActions = false) {
        const fork = createStore(this.value())
        if (recordActions)
            return new Recorder(fork)
        return fork
    }

    keys() {
        // TODO: from cache
        return this.select(keySelector).shallowEqual()
    }

    all() { // TODO: type
        // TODO: from cache
        return new All(this)
    }

    model(modelDefinition: IModelDefinition) { // TODO: type
        // TODO: from cache
        return new Model(this, modelDefinition)
    }

    tap(logger: ILogger = defaultLog) {
        // TODO: from cache
        return new Log(this, logger)
    }

    // TODO: should accept oroginal lens as argument
    render(renderer: (value: T) => React.ReactNode): React.ReactElement<any> {
        return React.createElement(RenderLens, {
            lens: this,
            renderer
        })
    }

    // TODO: should accept key as argument?
    renderAll(renderer: (value: T) => React.ReactNode) {
        return React.createElement(RenderLenses, {
            lens: this,
            renderer
        })
    )
}

function keySelector(value: any): (number | string)[] {
    if (Array.isArray(value))
        return value.map((_v, idx) => idx) // optimize!
    if (value !== null && typeof value === "object")
        return Object.keys(value)
    return emptyArray
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
