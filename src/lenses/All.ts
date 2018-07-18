import { BaseLens, Pipe } from "../internal";

export class All extends Pipe {
    constructor(private source: BaseLens<any>) {
        super(source.keys())
    }

    recompute() {
        // source.keys() already includes shallow comparision, so
        // base value has always introduced or removed entries here
        return this.base.value().map(key => this.source.select(key))
    }

    update(_updater: ((draft: any) => void)) {
        // question: or make this actually possible, and just cal on base?
        fail(
            "Cannot call update on `.all()`, call update on an individual lens instead"
        )
    }

    getCacheKey() {
        return All
    }

    describe() {
        return this.source.describe() + ".all()"
    }
}
