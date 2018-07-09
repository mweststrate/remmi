import { shallowEqual, Pipe } from "../internal";

export class ShallowEqual extends Pipe {
    recompute() {
        const value = this.base.value()
        if (shallowEqual(this.state, value))
            return this.state
        return value
    }

    getCacheKey() {
        return ShallowEqual
    }

    describe() {
        return `${this.base.describe()}.shallowEqual()`
    }
}
