import {
    stringifyFunction,
    Transformer,
    Cursor,
    Disposer,
    Handler,
    BaseCursor,
    fail
} from "../internal"

class Subscription<T> extends BaseCursor<undefined> {
    disposed = false

    constructor(private base: BaseCursor<T>, private handler: Handler<T>) {
        super()
        base.registerDerivation(this)
    }

    dispose = () => {
        if (!this.disposed) this.base.removeDerivation(this)
        this.disposed = true
    }

    recompute() {
        if (this.disposed) return undefined
        this.handler(this.base.value())
        return undefined
    }

    resume(): void {
        fail("Illegal state")
    }

    suspend(): void {
        fail("Illegal state")
    }

    update() {
        fail("Illegal state")
    }

    getCacheKey(): any {
        return undefined
    }

    describe(): string {
        return `subscribe(${stringifyFunction(this.handler)})`
    }
}

export function subscribe<T>(
    subscription: Handler<T>
): Transformer<T, Disposer> {
    return (lens: Cursor<T>) =>
        new Subscription(lens as any, subscription).dispose
}
