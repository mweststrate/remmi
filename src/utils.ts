export function noop() {

}

export function fail(msg: string): never {
    throw new Error("[remmi] " + msg)
}