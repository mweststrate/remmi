export type Handler<T = any> = (value: T) => void
export type Selector<T = any, X = any> = (base: T) => X
export type Disposer = () => void
export type Updater<T = any> = (draft: T) => void

// TODO: better name
export type Builder<T, R> =
    {(lens: Lens<T>): R; isBuilder: true }

// TODO: alllign with redux store api
export interface Lens<T> {
    value(): T
    subscribe(handler: Handler<T>): Disposer
    update(producer: Updater<T> | Partial<T>): void

    view<R>(builder: Builder<T, R>): R
    view<R>(selector: Selector<T, R>): Lens<R>
    view<K extends keyof T>(selector: K): Lens<T[K]>

    // 2-ary
    view<A, R>(builder: Builder<T, Lens<A>>, builder2: Builder<A, R>): R
    view<A, R>(builder: Builder<T, Lens<A>>, selector: Selector<A, R>): Lens<R>
    view<A, K extends keyof A>(builder: Builder<T, Lens<A>>, selector: K): Lens<A[K]>

    view<A, R>(selector: Selector<T, A>, builder: Builder<A, R>): R
    view<A, R>(selector: Selector<T, A>, selector2: Selector<A, R>): Lens<R>
    view<A, K extends keyof A>(selector: Selector<T, A>, selector2: K): Lens<A[K]>

    view<K extends keyof T, R>(selector: K, builder: Builder<T[K], R>): R
    view<K extends keyof T, R>(selector: K, selector2: Selector<T[K], R>): Lens<R>
    view<K extends keyof T, K2 extends keyof T[K]>(selector: K, selector2: K2): Lens<T[K][K2]>

    // TODO: variadic versions... ?

    // generator / iterator api?
}

export function asBuilder<T extends Function>(fn: T): T & { isBuilder: true };
export function asBuilder(fn: any) {
    fn.isBuilder = true
    return fn
}
