import {_shallowEqual, Cursor} from "../internal"

const ShallowEqual = {ShallowEqualLens: true}

export function shallowEqual<T>(lens: Cursor<T>): Cursor<T> {
    return lens.transform({
        cacheKey: ShallowEqual,
        onNext(newBaseValue, currentValue) {
            if (_shallowEqual(currentValue, newBaseValue)) return currentValue!
            return newBaseValue
        },
        description: "shallowEqual()"
    })
}
