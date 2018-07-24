import { Pipe, Lens, Builder, asBuilder } from "../internal";

export type IModelDefinition<T = any, R = any> = (lens: Lens<T>) => R

class Model extends Pipe {
    constructor(base: Lens, private modelDefinition: IModelDefinition) {
        super(base)
        const memberDefinitions = modelDefinition(this)
        // optimize: only check in production
        // TODO: hide baseLens internally to avoid naming conflicts on members?
        for (let key in memberDefinitions)
            if (key in this)
                fail(`Cannot introduce model property ${key}, it would override a core lens property`)
        Object.assign(this, memberDefinitions)
    }

    getCacheKey() {
        return this.modelDefinition
    }

    describe() {
        return `${this.base.describe()}.model(${this.modelDefinition.name})`
    }
}

export function model<T, R>(modelDefinition: IModelDefinition<T, R>): Builder<T, Lens<T> & R>
export function model(modelDefinition: IModelDefinition<any, any>) {
    return asBuilder(function(lens: Lens) {
        // TODO: from cache
        return new Model(lens, modelDefinition)
    })
}
