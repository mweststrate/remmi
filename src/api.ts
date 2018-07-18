import {Lens, Store, BaseLens, AutoRender} from "./internal"
import * as React from "react";

let storeId = 0

export function createStore<T>(initialValue: T, name: string = "Store" + (++storeId)): Lens<T> {
    return new Store(initialValue, name)
}

// TODO: read only lens
export function isLens(thing: any): thing is Lens {
    return thing instanceof BaseLens
}

export function autoRender(fn: () => React.ReactNode) {
    return React.createElement(AutoRender, {}, fn)
}
