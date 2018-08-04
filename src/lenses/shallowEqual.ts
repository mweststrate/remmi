import { _shallowEqual, Pipe, Lens } from "../internal";

class ShallowEqual extends Pipe {
    recompute() {
        const value = this.base.value()
        if (_shallowEqual(this.state, value))
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

export function shallowEqual<T>(lens: Lens<T>): Lens<T> {
    return new ShallowEqual(lens)
}
