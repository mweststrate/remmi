import { BaseLens, Lens, noop } from "../internal";
import { Updater } from "./Lens";

export interface PipeConfig<T, R> {
    cacheKey: any // TODO
    recompute(newBaseValue: T, currentValue: R | undefined, self: Lens<R>): R // TODO: rename: onNext
    update(updater: Updater<R>, next: (updater: Updater<T>) => void, self: Lens<R>): void // TODO: rename: onUpdate
    description: string
    onSuspend(): void
    onResume(): void
}

export class Pipe<T, R> extends BaseLens<R> {
    config: PipeConfig<T, R>

    constructor(private base: Lens<T>, config: Partial<PipeConfig<T, R>>) {
        super()
        const {
            cacheKey = undefined,
            recompute = defaultRecompute,
            update = defaultUpdate,
            description = "(unknown pipe)",
            onSuspend = noop,
            onResume = noop
        } = config
        this.config = { cacheKey, recompute, update, description, onSuspend, onResume }
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
        this.config.onResume()
    }

    suspend() {
        (this.base as BaseLens).removeDerivation(this)
        this.config.onSuspend()
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
