import { Pipe, Lens, Selector, BaseLens, validateUpdater, runUpdater } from "../internal";

export class Select<B, R> extends Pipe implements Lens<R> {
    constructor(base: BaseLens<any>, public selector: Selector<B, R>) {
        super(base)
        // TODO: check args
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

