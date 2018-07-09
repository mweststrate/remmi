import { Lens, BaseLens, shallowEqual, Pipe } from "../internal";

export class All extends Pipe {
    previousKeySet: number | string[] | undefined = undefined
    previousLenses: {[key: string]: Lens}

    constructor(base: BaseLens<any>) {
        super(base)
        this.state = []
    }

    recompute() {
        const nextState = this.recomputeHelper()
        if (!this.hot) {
            this.state = nextState // forcefully cache!
        }
        return this.state
    }

    recomputeHelper() {
        const base = this.base.value()
        if (Array.isArray(base)) return this.recomputeNewLensArray(base)
        if (base !== null && typeof base === "object")
            return this.recomputeNewEntriesArray(base)
        if (this.previousKeySet !== undefined) {
            this.previousKeySet = undefined
            return []
        }
        return this.state
    }

    private recomputeNewLensArray(base: any[]) {
        const newLength = base.length
        if (newLength === this.previousKeySet) return this.state
        if (Array.isArray(this.state)) {
            this.previousKeySet = newLength
            if (newLength < this.previousKeySet)
                return this.state.slice(0, newLength)
            else {
                const newLenses = this.state.slice()
                for (let i = newLenses.length; i < newLength; i++)
                    newLenses.push(this.base.select(i))
                return newLenses
            }
        }
        this.previousKeySet = newLength
        return base.map((_, idx) => this.base.select(idx)) // optimize
    }

    private recomputeNewEntriesArray(base: object) {
        const newKeys = Object.keys(base)
        if (shallowEqual(newKeys, this.previousKeySet)) return this.state
        this.previousKeySet = newKeys
        this.previousLenses = {}
        return newKeys.map(key => {
            const lens =
                this.previousLenses[key] ||
                (this.previousLenses[key] = this.base.select(key))
            return [key, lens]
        })
    }

    update(updater: ((draft: any) => void)) {
        // question: or make this actually possible, and just cal on base?
        fail(
            "Cannot call update on `.all()`, call update on an individual lens instead"
        )
    }

    getCacheKey() {
        return All
    }
}
