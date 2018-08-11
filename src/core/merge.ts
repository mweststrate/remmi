import { BaseLens, Lens } from "../internal";

const mergeCache = new Map<string, Merge<any, any>>()

export class Merge<X=any, T extends ReadonlyArray<X> = any[]> extends BaseLens<T> {
    constructor(public bases: BaseLens[]) {
        super()
        // TODO: check args
    }

    recompute() {
        // note, one of the deps has changed, so the output of the merge
        // is guaranteed to be different as well
        return this.bases.map(b => b.value()) as any // optimize extract fn // TODO: fix type // TODO: freeze
    }

    update(updater: ((draft: T) => T | void)) {
        // TODO: fix typings
        const drafts: any[] = []
        const grabNextDraft = () => {
            // probably optimizable
            this.bases[drafts.length].update(draft => {
                drafts.push(draft)
                if (drafts.length < this.bases.length) grabNextDraft()
                else
                    // we are now in the context of all producers of all bases
                    // let's call the updater function with those drafts!
                    updater(drafts as any) // TODO: type
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
        if (mergeCache.get(ck) as any === this)
            mergeCache.delete(ck)
        this.bases.forEach(b => b.removeDerivation(this))
    }

    getCacheKey() {
        return undefined; // no simple cache key, but, see merge cache!
    }


    describe() {
        return "merge(" + this.bases.map(b => b.describe()).join(", ") + ")"
    }
}

function getMergeCacheKey(bases: Lens[]): string {
    return bases.map(b => (b as BaseLens).lensId).join(";")
}

// TODO proper typings
export function merge(...lenses: Lens[]): Lens {
    const existing = mergeCache.get(getMergeCacheKey(lenses))
    if (existing)
        return existing
    return new Merge(lenses as any)
}
