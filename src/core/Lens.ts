import {TransformConfig} from "../internal"

export type Disposer = () => void
export type Handler<T = any> = (value: T) => void
export type Selector<T = any, X = any> = (base: T) => X
export type Updater<T = any> = ((draft: T) => void) | Partial<T> | T
export type Transformer<T, R> = (lens: Lens<T>) => R

export interface Lens<T = any> {
    value(): T
    subscribe(handler: Handler<T>): Disposer
    update(producer: Updater<T>): void

    /**
     * transform produces a new lens from a single other lens, given a config.
     * Typically used by transformers
     */
    transform<R>(config: Partial<TransformConfig<T, R>>): Lens<R>

    // 1-ary
    do<R>(builder: Transformer<T, R>): R
    do<K extends keyof T>(selector: K): Lens<T[K]> & {key: K}

    // 2-ary
    do<A, R>(builder: Transformer<T, Lens<A>>, builder2: Transformer<A, R>): R
    do<K extends keyof T, R>(selector: K, builder: Transformer<T[K], R>): R

    do<A, K extends keyof A>(
        builder: Transformer<T, Lens<A>>,
        selector: K
    ): Lens<A[K]> & {key: K}
    do<K extends keyof T, K2 extends keyof T[K]>(
        selector: K,
        selector2: K2
    ): Lens<T[K][K2]> & {key: K2}

    // 3 -ary
    // TODO: more overloads (or TS 3?)

    // generator / iterator api?
}
