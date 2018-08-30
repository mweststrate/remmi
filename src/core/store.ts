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
                let i = 0
                let gotException = true
                try {
                    // propagate updates
                    for (i = 0; i < derivations.length; i++)
                        derivations[i].propagateReady(true)
                    gotException = false
                } finally {
                    // no catch to preserve stack
                    if (gotException) {
                        // got exception during update, roll back!
                        this.state = baseState
                        // propgate old change, again
                        for (let j = 0; j <= i; j++) {
                            derivations[j].propagateChanged()
                            derivations[j].propagateReady(true) // due to revert, old state is 'new'
                        }
                        for (let j = i + 1; j < derivations.length; j++)
                            derivations[j].propagateReady(false) // no change for them
                    }
                }
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
