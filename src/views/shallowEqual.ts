import {_shallowEqual, Lens} from "../internal"

const ShallowEqual = {ShallowEqualLens: true}

export function shallowEqual<T>(lens: Lens<T>): Lens<T> {
    return lens.transform({
        cacheKey: ShallowEqual,
        onNext(newBaseValue, currentValue) {
            if (_shallowEqual(currentValue, newBaseValue)) return currentValue!
            return newBaseValue
        },
        description: "shallowEqual()"
    })
}
