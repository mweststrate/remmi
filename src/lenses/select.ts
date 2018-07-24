import { Pipe, Lens, Selector, BaseLens, validateUpdater, runUpdater, asBuilder, Builder, updaterNeedsReassignment } from "../internal";

class Select<B, R> extends Pipe implements Lens<R> {
    constructor(base: Lens, public selector: Selector<B, R>) {
        super(base)
    }

    recompute(): R {
        return this.selector(this.base.value())
    }

    update(updater: ((draft: R) => void)) {
        this.base.update(draft => {
            const baseState = this.selector(draft)
            validateUpdater(baseState, updater, false)
            runUpdater(baseState, updater)
        })
    }

    getCacheKey() {
        return this.selector
    }

    describe() {
        return `${this.base.describe()}.{${this.selector.toString()}}` // TODO: improve
    }
}

class SelectField extends Pipe {
    constructor(base: Lens, public key: string) {
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

export function select<T, R>(selector: Selector<T, R>): Builder<T, Lens<R>>
export function select<T, K extends keyof T>(selector: K): Builder<T, Lens<T[K]>>
export function select(selector: any): any {
    return asBuilder(function (lens: BaseLens): Lens {
        if (typeof selector === "number")
            selector = ""  +selector // normalize to string
        // if we created a lens for the very same selector before, find it!
        // TODO: move this logic to a san place
        let s: BaseLens | undefined = lens.selectorCache.get(selector)
        if (s) return s
        if (typeof selector === "string") {
            s = new SelectField(lens, selector)
        } else {
            s = new Select(lens, selector)
        }
        lens.selectorCache.set(selector, s)
        return s
    })
}