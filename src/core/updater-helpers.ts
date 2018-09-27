import { nothing } from "immer";
import {isFn, isObject, Updater, Producer, fail} from "../internal"

export function normalizeUpdater<T = unknown>(updater: Updater<T>): Producer<T> {
    if (updater === undefined) return () => nothing
    if (isFn(updater)) return updater
    if (isObject(updater)) return (draft: T) => isObject(draft) ? void Object.assign(draft, updater) : updater as T
    return () => updater as T
}

export function avoidReturns(base: any, value: any): void {
    if (value !== undefined && value !== base)
        return fail("This updater function should modify the current draft, and cannot return a complety new state")
}
