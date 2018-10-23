import {Lens, emptyArray, shallowEqual, select} from "../internal"

function grabIndex(_v: any, idx: number) {
    return idx
}

function keySelector(value: any): any[] {
    if (Array.isArray(value)) return value.map(grabIndex)
    if (value !== null && typeof value === "object") return Object.keys(value)
    return emptyArray
}

export function keys<T>(lens: Lens<T>): Lens<(keyof T)[]> {
    return lens.do(select(keySelector), shallowEqual)
}
