import {
    Cursor,
    Transformer,
    fail,
    shallowDiff,
    createStore,
    Disposer,
    noop,
} from "../internal"
import { KeyValueMap } from "../core/utils";

export type MapReduceChanges<U> = {
    added: [string, U][] // index, newValue
    removed: [string, U][] // index, oldValue
    updated: [string, U, U][] // index, newValue, oldValue
}

type MapReduceEntry<T, U> = {
    rootLens: Cursor<T>
    mappedLens: Cursor<U>
    disposer: Disposer
}

// TODO: make index a number for arrays?
export function mapReduce<T, U, S extends T[] | KeyValueMap<T>, R>(
    mapper: (lens: Cursor<T>, key: string) => Cursor<U>,
    reducer: (previousValue: R, changes: MapReduceChanges<U>, sourceValue: S) => R
): Transformer<S, Cursor<R>>{
    return baseLens => {
        const entries = new Map<string, MapReduceEntry<T, U>>()
        let prevBaseValue: any
        return baseLens.transform({
            cacheKey: undefined, // TODO cache on mapper + reducer? (by giving those a unique in a weak map)
            onNext(sourceValue: S, previousResult: R, self) {
                if (!sourceValue || typeof sourceValue !== "object")
                    return sourceValue // map Reduce doesn't do anything for primitive types
                // shallowly-changed?
                const {changed, added, removed} = shallowDiff(
                    // if not hot, we should do a full diff..
                    ((self as any).hot && prevBaseValue) || (Array.isArray(sourceValue) ? [] : {}),
                    sourceValue as KeyValueMap<T>
                )
                prevBaseValue = sourceValue
                // short-circuit
                if (
                    changed.length === 0 &&
                    added.length === 0 &&
                    removed.length === 0
                )
                    return previousResult
                const changes: MapReduceChanges<U> = {
                    added: [],
                    removed: [],
                    updated: []
                }
                // new entries
                added.forEach(([key, value]) => {
                    const rootLens = createStore(value)
                    const mappedLens = mapper(rootLens, key)
                    const disposer = mappedLens.subscribe(noop)
                    entries.set(key, {rootLens, mappedLens, disposer})
                    changes.added.push([key, mappedLens.value()])
                })
                // removed entries
                removed.forEach(([key]) => {
                    const entry = entries.get(key)!
                    changes.removed.push([key, entry.mappedLens.value()])
                    entries.delete(key)
                })
                // changed entries
                changed.forEach(([key, newBaseValue]) => {
                    const entry = entries.get(key)!
                    const oldMappedValue = entry.mappedLens.value()
                    entry.rootLens.update(newBaseValue)
                    const newMappedValue = entry.mappedLens.value()
                    if (oldMappedValue !== newMappedValue)
                        changes.updated.push([key, newMappedValue, oldMappedValue])
                })
                // short-circuit
                if (
                    changed.length === 0 &&
                    added.length === 0 &&
                    removed.length === 0
                )
                    return previousResult
                // run reducer
                return reducer(previousResult, changes, sourceValue)
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
