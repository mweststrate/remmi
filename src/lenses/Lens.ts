export type Handler<T = any> = (value: T) => void
export type Selector<T = any, X = any> = (base: T) => X
export type Disposer = () => void
export type Updater<T = any> = (draft: T) => void

// TODO: better name
export type Builder<T, R> =
    {(lens: Lens<T>): R; isBuilder: true }

export type NextLensType<A> =
    A extends Builder<any, Lens<infer T>> ? T
    :A extends Selector<any, infer R> ? R
    : never

// TODO: alllign with redux store api
export interface Lens<T = any> {
    value(): T
    subscribe(handler: Handler<T>): Disposer
    update(producer: Updater<T> | Partial<T>): void
    view<R>(builder: Builder<T, R>): R
    view<R>(selector: Selector<T, R>): Lens<R>
    view<K extends keyof T>(selector: K): Lens<T[K]>

    view<R>(builder: Builder<T, R>): R
    view<R>(selector: Selector<T, R>): Lens<R>
    view<K extends keyof T>(selector: K): Lens<T[K]>

    view<R>(builder: Builder<T, R>): R
    view<R>(builder: Builder<T, R>): R
    view<R>(builder: Builder<T, R>): R

    view<R>(selector: Selector<T, R>): Lens<R>
    view<R>(selector: Selector<T, R>): Lens<R>
    view<R>(selector: Selector<T, R>): Lens<R>

    view<K extends keyof T>(selector: K): Lens<T[K]>
    view<K extends keyof T>(selector: K): Lens<T[K]>
    view<K extends keyof T>(selector: K): Lens<T[K]>


    // view<A, R extends ToBuilder<A>>(builder: ToBuilder<T, Lens<A>>, builder2: ToBuilder<A, R>): R
    // view<A, B, R>(builder: ToBuilder<T, Lens<A>>, builder2: ToBuilder<A, Lens<B>>, builder3: ToBuilder<B, R>): R

    // TODO: how to type number?
    // select<K extends keyof T>(selector: K): Lens<T[K]>
    // select<X = any>(selector: ((state: T) => X)): Lens<X>
    // merge(...lenses)
    // fork
    // log
    // selectAll(selector: string | ((state) => any)) // TODO type selector and such
    // readOnly
    // render(renderer: (value: T) => React.ReactNode): React.ReactElement<any>

    // generator / iterator api?
}

export function asBuilder<T extends Function>(fn: T): T & { isBuilder: true } {
    fn.isBuilder = true
    return fn
}