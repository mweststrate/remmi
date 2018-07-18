import produce from "immer"

import { fail, noop, BaseLens } from "../internal"

export class Store<T = any> extends BaseLens<T> {
    private currentDraft?: T

    constructor(initialValue: T, private name: string) {
        super()
        this.state = initialValue
        this.subscribe(noop) // stores are always kept alive
    }

    update(updater: ((draft: T) => T | void)) {
        if (this.currentDraft) {
            // update call from an update call (for example caused by merge)
            // just reuse the current draft
            updater(this.currentDraft)
            return
        }
        try {
            const baseState = this.state
            this.state = produce(this.state, draft => {
                // optimize
                this.currentDraft = draft
                const res = updater(draft)
                if (res !== undefined) // TODO: or just ignore?
                    fail("Updater function should not return anything")
            })
            if (this.state !== baseState) {
                // skip default implementation
                const derivations = this.derivations.slice()
                derivations.forEach(d => d.propagateChanged())
                derivations.forEach(d => d.propagateReady(true))
            }
        } finally {
            this.currentDraft = undefined
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
