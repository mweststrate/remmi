import { Pipe, Lens, BaseLens } from "../internal";

export type IModelDefinition<T = any, R = any> = (lens: Lens<T>) => R

export class Model extends Pipe {
    constructor(base: BaseLens, private modelDefinition: IModelDefinition) {
        super(base)
        const memberDefinitions = modelDefinition(this)
        // optimize: only check in production
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
