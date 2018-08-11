import {Lens, Builder} from "../internal"

export type IModelDefinition<T = any, R = any> = (lens: Lens<T>) => R

export function model<T, R>(
    modelDefinition: IModelDefinition<T, R>
): Builder<T, Lens<T> & R>
export function model(modelDefinition: IModelDefinition<any, any>) {
    return (lens: Lens) => {
        const modelLens = lens.pipe({
            cacheKey: modelDefinition,
            description: `model(${modelDefinition.name})`
        })
        const memberDefinitions = modelDefinition(lens)
        // optimize: only check in production
        // TODO: hide baseLens internally to avoid naming conflicts on members?
        for (let key in memberDefinitions)
            if (key in modelLens)
                fail(
                    `Cannot introduce model property ${key}, it would override a core lens property`
                )
        Object.assign(modelLens, memberDefinitions)
        return modelLens
    }
}
