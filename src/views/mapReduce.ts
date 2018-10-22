import {nothing} from "immer"
import {
    Lens,
    Transformer,
    fail,
    shallowDiff,
    createStore,
    Disposer,
    noop,
    normalizeUpdater
} from "../internal"

export type MapReduceChanges<U> = {
    added: [string, U][] // index, newValue
    removed: [string, U][] // index, oldValue
    updated: [string, U, U][] // index, oldValue, newValue
}

type MapReduceEntry<T, U> = {
    rootLens: Lens<T>
    mappedLens: Lens<U>
    disposer: Disposer
}

export function mapReduce<T, U, R, C>(
    mapper: (lens: Lens<T>, key: string, context: C) => Lens<U>,
    reducer: (previousValue: R, changes: MapReduceChanges<U>, context: C) => R,
    initialValue: R,
    context: C
): Transformer<T[], Lens<R>> {
    return baseLens => {
        // all sublenses are always cached and reconciled until all is GC-ed itself
        const entries = new Map<string, MapReduceEntry<T, U>>()
        let prevBaseValue: any
        return baseLens.transform({
            cacheKey: undefined, // TODO cache on mapper + reducer? (by giving those a unique in a weak map)
            onNext(value: any, prevValue, self) {
                // shallowly-changed?
                const {changed, added, removed} = shallowDiff(
                    // if not hot, we should do a full diff..
                    (self.hot && prevBaseValue) || (Array.isArray(value) ? [] : {}),
                    value
                )
                prevBaseValue = value
                // short-circuit
                if (
                    changed.length === 0 &&
                    added.length === 0 &&
                    removed.length === 0
                )
                    return prevValue
                const changes: MapReduceChanges<U> = {
                    added: [],
                    removed: [],
                    updated: []
                }
                // new entries
                added.forEach(([key, value]) => {
                    const rootLens = createStore(value)
                    const mappedLens = mapper(rootLens, key, context)
                    const disposer = noop // TODO: fix mappedLens.subscribe(noop)
                    entries.set(key, {rootLens, mappedLens, disposer})
                    changes.added.push([key, mappedLens.value()])
                    // forward updater TODO: test
                    // rootLens.update = updater => {
                    //     baseLens.update(draft => {
                    //         const baseState = draft[key]
                    //         const res = normalizeUpdater(updater)(baseState)
                    //         if (res === nothing)
                    //             draft[key] = undefined as any
                    //         else if (res !== undefined)
                    //             draft[key] = res
                    //     })
                    // }
                })
                // removed entries
                removed.forEach(([key]) => {
                    const entry = entries.get(key)!
                    changes.removed.push([key, entry.mappedLens.value()])
                    entries.delete(key)
                })
                // changed entries
                changed.forEach(([key, value]) => {
                    const entry = entries.get(key)!
                    const oldValue = entry.mappedLens.value()
                    entry.rootLens.update(value)
                    const newValue = entry.mappedLens.value()
                    if (oldValue !== newValue)
                        changes.updated.push([key, oldValue, newValue])
                })
                // short-circuit
                if (
                    changed.length === 0 &&
                    added.length === 0 &&
                    removed.length === 0
                )
                    return prevValue
                // run reducer
                return reducer(prevValue || initialValue, changes, context)
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

// TODO: to own file
// TODO: make index a number for arrays?
export function map<A, B>(
    mapper: (value: A, index: string) => B
): Transformer<A[], Lens<B[]>> {
    return mapReduce(
        (lens, index) => lens.select(value => mapper(value, index)),
        (prev, changes) => {
            const res = prev.slice()
            changes.updated.forEach(([key, value]) => {
                res[key] = value
            })
            if (changes.removed.length) res.length -= changes.removed.length
            else
                changes.added.forEach(([_, value]) => {
                    res.push(value)
                })
            return res
        },
        [],
        undefined
    )
}
