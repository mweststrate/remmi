import { Pipe, Lens, Selector, BaseLens } from "../internal";

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
            updater(this.selector(draft))
            // Note: deliberately no return is accepted from the updater,
            // as that would not be combinable with selector
        })
    }
}
