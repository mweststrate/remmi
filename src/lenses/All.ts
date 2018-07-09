import { Lens, BaseLens, shallowEqual, Pipe } from "../internal";

export class All extends Pipe {
    constructor(private source: BaseLens<any>) {
        super(source.keys())
    }

    recompute() {
        return this.base.value().map(key => this.source.select(key))
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
