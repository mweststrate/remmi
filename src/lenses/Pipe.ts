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
    recompute(base: Lens<T>, newBaseValue: T, currentValue: R | undefined): R
    update(base: Lens<T>, updater: Updater<R>): void
    describe(base: Lens<T>): string
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
            describe = defaultDescribe
        } = config
        this.config = { cacheKey, recompute, update, describe }
    }

    recompute(): any {
        return this.config.recompute(this.base, this.base.value(), this.state)
    }

    update(updater: ((draft: any) => void)) {
        this.config.update(this.base, updater)
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
        return this.config.describe(this.base)
    }
}

function defaultRecompute(_lens: Lens, baseValue: any) {
    return baseValue
}

function defaultUpdate(lens: Lens, updater: Updater) {
    lens.update(updater)
}

function defaultDescribe(lens: Lens) {
    return (lens as BaseLens).describe() + ".(unknown pipe)"
}
