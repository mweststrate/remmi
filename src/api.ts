import {Lens, Store, Merge, BaseLens} from "./internal"

export function createStore<T>(initialValue: T): Lens<T> {
    return new Store(initialValue)
}

// TODO proper typings
export function merge(...lenses: Lens[]) {
    return new Merge(lenses)
}

// TODO: read only lens
export function isLens(thing: any): thing is Lens {
    return thing instanceof BaseLens
}
