import { BaseLens, Lens } from "../internal";
import { Updater } from "./Lens";

// lens that doesn't do anything particullary useful (it just returns it's parents value),
// yet is useful for subclassing
export abstract class Pipe extends BaseLens {
    protected base: BaseLens
    constructor(base: Lens) {
        super()
        // TODO: check args
        this.base = base as BaseLens
    }

    recompute(): any {
        return this.base.value()
    }

    update(updater: ((draft: any) => void)) {
        this.base.update(updater)
    }

    resume() {
        this.base.registerDerivation(this)
    }

    suspend() {
        this.base.removeDerivation(this)
    }
}

export interface PipeConfig<T, R> {
    cacheKey: any // TODO
    recompute(newBaseValue: T, currentValue: R | undefined, self: Lens<R>): R // TODO: rename: onNext
    update(updater: Updater<R>, next: (updater: Updater<T>) => void, self: Lens<R>): void // TODO: rename: onUpdate
    description: string
}

// TODO: rename to Pipe
export class Pipe2<T, R> extends BaseLens<R> {
    config: PipeConfig<T, R>

    constructor(private base: Lens<T>, config: Partial<PipeConfig<T, R>>) {
        super()
        const {
            cacheKey = undefined,
            recompute = defaultRecompute,
            update = defaultUpdate,
            description = "(unknown pipe)"
        } = config
        this.config = { cacheKey, recompute, update, description }
    }

    recompute(): any {
        return this.config.recompute(this.base.value(), this.state, this)
    }

    update(updater: ((draft: any) => void)) {
        this.config.update(updater, this.nextUpdate, this)
    }

    nextUpdate = (updater: Updater<T>) => {
        this.base.update(updater)
    }

    getCacheKey() { // TODO: should be removed
        return this.config.cacheKey
    }

    resume() {
        (this.base as BaseLens).registerDerivation(this)
    }

    suspend() {
        (this.base as BaseLens).removeDerivation(this)
    }

    describe() {
        return (this.base as BaseLens).describe() + "." + this.config.description
    }
}

function defaultRecompute(nextValue: any) {
    return nextValue
}

function defaultUpdate(updater: Updater, next: (updater: Updater) => void) {
    next(updater) // TODO: eliminate some function in Pipe.update to make stack friendlier?
}
