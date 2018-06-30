import { fail, noop } from "../utils"
import produce from "immer"

import { BaseLens } from "./BaseLens";

export class Store<T = any> extends BaseLens<T> {
    private currentDraft?: T

    constructor(initialValue: T) {
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
        this.propagateChanged()
        const currentState = this.state
        try {
            this.state = produce(this.state, draft => {
                // optimize
                this.currentDraft = draft
                return updater(draft)
            })
        } finally {
            this.currentDraft = undefined
            this.propagateReady()
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
}
