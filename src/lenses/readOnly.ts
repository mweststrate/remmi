import { fail, Pipe, Lens } from "../internal"

class ReadOnly extends Pipe {
    update(_updater: any) {
        fail("Read only lens")
    }

    getCacheKey() {
        return ReadOnly
    }

    describe() {
        return this.base.describe() + ".readOnly()"
    }
}

export function readOnly<T>(lens: Lens<T>): Lens<T> {
    return new ReadOnly(lens)
}
