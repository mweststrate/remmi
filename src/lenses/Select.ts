import { BaseLens } from "./BaseLens";
import { Selector } from "./Lens";

export class Select<T = any> extends BaseLens<T> {
    constructor(private base: BaseLens<any>, private selector: Selector<any, T>) {
        super()
        // TODO: check args
    }

    recompute(): T {
        return this.selector(this.base.value())
    }

    update(updater: ((draft: T) => void)) {
        this.base.update(draft => {
            updater(this.selector(draft))
            // Note: deliberately no return is accepted from the updater,
            // as that would not be combinable with selector
        })
    }

    resume() {
        this.base.registerDerivation(this)
    }

    suspend() {
        this.base.removeDerivation(this)
    }
}
