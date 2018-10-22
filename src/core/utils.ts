import {Lens} from "../internal"

export const emptyArray = []
Object.freeze(emptyArray)

export function noop() {}

export function fail(msg: string): never {
    throw new Error("[remmi] " + msg)
}

export function grabValue<T>(lens: Lens<T>): T {
    return lens.value()
}

export function _shallowEqual(ar1: any, ar2: any) {
    // TODO: also for objects
    if (ar1 === ar2) return true
    if (!ar1 || !ar2) return false
    if (ar1.length !== ar2.length) return false
    for (let i = 0; i < ar1.length; i++) if (ar1[i] !== ar2[i]) return false
    return true
}

export function shallowDiff<T>(
    baseValue: T,
    newValue: T
): {
    changed: string[]
    added: string[]
    removed: string[]
} {
    const changed: string[] = []
    const added: string[] = []
    const removed: string[] = []
    // Optimize! For example, if base or new is empty
    const baseKeys = new Set(Object.keys(baseValue))
    const newKeys = new Set(Object.keys(newValue))
    baseKeys.forEach(key => {
        const base = baseValue[key]
        if (newKeys.has(key)) {
            if (newValue[key] !== base)
                changed.push([key, base, newValue[key]])
        } else {
            removed.push([key, base])
        }
    })
    newKeys.forEach(key => {
        if (!baseKeys.has(key))
            added.push([key, newValue[key]])
    })

    return {
        changed, added, removed
    }
}

export function once(fn: () => void): () => void {
    let executed = false
    return () => {
        if (!executed) {
            executed = true
            fn()
        }
    }
}

export function isFn(thing: any): thing is Function {
    return typeof thing === "function"
}

export function isArray(thing: any): thing is any[] {
    return Array.isArray(thing)
}

export function isObject(thing: any) {
    return (
        typeof thing === "object" &&
        thing !== null &&
        (thing.constructor === Object || thing.constructor === undefined)
    )
}

export function stringifyFunction(fn: Function): string {
    if (fn.name) return fn.name
    const lines = fn.toString().split("\n")
    if (lines.length <= 4) return lines.map(trim).join(" ")
    return "<function>"
}

export function trim(str: string) {
    return str.replace(/^\s+|\s+$/g, "")
}
