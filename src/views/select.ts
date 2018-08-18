import {
    Lens,
    Selector,
    BaseLens,
    validateUpdater,
    runUpdater,
    Transformer,
    updaterNeedsReassignment,
    fail,
    KeyedLens,
    stringifyFunction
} from "../internal"

export function select<T, R>(selector: Selector<T, R>): Transformer<T, Lens<R>>
export function select<T, K extends keyof T>(
    selector: K
): Transformer<T, KeyedLens<T[K], K>>
export function select(selector: any): any {
    return function(lens: BaseLens): Lens {
        if (typeof selector === "function") return selectFn(lens, selector)
        if (typeof selector === "string" || typeof selector === "number")
            return selectProp(lens, "" + selector)
        return fail(
            "Invalid selector, expected number, string or function. Got: " +
                typeof selector
        )
    }
}

function selectFn<T, R>(lens: Lens<T>, selector: Selector<T, R>): Lens<R> {
    return lens.transform({
        cacheKey: selector,
        onNext(newBaseValue) {
            return selector(newBaseValue)
        },
        onUpdate(updater, next) {
            next(draft => {
                const baseState = selector(draft)
                validateUpdater(baseState, updater, false)
                runUpdater(baseState, updater)
            })
        },
        description: `select(${stringifyFunction(selector)})`
    })
}

function selectProp<T, K extends keyof T>(
    lens: Lens<T>,
    key: K
): KeyedLens<T[K], K> {
    return Object.assign(
        lens.transform({
            cacheKey: key,
            onNext(newBaseValue) {
                if (newBaseValue === null || newBaseValue === undefined)
                    return undefined as any
                if (typeof newBaseValue === "object") return newBaseValue[key]
                return fail(
                    `Unexpected value for field selector '${key}': '${newBaseValue}' (${typeof newBaseValue})`
                )
            },
            onUpdate(updater, next) {
                next(draft => {
                    const baseState = draft[key]
                    validateUpdater(baseState, updater, true)
                    if (updaterNeedsReassignment(baseState, updater))
                        draft[key] = updater as any
                    else runUpdater(baseState, updater)
                })
            },
            description: `"${key}"`
        }),
        {key}
    ) as any
}
