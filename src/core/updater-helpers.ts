import { isFn, isObject, fail, Updater } from "../internal"

export function validateUpdater(base: any, updater: any, canReassign: boolean) {
    if (isFn(updater))
        return
    if (isObject(updater) && isObject(base))
        return
    if (!canReassign)
        fail("This lens is not reassignable as it is derived")
}

export function runUpdater(base: any, updater: any) {
    if (isObject(updater))
        Object.assign(base, updater)
    else {
        const res = updater(base)
        if (res !== undefined)
            fail("Updater functions should not return values. Did you forget curly braces?")
    }
}

export function updaterNeedsReassignment(base: any, updater: any): boolean {
    if (isObject(base) && isObject(updater))
        return false // can use assign
    if (isFn(updater))
        return false // can run producer
    return true
}
