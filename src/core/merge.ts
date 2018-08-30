import {BaseLens, Lens, grabValue} from "../internal"

const mergeCache = new Map<string, Merge<any, any>>()

export class Merge<
    X = any,
    T extends ReadonlyArray<X> = any[]
> extends BaseLens<T> {
    constructor(public bases: BaseLens[]) {
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
        const grabNextDraft = () => {
            // probably optimizable
            this.bases[drafts.length].update(draft => {
                drafts.push(draft)
                if (drafts.length < this.bases.length) grabNextDraft()
                else
                    // we are now in the context of all producers of all bases
                    // let's call the updater function with those drafts!
                    updater(drafts as any)
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

function getMergeCacheKey(bases: Lens[]): string {
    return bases.map(b => (b as BaseLens).lensId).join(";")
}

export function merge<A>(lens0: Lens<A>): Lens<[A]>
export function merge<A, B>(lens0: Lens<A>, lens: Lens<B>): Lens<[A, B]>
export function merge<A, B, C>(
    lens0: Lens<A>,
    lens1: Lens<B>,
    lens2: Lens<C>
): Lens<[A, B, C]>
export function merge<A, B, C, D>(
    lens0: Lens<A>,
    lens1: Lens<B>,
    lens2: Lens<C>,
    lens3: Lens<D>
): Lens<[A, B, C, D]>
export function merge<A, B, C, D, E>(
    lens0: Lens<A>,
    lens1: Lens<B>,
    lens2: Lens<C>,
    lens3: Lens<D>,
    lens4: Lens<E>
): Lens<[A, B, C, D, E]>
export function merge<A, B, C, D, E, F>(
    lens0: Lens<A>,
    lens1: Lens<B>,
    lens2: Lens<C>,
    lens3: Lens<D>,
    lens4: Lens<E>,
    lens5: Lens<F>
): Lens<[A, B, C, D, E, F]>
export function merge(...lenses: Lens[]): Lens<any> {
    const existing = mergeCache.get(getMergeCacheKey(lenses))
    if (existing) return existing
    return new Merge(lenses as any)
}
