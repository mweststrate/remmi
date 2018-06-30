import { BaseLens } from "./BaseLens";
import { Pipe } from "./Pipe";

// Specialized version of select, that only selects a certain sub property
// saves a lot of closures during selection, and handles undefined values transparently
export class SelectField extends Pipe {
    constructor(base: BaseLens<any>, private field: string) {
        super(base)
    }

    recompute() {
        const base = this.base.value()
        if (base === null || base === undefined)
            return undefined
        if (typeof base === "object")
            return base[this.field]
        return fail(`Unexpected value for field selector '${this.field}': '${base}' (${typeof base})`)
    }

    update(updater: ((draft: any) => void)) {
        this.base.update(draft => {
            if (draft !== null && typeof draft === "object") updater(draft[this.field])
            else fail(`Cannot update field ${this.field} of non-object value ${draft}`)
        })
    }
}
