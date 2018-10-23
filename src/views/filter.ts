import { Transformer, shallowEqual, Lens, select, KeyValueMap, map, each } from "../internal";

export function filter<A>(
    predicate: (value: A, index: string) => boolean
): Transformer<A[], Lens<A[]>>;
export function filter<A>(
    predicate: (value: A, index: string) => boolean
): Transformer<KeyValueMap<A>, Lens<KeyValueMap<A>>>;
export function filter<A, B>(
    predicate: (value: A, index: string) => B
): Transformer<any, any> {
    return lens =>  lens.do(
        map((value: A, index) => [predicate(value, index), value]),
        select(mapped => {
            const isArray = Array.isArray(mapped)
            const res = isArray ? [] : {}
            each(mapped, (index, value) => {
                if (value[0] === true)
                    if (isArray)
                        res.push(value[1])
                    else
                        res[index] = value[1]
            })
            return res
        }),
        shallowEqual // Optimize: inefficient, should, during map, compare with previous result
        // TODO: Idea: pass known previous state as second argument to select funtions
        // Also, shallowEqual selector can be implemented using `select` that way
    )
}
