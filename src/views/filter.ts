import { Transformer, shallowEqual, Lens, select, KeyValueMap, map } from "../internal";

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
        select(mapped => mapped.filter(([res, _]) => res).map(([_, v]) => v)),
        shallowEqual // Optimize: inefficient, should, during map, compare with previous result
        // Idea: pass known previous state as second argument to select funtions
    )
}
