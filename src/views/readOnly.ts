import {fail, Cursor} from "../internal"

const ReadOnly = {ReadOnly: true}

export function readOnly<T>(lens: Cursor<T>): Cursor<T> {
    return lens.transform({
        cacheKey: ReadOnly,
        onUpdate() {
            fail("Read only lens")
        },
        description: "readOnly()"
    })
}
