import produce from "immer"

import {
    fail,
    noop,
    BaseLens,
    isFn,
    Lens,
    normalizeUpdater,
    avoidReturns
} from "../internal"

export interface StoreOptions {
    name?: string
}

let storeId = 0

class Store<T> extends BaseLens<T> {
    state: T
    private currentDraft?: T
    private isRunningUpdate = false
    private name: string

    constructor(initialValue: T, options?: StoreOptions) {
        super()
        this.name = options && options.name ? options.name : "Store" + ++storeId
        this.state = initialValue
        this.subscribe(noop) // stores are always kept alive
        Object.defineProperty(this, "currentDraft", {
            // keeps jest from dying on revoked proxies..
            enumerable: false,
            configurable: true,
            writable: true,
            value: undefined
        })
    }

    update(updater: any) {
        if (this.isRunningUpdate) {
            // update call from an update call (for example caused by merge)
            // just reuse the current draft
            if (!isFn(updater)) fail("Illegal state")
            else avoidReturns(this.currentDraft, updater(this.currentDraft!))
            return
        }
        try {
            const baseState = this.state
            this.state = produce(this.state, (draft: any) => {
                this.isRunningUpdate = true
                this.currentDraft = draft
                return normalizeUpdater(updater)(draft)
            })
            if (this.state !== baseState) {
                // skip default implementation
                const derivations = this.derivations.slice()
                derivations.forEach(d => d.propagateChanged())
                derivations.forEach(d => d.propagateReady(true))
            }
        } finally {
            this.currentDraft = undefined
            this.isRunningUpdate = false
        }
    }

    recompute(): T {
        return this.state!
    }

    resume() {
        // happens only once
    }

    suspend() {
        fail("nope")
    }

    getCacheKey() {
        fail("nope")
    }

    describe() {
        return this.name
    }
}

export function createStore<T>(
    initialValue: T,
    options?: StoreOptions
): Lens<T> {
    return new Store(initialValue, options)
}
