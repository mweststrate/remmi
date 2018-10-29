import {nothing} from "immer"
import {
    Cursor,
    Selector,
    BaseCursor,
    Transformer,
    fail,
    KeyedLens,
    stringifyFunction,
    avoidReturns
} from "../internal"

export function select<T, R>(selector: Selector<T, R>): Transformer<T, Cursor<R>>
// TODO: support multiple keys!
export function select<T, K extends keyof T>(
    selector: K
): Transformer<T, KeyedLens<T[K], K>>
export function select(selector: any): any {
    return function(lens: BaseCursor): Cursor {
        if (typeof selector === "function") return selectFn(lens, selector)
        if (typeof selector === "string" || typeof selector === "number")
            return selectProp(lens, "" + selector)
        return fail(
            "Invalid selector, expected number, string or function. Got: " +
                typeof selector
        )
    }
}

function selectFn<T, R>(lens: Cursor<T>, selector: Selector<T, R>): Cursor<R> {
    return lens.transform({
        cacheKey: selector,
        onNext(newBaseValue) {
            return selector(newBaseValue)
        },
        onUpdate(updater, next) {
            next(draft => {
                const baseState = selector(draft)
                avoidReturns(baseState, updater(baseState))
            })
        },
        description: `select(${stringifyFunction(selector)})`
    })
}

function selectProp<T, K extends keyof T>(
    lens: Cursor<T>,
    key: K
): KeyedLens<T[K], K> {
    return Object.assign(
        lens.transform<T[K]>({
            cacheKey: key,
            onNext(newBaseValue) {
                if (newBaseValue === null || newBaseValue === undefined)
                    return undefined as any
                if (typeof newBaseValue === "object") return newBaseValue[key]
                return undefined
            },
            onUpdate(updater, next) {
                next(draft => {
                    const baseState = draft[key]
                    const res = updater(baseState)
                    if (res === nothing)
                        draft[key] = undefined as any
                    else if (res !== undefined)
                        draft[key] = res
                })
            },
            description: `"${key}"`
        }),
        {key}
    ) as any
}
