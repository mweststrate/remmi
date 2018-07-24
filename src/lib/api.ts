import {Lens, Store, BaseLens, AutoRender, Selector, SelectField, Select, Builder, asBuilder} from "../internal"
import * as React from "react";

let storeId = 0

// TODO: rename to store
export function createStore<T>(initialValue: T, name: string = "Store" + (++storeId)): Lens<T> {
    return new Store(initialValue, name)
}

export function isLens(thing: any): thing is Lens {
    return thing instanceof BaseLens
}

export function autoRender(fn: () => React.ReactNode) {
    return React.createElement(AutoRender, {}, fn)
}

export function select<T, R>(selector: Selector<T, R>): Builder<T, Lens<R>>
export function select<T, K extends keyof T>(selector: K): Builder<T, Lens<T[K]>>
export function select(selector: any): any {
    return asBuilder(function (lens: Lens): Lens {
        if (typeof selector === "number")
            selector = ""  +selector // normalize to string
        // if we created a lens for the very same selector before, find it!
        let s: BaseLens | undefined = lens.selectorCache.get(selector)
        if (s) return s
        if (typeof selector === "string") {
            s = new SelectField(lens, selector)
        } else {
            s = new Select(lens, selector)
        }
        lens.selectorCache.set(selector, s)
        return s
    }
})