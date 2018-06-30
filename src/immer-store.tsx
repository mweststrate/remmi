import produce from 'immer'
import * as React from 'react' // TODO: seperate bundle
import "./lenses/BaseLens";

import { Store } from './lenses/Store';
import { Lens, Selector } from './lenses/Lens';
import { Merge } from './lenses/Merge';

export function createStore<T>(initialValue: T): Lens<T> {
    return new Store(initialValue)
}

export function autoLens(baseLens: Lens) {
    return createProxyLens(baseLens, x => x)
}

// TODO proper typings
export function merge(...lenses: Lens[]) {
    return new Merge(lenses)
}

function createProxyLens(baseLens: Lens, property: string | number) {
    const lens = baseLens.select(property) // TODO: create delegator around lens to minimize api surface?
    return new Proxy(lens, traps)
}

const traps = {
    get(target: any, property: PropertyKey): any {
        if (property in target) {
            const value = target[property]
            if (typeof value === 'function')
                // TODO: blegh
                return value.bind(target) // avoid being called with 'this' as proxy
            return value
        }
        // optimize: cache
        return createProxyLens(target, property)
    },
    set() {
        throw new Error("Cannot write property, use 'update' instead")
    }
}

// TODO: read only lens

function isLens(thing: any): thing is Lens {
    return true // TODO
}

// TODO: type the thing
class Projector extends React.Component<
    {
        lenses: Lens[]
        children: any // can be type, if Projector would be exported
        // TODO: test if fresh closures cause invalidation or not
    },
    any
> {
    // TODO: type
    lastRenderedMerge
    subscription
    state = {}

    static getDerivedStateFromProps(props, state) {
        if (!state || !shallowEqual(state.lenses, props.lenses)) {
            const m = merge.apply(null, props.lenses)
            return {
                merge: m,
                lenses: props.lenses,
                props: m.value()
            }
        }
        return null
    }

    // shouldComponentUpdate(nextProps, nextState) {
    //     if (shallowEqual(nextProps.lenses, this.props.lenses) && shallowEqual(nextState.props, this.state.props)) {
    //         console.log('sCU false') // TODO: check if children changed?
    //         return false
    //     }
    //     return true
    // }

    render() {
        return this.props.children(this.state.props)
    }

    componentDidMount() {
        this.componentDidUpdate()
    }

    componentDidUpdate() {
        if (this.lastRenderedMerge !== this.state.merge) {
            this.lastRenderedMerge = this.state.merge
            const oldsub = this.subscription
            this.subscription = this.state.merge.subscribe(values => {
                this.setState(s => ({ ...s, props: values }))
            })
            oldsub && oldsub()
        }
    }

    componentWillUnmount() {
        this.subscription && this.subscription()
    }
}

class MapProjector extends React.Component<
    {
        lens: Lens
        children: any // can be type, if Projector would be exported
        // TODO: test if fresh closures cause invalidation or not
    },
    any
> {
    subscription
    lastRenderedLens

    state = {}

    render() {
        const { lens } = this.props
        const value = lens.value()
        console.dir(value)
        if (value === undefined || value === null) return null
        if (Array.isArray(value)) {
            return (
                <React.Fragment>
                    {value.map((v, idx) => {
                        console.dir(v)
                        return this.props.children(v, idx, lens.select(idx))
                    })}
                </React.Fragment>
            )
        }
        if (typeof value === 'object') {
            return (
                <React.Fragment>
                    {Object.keys(value).map(key =>
                        this.props.children(value[key], key, lens.select(key))
                    ) /* TODO: for key lenses should have unique id */}
                </React.Fragment>
            )
        }
        console.warn('projectMap expects lens to return an array, object or undefined')
        return null
    }

    componentDidMount() {
        this.componentDidUpdate()
    }

    componentDidUpdate() {
        if (this.lastRenderedLens !== this.props.lens) {
            console.log('subscribe')
            this.lastRenderedLens = this.props.lens
            const oldsub = this.subscription
            this.subscription = this.props.lens.subscribe(value => {
                console.log('update')
                // TODO: this.setState(s => ({ ...s, value }))
                this.forceUpdate()
            })
            oldsub && oldsub()
        }
    }

    componentWillUnmount() {
        this.subscription && this.subscription()
    }
}

// TODO: type
// TODO: also needs single arg overload
export function project(...args: any[]) {
    const children = args.pop()
    return React.createElement(
        Projector,
        {
            lenses: args
        },
        children
    )
}

export function mapProject(lens: Lens, callback: (value: any, idx: string | number, lens: Lens) => React.ReactNode) {
    return <MapProjector lens={lens}>{callback}</MapProjector>
}
