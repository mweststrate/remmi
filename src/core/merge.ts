import { nothing } from "immer";

import {BaseCursor, Cursor, grabValue, fail} from "../internal"
import { normalizeUpdater } from "./updater-helpers";

const mergeCache = new Map<string, Merge<any, any>>()

export class Merge<
    X = any,
    T extends ReadonlyArray<X> = any[]
> extends BaseCursor<T> {
    constructor(public bases: BaseCursor[]) {
        super()
        // TODO: check args
    }

    recompute() {
        // note, one of the deps has changed, so the output of the merge
        // is guaranteed to be different as well
        return this.bases.map(grabValue) as any
    }

    update(updater: ((draft: T) => T | void)) {
        const drafts: any[] = []
        let collectedResults: any[]
        const grabNextDraft = () => {
            // probably optimizable
            this.bases[drafts.length].update(draft => {
                drafts.push(draft)
                if (drafts.length < this.bases.length) grabNextDraft()
                else {
                    // we are now in the context of all producers of all bases
                    // let's call the updater function with those drafts!
                    const r = normalizeUpdater(updater)(drafts as any)
                    if (r === undefined) collectedResults = drafts.slice()
                    else if (!Array.isArray(r) || r.length !== this.bases.length)
                        return fail(`updater for merge should return an array of length ${this.bases.length}, got: '${JSON.stringify(r)}'`)
                    else
                        collectedResults = r
                }
                const returnValue = collectedResults.pop()
                return returnValue === undefined ? nothing : returnValue
            })
        }
        grabNextDraft()
    }

    resume() {
        mergeCache.set(getMergeCacheKey(this.bases), this)
        this.bases.forEach(b => b.registerDerivation(this))
    }

    suspend() {
        const ck = getMergeCacheKey(this.bases)
        if ((mergeCache.get(ck) as any) === this) mergeCache.delete(ck)
        this.bases.forEach(b => b.removeDerivation(this))
    }

    getCacheKey() {
        return undefined // no simple cache key, but, see merge cache!
    }

    describe() {
        return (
            "merge(\n" + this.bases.map(b => b.describe()).join(",\n") + "\n)"
        )
    }
}

function getMergeCacheKey(bases: Cursor[]): string {
    return bases.map(b => (b as BaseCursor).lensId).join(";")
}

export function merge<A>(lens0: Cursor<A>): Cursor<[A]>
export function merge<A, B>(lens0: Cursor<A>, lens: Cursor<B>): Cursor<[A, B]>
export function merge<A, B, C>(
    lens0: Cursor<A>,
    lens1: Cursor<B>,
    lens2: Cursor<C>
): Cursor<[A, B, C]>
export function merge<A, B, C, D>(
    lens0: Cursor<A>,
    lens1: Cursor<B>,
    lens2: Cursor<C>,
    lens3: Cursor<D>
): Cursor<[A, B, C, D]>
export function merge<A, B, C, D, E>(
    lens0: Cursor<A>,
    lens1: Cursor<B>,
    lens2: Cursor<C>,
    lens3: Cursor<D>,
    lens4: Cursor<E>
): Cursor<[A, B, C, D, E]>
export function merge<A, B, C, D, E, F>(
    lens0: Cursor<A>,
    lens1: Cursor<B>,
    lens2: Cursor<C>,
    lens3: Cursor<D>,
    lens4: Cursor<E>,
    lens5: Cursor<F>
): Cursor<[A, B, C, D, E, F]>
export function merge(...lenses: Cursor[]): Cursor<any>
export function merge(...lenses: Cursor[]): Cursor<any> {
    const existing = mergeCache.get(getMergeCacheKey(lenses))
    if (existing) return existing
    return new Merge(lenses as any)
}
