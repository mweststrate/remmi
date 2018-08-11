import { _shallowEqual, Lens } from "../internal";

const ShallowEqual =  { ShallowEqualLens: true }

export function shallowEqual<T>(lens: Lens<T>): Lens<T> {
    return lens.pipe({
        cacheKey: ShallowEqual,
        recompute(newBaseValue, currentValue) {
            if (_shallowEqual(currentValue, newBaseValue))
                return currentValue!
            return newBaseValue
        },
        description: 'shallowEqual()'
    })
}