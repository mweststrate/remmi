import { BaseLens, Pipe, isObject, isFn, isArray, validateUpdater, updaterNeedsReassignment, runUpdater } from "../internal";


// Specialized version of select, that only selects a certain sub property
// saves a lot of closures during selection, and handles undefined values transparently
export class SelectField extends Pipe {
    constructor(base: BaseLens<any>, public key: string) {
        super(base)
    }

    recompute() {
        const base = this.base.value()
        if (base === null || base === undefined)
            return undefined
        if (typeof base === "object")
            return base[this.key]
        return fail(`Unexpected value for field selector '${this.key}': '${base}' (${typeof base})`)
    }

    update(updater: ((draft: any) => void)) {
        this.base.update(draft => {
            const baseState = draft[this.key]
            validateUpdater(baseState, updater, true)
            if (updaterNeedsReassignment(baseState, updater))
                draft[this.key] = updater
            else
                runUpdater(baseState, updater)
        })
    }

    getCacheKey() {
        return this.key
    }

    describe() {
        return `${this.base.describe()}.${this.key}`
    }
}
