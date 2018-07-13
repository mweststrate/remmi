import { Pipe, Lens, BaseLens } from "../internal";

export type ILogger<T = any> = (newValue: T, oldValue: T, lens: string) => void

// TODO: rename to tap
export class Log extends Pipe {
    constructor(base: BaseLens, private logger: ILogger) {
        super(base)
    }

    recompute() {
        const newValue = this.base.value()
        const oldValue = this.state
        this.logger(newValue, oldValue, this.base.toString())
        return newValue
    }

    getCacheKey() {
        return this.logger
    }

    describe() {
        return `${this.base.describe()}.log()`
    }
}

export function defaultLog<T>(this: Lens<T>, newValue: T, _oldValue: T, lens: string) {
    console.log(`[remmi] ${lens}: ${JSON.stringify(newValue)}`)
}
