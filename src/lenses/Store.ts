import produce from "immer"

import { fail, noop, BaseLens, isFn,  validateUpdater, runUpdater, updaterNeedsReassignment } from "../internal"

 export class Store<T = any> extends BaseLens<T> {
    private currentDraft?: T
    private isRunningUpdate = false

    constructor(initialValue: T, private name: string) {
        super()
        this.state = initialValue
        this.subscribe(noop) // stores are always kept alive
    }

    update(updater: ((draft: T) => T | void)) {
        if (this.isRunningUpdate) {
            validateUpdater(this.currentDraft, updater, false)
            // update call from an update call (for example caused by merge)
            // just reuse the current draft
            if (!isFn(updater))
                fail("Unimplemented feature")
            updater(this.currentDraft)
            return
        }
        try {
            const baseState = this.state
            validateUpdater(baseState, updater, true)
            if (updaterNeedsReassignment(baseState, updater))
                this.state = updater
            else
                this.state = produce(this.state, draft => {
                    this.isRunningUpdate = true
                    this.currentDraft = draft
                    runUpdater(draft, updater)
                })
            } finally {
                this.currentDraft = undefined
                this.isRunningUpdate = false
            }
            if (this.state !== baseState) {
                // skip default implementation
                const derivations = this.derivations.slice()
                derivations.forEach(d => d.propagateChanged())
                derivations.forEach(d => d.propagateReady(true))
            }
    }

    recompute(): T {
        return this.state
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
