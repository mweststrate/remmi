import { Transformer, mapReduce, Cursor, select, KeyValueMap } from "../internal";

/**
 * Transforms a cursor into a cursor that contains a mapped value of the original collection (object or array).
 * Using the map transformation is more efficient than running, for example, `Array.map` in a `select`
 * transformation, as the later will always map the entire set again if the collection changes, while
 * the `map` transformation will only run on objects in the collection that did actively change
 */
export function map<A, B>(
    mapper: (value: A, index: string) => B
): Transformer<A[], Cursor<B[]>>;
export function map<A, B>(
    mapper: (value: A, index: string) => B
): Transformer<KeyValueMap<A>, Cursor<KeyValueMap<B>>>;
export function map<A, B>(
    mapper: (value: A, index: string) => B
): Transformer<any, any> {
    return mapReduce<A, B, KeyValueMap<A>, KeyValueMap<B>>(
        (lens, index) => lens.do(select((value: A) => mapper(value, index))),
        (prev, changes, source) => {
            if (prev === undefined) prev = Array.isArray(source) ? [] as any : {}
            const isArray = Array.isArray(prev)
            const res: KeyValueMap<B> = Array.isArray(prev) ? prev.slice() as any : {...prev}
            changes.updated.forEach(([key, value]) => {
                res[key as any] = value
            })
            if (changes.removed.length) {
                if (isArray)
                    (res as any).length -= changes.removed.length
                else
                    changes.removed.forEach(([key]) => {
                        delete res[key]
                    })
            }
            else
                changes.added.forEach(([key, value]) => {
                    if (isArray)
                        (res as any).push(value)
                    else
                        res[key] = value
                })
            return res
        }
    )
}
