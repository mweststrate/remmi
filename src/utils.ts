export const emptyArray = []
Object.freeze(emptyArray)

export function noop() {

}

export function fail(msg: string): never {
    throw new Error("[remmi] " + msg)
}

export function shallowEqual(ar1: any, ar2: any) {
    // TODO: also for objects
    if (ar1 === ar2) return true
    if (!ar1 || !ar2) return false
    if (ar1.length !== ar2.length) return false
    for (let i = 0; i < ar1.length; i++) if (ar1[i] !== ar2[i]) return false
    return true
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