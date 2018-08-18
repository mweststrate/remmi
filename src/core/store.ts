import produce from "immer"

import {
    fail,
    noop,
    BaseLens,
    isFn,
    validateUpdater,
    runUpdater,
    updaterNeedsReassignment,
    Lens
} from "../internal"

class Store<T> extends BaseLens<T> {
    state: T
    private currentDraft?: T
    private isRunningUpdate = false

    constructor(initialValue: T, private name: string) {
        super()
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
            validateUpdater(this.currentDraft, updater, false)
            // update call from an update call (for example caused by merge)
            // just reuse the current draft
            if (!isFn(updater)) fail("Unimplemented feature")
            else updater(this.currentDraft!)
            return
        }
        try {
            const baseState = this.state
            validateUpdater(baseState, updater, true)
            if (updaterNeedsReassignment(baseState, updater))
                this.state = updater
            else {
                this.state = produce(this.state, (draft: T) => {
                    this.isRunningUpdate = true
                    this.currentDraft = draft
                    runUpdater(draft, updater)
                })
            }
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

let storeId = 0

// TODO: rename to store
export function createStore<T>(
    initialValue: T,
    name: string = "Store" + ++storeId
): Lens<T> {
    return new Store(initialValue, name)
}
