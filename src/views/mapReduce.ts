import {Lens, keys, Transformer, emptyArray, fail, isLens} from "../internal"

export type MapReduceChanges<U> = {
    added: [string, U][], // index, newValue
    removed: [ string, U][], // index, oldValue
    updated: [string, U, U][], // index, oldValue, newValue
}

export function mapReduce<T, U, R, C>(
    mapper: (lens: Lens<T>, context: C) => Lens<U>,
    reducer: (previousValue: R, changes: MapReduceChanges<U>, context: C) => R,
    initialValue: R,
    context: C
): Transformer<T[], Lens<R>> {
    return (lens) => {
        // all sublenses are always cached and reconciled until all is GC-ed itself
        let subLensCache = new Map<string, Lens<U>>()
        return lens.do(keys).transform({
            cacheKey: undefined, // TODO cache on mapper + reducer? (by giving those a unique in a weak map)
            onNext(nextValue: any, prevValue) {
                // source.keys() already includes shallow comparision, so
                // base value has always introduced or removed entries here
                const newCache = new Map<string, Lens<U>>()
                const added: [string, U][] = []
                const removed: [string, U][] = []
                // collect all source lenses
                nextValue.forEach((key: any) => {
                    const existing = subLensCache.get(key)
                    if (existing)
                        newCache.set(key, existing as any)
                    else {
                        // set up mapper funtion
                        const newSublens = mapper(lens.select(key), context)
                        // TODO: set up subscription, how to feed back into this transformer?
                        if (!isLens(newSublens)) fail("mapReduce mapper function should produce a new lens")
                        newCache.set(key, newSublens)
                        added.push([key, newSublens.value()])
                        // TODO: keep alive?
                    }
                })
                // detect removed lenses
                if (newCache.size !== subLensCache.size + added.length)
                subLensCache.forEach((lens, key) => {
                    if (!newCache.has(key))
                        removed.push([key, lens.value()])
                    // TODO: cleanup? keep not alive?
                })
                // run reducer
                return reducer(prevValue || initialValue, {
                    added, removed, updated: emptyArray
                }, context)
            },
            onUpdate() {
                // question: or make this actually possible, and just cal on base?
                fail(
                    "Cannot call update on `.mapReduce()`, call update on an individual lens instead"
                )
            },
            description: "mapReduce()" // TODO: improve
        })
    }
}
