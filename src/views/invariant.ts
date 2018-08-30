import {stringifyFunction, Transformer, Lens, Disposer, fail} from "../internal"

export function invariant<T>(
    predicate: (value: T) => boolean | string
): Transformer<T, Disposer> {
    return (lens: Lens<T>) =>
        lens.subscribe(value => {
            const res = predicate(value)
            if (res === false)
                return fail(
                    `Invariant failed: '${stringifyFunction(predicate)}'`
                )
            if (typeof res === "string" && res) throw new Error(res)
            return
        })
}
