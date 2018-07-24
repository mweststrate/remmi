import { Pipe, Lens, asBuilder, keys, BaseLens } from "../internal";

class All extends Pipe {
    constructor(private source: Lens) {
        super(source.view(keys))
    }

    recompute() {
        // source.keys() already includes shallow comparision, so
        // base value has always introduced or removed entries here
        return this.base.value().map((key: any) => this.source.view(key))
    }

    update(_updater: ((draft: any) => void)) {
        // question: or make this actually possible, and just cal on base?
        fail(
            "Cannot call update on `.all()`, call update on an individual lens instead"
        )
    }

    getCacheKey() {
        return All
    }

    describe() {
        return (this.source as BaseLens).describe() + ".all()"
    }
}

export function all<X, T extends X[]>(lens: Lens<T>): Lens<Lens<X>[]>;
export function all<X, T extends {[key: string]: X}>(lens: Lens<T>): Lens<Lens<X>[]>;
export function all(lens: Lens): Lens {
    return new All(lens)
}

asBuilder(all)