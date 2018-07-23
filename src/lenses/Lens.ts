export type Handler<T = any> = (value: T) => void
export type Selector<T = any, X = any> = (base: T) => X
export type Disposer = () => void
export type Updater<T = any> = (draft: T) => void

export type Builder<T, R> = (lens: Lens<T>) => R

// TODO: alllign with redux store api
export interface Lens<T = any> {
    value(): T
    subscribe(handler: Handler<T>): Disposer
    update(producer: Updater<T> | Partial<T>): void
    build<R>(builder: Builder<T, R>): R
    build<A, R>(builder: Builder<T, Lens<A>>, builder2: Builder<A, R>): R
    build<A, B, R>(builder: Builder<T, Lens<A>>, builder2: Builder<A, Lens<B>>, builder3: Builder<B, R>): R

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
