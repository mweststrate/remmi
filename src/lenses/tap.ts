import { Lens, Builder } from "../internal";

export type ILogger<T = any> = (newValue: T, oldValue: T, lens: string) => void

function defaultLog<T>(this: Lens<T>, newValue: T, _oldValue: T, lens: string) {
    console.log(`[remmi] ${lens}: ${JSON.stringify(newValue)}`)
}

export function tap<T>(logger?: ILogger): Builder<T, Lens<T>>;
export function tap(logger: ILogger = defaultLog) {
    return function(lens: Lens): Lens {
        return lens.pipe({
            cacheKey: logger,
            recompute(base, newBaseValue, currentValue) {
                logger(newBaseValue, currentValue, base.toString())
                return newBaseValue
            },
            describe(base) {
                return `${base.describe()}.log()`
            }
        })
    }
}
