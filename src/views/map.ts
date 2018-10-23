import { Transformer, mapReduce, Lens, select, KeyValueMap } from "../internal";

// TODO: make index a number for arrays?
export function map<A, B>(
    mapper: (value: A, index: string) => B
): Transformer<A[], Lens<B[]>>;
export function map<A, B>(
    mapper: (value: A, index: string) => B
): Transformer<KeyValueMap<A>, Lens<KeyValueMap<B>>>;
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
