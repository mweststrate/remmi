export type Handler<T = any> = (value: T) => void
export type Selector<T = any, X = any> = (base: T) => X
export type Disposer = () => void

export interface Lens<T = any> {
    // static create
    value(): T
    subscribe(handler: Handler<T>): Disposer
    select<X = any>(selector: (state: T) => X): Lens<X> // TODO: string based selector
    update(producer: ((draft: T) => void)): void // TODO: partial state
    // selectAll(selector: string | ((state) => any)) // TODO type selector and such
    // merge(...lenses)
    // transaction...
    // generator / iterator api?
}
