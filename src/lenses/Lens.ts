export type Handler<T = any> = (value: T) => void
export type Selector<T = any, X = any> = (base: T) => X
export type Disposer = () => void

export interface Lens<T = any> {
    // static create
    value(): T
    subscribe(handler: Handler<T>): Disposer
    update(producer: ((draft: T) => void)): void // TODO: partial state

    // TODO: how to type number?
    select<K extends keyof T>(selector: K): Lens<T[K]>
    select<X = any>(selector: ((state: T) => X)): Lens<X>
    // merge(...lenses)
    // fork
    // log
    // selectAll(selector: string | ((state) => any)) // TODO type selector and such
    // readOnly

    // generator / iterator api?
}
