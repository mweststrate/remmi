import {fail, Lens} from "../internal"

const ReadOnly = {ReadOnly: true}

export function readOnly<T>(lens: Lens<T>): Lens<T> {
    return lens.transform({
        cacheKey: ReadOnly,
        onUpdate() {
            fail("Read only lens")
        },
        description: "readOnly()"
    })
}
