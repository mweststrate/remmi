import {TransformConfig, BaseLens} from "../internal"

export type Disposer = () => void
export type Handler<T = unknown> = (value: T) => void
export type Selector<T = unknown, X = unknown> = (base: T) => X
export type Updater<T = unknown> = ((draft: T) => void) | Partial<T> | T
export type Transformer<T, R> = (lens: Lens<T>) => R

// More accurate / easy typing, but fails inference for select(x)...
// export type TransformCall<A> = Transformer<A, any> | keyof A
// export type TransformResult<A, Call> = Call extends keyof A ? (Lens<A[Call]> & { key: Call }) : Call extends Transformer<A, infer B> ? B : never
// do<T1 extends TransformCall<T>>(transformer: T1): TransformResult<T, T1>
// do<T1 extends TransformCall<T>,
// R1 extends TransformResult<T, T1>,
//     T2 extends TransformCall<R1>
// >(transformer: T1, transformer2: T2): TransformResult<R1, T2>

export type NoInfer<T> = T & {[K in keyof T]: T[K]}

export interface Lens<T = unknown> {
    value(): T
    subscribe(handler: Handler<T>): Disposer
    update(producer: Updater<T>): void

    /**
     * transform produces a new lens from a single other lens, given a config.
     * Typically used by transformers
     */
    transform<R>(config: Partial<TransformConfig<T, R>>): Lens<R>

    // 1-ary
    do<R>(transformer: Transformer<T, R>): R
    do<K extends keyof T>(selector: K): Lens<T[K]> & {key: K}

    // // 2-ary
    do<A, R>(
        transformer: Transformer<T, Lens<A>>,
        transformer2: Transformer<A, R>
    ): R
    do<K extends keyof T, R>(selector: K, transformer: Transformer<T[K], R>): R

    do<A, K extends keyof A>(
        transformer: Transformer<T, Lens<A>>,
        selector: K
    ): Lens<A[K]> & {key: K}
    do<K1 extends keyof T, K2 extends keyof T[K1]>(
        selector: K1,
        selector2: K2
    ): Lens<T[K1][K2]> & {key: K2}

    // 3 -ary
    // only pure keys or pure selectors (otherwise combinations explode :-())
    do<A, B, R>(
        t1: Transformer<T, Lens<A>>,
        t2: Transformer<A, Lens<B>>,
        t3: Transformer<B, R>
    ): R
    do<K1 extends keyof T, K2 extends keyof T[K1], K3 extends keyof T[K1][K2]>(
        selector: K1,
        selector2: K2,
        selector3: K3
    ): Lens<T[K1][K2][K3]> & {key: K3}

    // 4 -ary
    do<A, B, C, R>(
        t1: Transformer<T, Lens<A>>,
        t2: Transformer<A, Lens<B>>,
        t3: Transformer<B, Lens<C>>,
        t4: Transformer<C, R>
    ): R
    do<
        K1 extends keyof T,
        K2 extends keyof T[K1],
        K3 extends keyof T[K1][K2],
        K4 extends keyof T[K1][K2][K3]
    >(
        selector: K1,
        selector2: K2,
        selector3: K3,
        selector4: K4
    ): Lens<T[K1][K2][K3][K4]> & {key: K4}

    // 5 -ary
    do<A, B, C, D, R>(
        t1: Transformer<T, Lens<A>>,
        t2: Transformer<A, Lens<B>>,
        t3: Transformer<B, Lens<C>>,
        t4: Transformer<C, Lens<D>>,
        t5: Transformer<D, R>
    ): R
    do<
        K1 extends keyof T,
        K2 extends keyof T[K1],
        K3 extends keyof T[K1][K2],
        K4 extends keyof T[K1][K2][K3],
        K5 extends keyof T[K1][K2][K3][K4]
    >(
        selector: K1,
        selector2: K2,
        selector3: K3,
        selector4: K4,
        selector5: K5
    ): Lens<T[K1][K2][K3][K4][K5]> & {key: K5}
    // any-ary
    do(...transformers: (string | Transformer<any, any>)[]): any
}

export function isLens(thing: any): thing is Lens {
    return thing instanceof BaseLens
}
