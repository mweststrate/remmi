import produce from 'immer'
import React from 'react' // TODO: seperate bundle
import "./lenses/BaseLens";

import { Store } from './lenses/Store';
import { Lens, Selector } from './lenses/Lens';
import { Merge } from './lenses/Merge';

export function createStore<T>(initialValue: T): Lens<T> {
    return new Store(initialValue)
}

// TODO proper typings
export function merge(...lenses: Lens[]) {
    return new Merge(lenses)
}

// TODO: read only lens

function isLens(thing: any): thing is Lens {
    return true // TODO
}

export { project, mapProject }  from "./react"