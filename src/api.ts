import {Lens, Store, Merge, BaseLens} from "./internal"

let storeId = 0

export function createStore<T>(initialValue: T, name: string = "Store" + (++storeId)): Lens<T> {
    return new Store(initialValue, name)
}

// TODO proper typings
export function merge(...lenses: Lens[]) {
    return new Merge(lenses)
}

// TODO: read only lens
export function isLens(thing: any): thing is Lens {
    return thing instanceof BaseLens
}
