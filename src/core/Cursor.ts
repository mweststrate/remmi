import {TransformConfig, BaseCursor} from "../internal"

export type Disposer = () => void
export type Handler<T = unknown> = (value: T) => void
export type Selector<T = unknown, X = unknown> = (base: T) => X
export type Producer<T = unknown> = (draft: T) => (void | T)
export type Updater<T = unknown> = Producer<T> | Partial<T> | T
export type Transformer<T, R> = (lens: Cursor<T>) => R

// More accurate / easy typing, but fails inference for select(x)...
// export type TransformCall<A> = Transformer<A, any> | keyof A
// export type TransformResult<A, Call> = Call extends keyof A ? (Lens<A[Call]> & { key: Call }) : Call extends Transformer<A, infer B> ? B : never
// do<T1 extends TransformCall<T>>(transformer: T1): TransformResult<T, T1>
// do<T1 extends TransformCall<T>,
// R1 extends TransformResult<T, T1>,
//     T2 extends TransformCall<R1>
// >(transformer: T1, transformer2: T2): TransformResult<R1, T2>

// prettier-ignore
export interface Cursor<T = unknown> {
    value(): T
    subscribe(handler: Handler<T>): Disposer
    update(producer: Updater<T>): void

    /**
     * transform produces a new lens from a single other lens, given a config.
     * Typically used by transformers
     */
    transform<R>(config: Partial<TransformConfig<T, R>>): Cursor<R>

    // 1-ary
    do<R>(transformer: Transformer<T, R>): R
    do<A, R>(transformer: Transformer<T, Cursor<A>>,transformer2: Transformer<A, R>): R
    do<A, B, R>(t1: Transformer<T, Cursor<A>>,t2: Transformer<A, Cursor<B>>,t3: Transformer<B, R>): R
    do<A, B, C, R>(t1: Transformer<T, Cursor<A>>,t2: Transformer<A, Cursor<B>>,t3: Transformer<B, Cursor<C>>,t4: Transformer<C, R>): R
    do<A, B, C, D, R>(t1: Transformer<T, Cursor<A>>,t2: Transformer<A, Cursor<B>>,t3: Transformer<B, Cursor<C>>,t4: Transformer<C, Cursor<D>>,t5: Transformer<D, R>): R
    do(...transformers: (Transformer<any, any>)[]): any

    // select(key), convenience api over .do(select(key))
    select<K extends keyof T>(selector: K): KeyedLens<T[K], K>
    select<K1 extends keyof T, K2 extends keyof T[K1]>(selector: K1,selector2: K2): KeyedLens<T[K1][K2], K2>
    select<K1 extends keyof T,K2 extends keyof T[K1],K3 extends keyof T[K1][K2]>(selector: K1,selector2: K2,selector3: K3): KeyedLens<T[K1][K2][K3], K3>
    select<K1 extends keyof T,K2 extends keyof T[K1],K3 extends keyof T[K1][K2],K4 extends keyof T[K1][K2][K3]>(selector: K1,selector2: K2,selector3: K3,selector4: K4): KeyedLens<T[K1][K2][K3][K4], K4>
    select<K1 extends keyof T, K2 extends keyof T[K1], K3 extends keyof T[K1][K2], K4 extends keyof T[K1][K2][K3], K5 extends keyof T[K1][K2][K3][K4]>(selector: K1, selector2: K2, selector3: K3, selector4: K4, selector5: K5): KeyedLens<T[K1][K2][K3][K4][K5], K5>
}

export interface KeyedLens<T, K = keyof T> extends Cursor<T> {
    key: K
}

export function isCursor(thing: any): thing is Cursor {
    return thing instanceof BaseCursor
}
