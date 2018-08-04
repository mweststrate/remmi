export type Disposer = () => void
export type Handler<T = any> = (value: T) => void
export type Selector<T = any, X = any> = T extends Lens ? never : (base: T) => X
export type Updater<T = any> = ((draft: T) => void) | Partial<T> | T

// To type things like `select()`
export type Builder<T, R> =
    {(lens: Lens<T>): R, readonly isBuilder: true }

// To type things like `readOnly`
// (this workaround is needed because otherwise we have to declare
// readOnly as a const, which doesn't take generic arguments)
// TODO: better name
export type LousyBuilder<T, R> = (lens: Lens<T>) => R


// TODO: alllign with redux store api
export interface Lens<T = any> {
    value(): T
    subscribe(handler: Handler<T>): Disposer
    update(producer: Updater<T>): void

    view<R>(builder: Builder<T, R>): R
    view<R>(selector: Selector<T, R>): Lens<R>
    view<K extends keyof T>(selector: K): Lens<T[K]>
    view<R>(builder: LousyBuilder<T, R>): R

    // 2-ary
    view<A, R>(builder: Builder<T, Lens<A>>, builder2: Builder<A, R>): R
    view<A, R>(selector: Selector<T, A>, builder: Builder<A, R>): R
    view<K extends keyof T, R>(selector: K, builder: Builder<T[K], R>): R
    view<A, R>(builder: LousyBuilder<T, Lens<A>>, builder2: Builder<A, R>): R

    view<A, R>(builder: Builder<T, Lens<A>>, selector: Selector<A, R>): Lens<R>
    view<A, R>(selector: Selector<T, A>, selector2: Selector<A, R>): Lens<R>
    view<K extends keyof T, R>(selector: K, selector2: Selector<T[K], R>): Lens<R>
    view<A, R>(builder: LousyBuilder<T, Lens<A>>, selector: Selector<A, R>): Lens<R>

    view<A, K extends keyof A>(builder: Builder<T, Lens<A>>, selector: K): Lens<A[K]>
    view<A, K extends keyof A>(selector: Selector<T, A>, selector2: K): Lens<A[K]>
    view<K extends keyof T, K2 extends keyof T[K]>(selector: K, selector2: K2): Lens<T[K][K2]>
    view<A, K extends keyof A>(builder: LousyBuilder<T, Lens<A>>, selector: K): Lens<A[K]>

    view<A, R>(builder: Builder<T, Lens<A>>, builder2: LousyBuilder<A, R>): R
    view<A, R>(builder: Selector<T, A>, builder2: LousyBuilder<A, R>): R
    view<K extends keyof T, R>(selector: K, builder: LousyBuilder<T[K], R>): R
    view<A, R>(builder: LousyBuilder<T, Lens<A>>, builder2: LousyBuilder<A, R>): R

    // 3 -ary

    // generator / iterator api?
}

// TODO: better fuction name
export function asBuilder<T extends Function>(fn: T): T & { isBuilder: true };
export function asBuilder(fn: any) {
    fn.isBuilder = true // TODO: hidden non writable prop
    return fn
}
