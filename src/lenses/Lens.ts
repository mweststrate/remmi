import { PipeConfig } from "../internal";

export type Disposer = () => void
export type Handler<T = any> = (value: T) => void
export type Selector<T = any, X = any> = (base: T) => X
export type Updater<T = any> = ((draft: T) => void) | Partial<T> | T

// To type things like `select()`
export type Builder<T, R> = (lens: Lens<T>) => R

// TODO: alllign with redux store api
export interface Lens<T = any> {
    value(): T
    subscribe(handler: Handler<T>): Disposer
    update(producer: Updater<T>): void
    pipe<R>(config: Partial<PipeConfig<T, R>>): Lens<R> // TODO: make this just internal? Or merge with .view as overload?
    describe(): string

    // 1-ary
    view<R>(builder: Builder<T, R>): R
    view<K extends keyof T>(selector: K): Lens<T[K]>

    // 2-ary
    view<A, R>(builder: Builder<T, Lens<A>>, builder2: Builder<A, R>): R
    view<K extends keyof T, R>(selector: K, builder: Builder<T[K], R>): R

    view<A, K extends keyof A>(builder: Builder<T, Lens<A>>, selector: K): Lens<A[K]>
    view<K extends keyof T, K2 extends keyof T[K]>(selector: K, selector2: K2): Lens<T[K][K2]>

    // 3 -ary

    // generator / iterator api?
}
