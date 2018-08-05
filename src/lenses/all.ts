import {Lens, keys} from "../internal"

const All = {All: true}

export function all<X, T extends X[]>(
    lens: Lens<T>
): Lens<(Lens<X> & {key: number})[]>
export function all<X, T extends {[key: string]: X}>(
    lens: Lens<T>
): Lens<(Lens<X> & {key: string})[]>
export function all(lens: Lens): Lens {
    return lens.view(keys).pipe({
        cacheKey: All,
        recompute(nextValue) {
            // source.keys() already includes shallow comparision, so
            // base value has always introduced or removed entries here
            return nextValue.map((key: any) => Object.assign(lens.view(key), { key }))
        },
        update() {
            // question: or make this actually possible, and just cal on base?
            fail(
                "Cannot call update on `.all()`, call update on an individual lens instead"
            )
        },
        description: "all()"
    })
}
