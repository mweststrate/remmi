import { Transformer, shallowEqual, Cursor, select, KeyValueMap, map, each } from "../internal";

/**
 * Transforms a cursor into a cursor that contains a filtered value of the original collection (object or array).
 * Using the filter transformation is more efficient than running, for example, `Array.filter` in a `select`
 * transformation, as the later will always filter the entire set again if the collection changes, while
 * the `filter` transformation will only run on objects in the collection that did actively change
 */
export function filter<A>(
    predicate: (value: A, index: string) => boolean
): Transformer<A[], Cursor<A[]>>;
export function filter<A>(
    predicate: (value: A, index: string) => boolean
): Transformer<KeyValueMap<A>, Cursor<KeyValueMap<A>>>;
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
