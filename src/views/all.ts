import {Cursor, keys, fail} from "../internal"

const All = {All: true}

/**
 * The all() cursor transforms a cursor that holds an object or array into a a cursor that holds an array with cursor for each and every
 * of the fields in the collection. So basically this forks a cursor on an object / array, into a an object / array of cursor for each fields.
 * The all() cursor only produces a new value if the set of keys in the original collection changes, but when doing so, cursors that still exists are recycled.
 *
 * See also mapReduce(), which has similar functionality but will also merge the individual lenses back into a single lens
 *
 * @export
 * @template X
 * @template T
 * @param {Cursor<T>} lens
 * @returns {(Cursor<(Cursor<X> & {key: number})[]>)}
 */
export function all<X, T extends X[]>(
    lens: Cursor<T>
): Cursor<(Cursor<X> & {key: number})[]>
export function all<X, T extends {[key: string]: X}>(
    lens: Cursor<T>
): Cursor<(Cursor<X> & {key: string})[]>
export function all(lens: Cursor<any>): Cursor<any> {
    // TODO: express all() in terms of mapReduce?
    // all sublenses are always cached and reconciled until all is GC-ed itself
    let subLensCache = new Map<string, Cursor>()
    return lens.do(keys).transform({
        cacheKey: All,
        onNext(nextValue: any) {
            // source.keys() already includes shallow comparision, so
            // base value has always introduced or removed entries here
            const newCache = new Map<string, Cursor>()
            const lenses = nextValue.map((key: any) => {
                const subLens = subLensCache.get(key) || lens.select(key)
                newCache.set(key, subLens)
                return subLens
            })
            subLensCache = newCache
            return lenses
        },
        onUpdate() {
            // question: or make this actually possible, and just cal on base?
            fail(
                "Cannot call update on `.all()`, call update on an individual lens instead"
            )
        },
        description: "all()"
    })
}
