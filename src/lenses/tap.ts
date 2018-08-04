import { Pipe, Lens, Builder } from "../internal";

export type ILogger<T = any> = (newValue: T, oldValue: T, lens: string) => void

// TODO: rename to tap
class Log extends Pipe {
    constructor(base: Lens, private logger: ILogger) {
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

function defaultLog<T>(this: Lens<T>, newValue: T, _oldValue: T, lens: string) {
    console.log(`[remmi] ${lens}: ${JSON.stringify(newValue)}`)
}

export function tap<T>(logger?: ILogger): Builder<T, Lens<T>>;
export function tap(logger: ILogger = defaultLog) {
    return function(lens: Lens): Lens {
        // TODO: from cache
        return new Log(lens, logger)
    }
}
