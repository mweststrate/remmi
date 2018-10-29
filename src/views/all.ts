import {Cursor, keys, fail} from "../internal"

const All = {All: true}

export function all<X, T extends X[]>(
    lens: Cursor<T>
): Cursor<(Cursor<X> & {key: number})[]>
export function all<X, T extends {[key: string]: X}>(
    lens: Cursor<T>
): Cursor<(Cursor<X> & {key: string})[]>
export function all(lens: Cursor<any>): Cursor<any> {
    // TODO: express all in terms of mapReduce?
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
