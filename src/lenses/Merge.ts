import { BaseLens } from "../internal";

export class Merge<X=any, T extends ReadonlyArray<X> = any[]> extends BaseLens<T> {
    constructor(public bases: BaseLens[]) {
        super()
        // TODO: check args
    }

    recompute() {
        // note, one of the deps has changed, so the output of the merge
        // is guaranteed to be different as well
        return this.bases.map(b => b.value()) as any // optimize extract fn // TODO: fix type
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
        this.bases.forEach(b => b.registerDerivation(this))
    }

    suspend() {
        this.bases.forEach(b => b.removeDerivation(this))
    }
}
