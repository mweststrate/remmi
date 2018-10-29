import {Cursor, Transformer} from "../internal"

export type ILogger<T = any> = (newValue: T, oldValue: T, lens: string) => void

function defaultLog<T>(this: Cursor<T>, newValue: T, _oldValue: T, lens: string) {
    console.log(`[remmi] ${lens}: ${JSON.stringify(newValue)}`)
}

export function tap<T>(logger?: ILogger): Transformer<T, Cursor<T>>
export function tap(logger: ILogger = defaultLog) {
    return function(lens: Cursor): Cursor {
        return lens.transform({
            cacheKey: logger,
            onNext(newBaseValue, currentValue, self) {
                logger(newBaseValue, currentValue, self.toString())
                return newBaseValue
            },
            description: "log()"
        })
    }
}
