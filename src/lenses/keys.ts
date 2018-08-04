import { Lens, emptyArray, shallowEqual, select } from "../internal";

function keySelector(value: any): any[] {
    if (Array.isArray(value))
        return value.map((_v, idx) => idx) // optimize!
    if (value !== null && typeof value === "object")
        return Object.keys(value)
    return emptyArray
}

export function keys<T>(lens: Lens<T>): Lens<(keyof T)[]>
export function keys(lens: Lens): Lens {
    return lens.view(select(keySelector as any), shallowEqual)
}
