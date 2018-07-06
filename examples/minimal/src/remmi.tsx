import produce from 'immer'
import * as React from 'react' // TODO: seperate bundle

type Handler<T = any> = (value: T) => void
type Selector<T = any, X = any> = (base: T) => X
type Disposer = () => void

interface Lens<T = any> {
    // static create
    select<X = any>(selector: (state: T) => X): Lens<X> // TODO: string based selector
    value(): T
    update(producer: ((draft: T) => void)): void // TODO: partial state
    subscribe(handler: Handler<T>): Disposer
    // selectAll(selector: string | ((state) => any)) // TODO type selector and such
    // merge(...lenses)
    // transaction...
    // generator / iterator api?
}

class Store<T = any> implements Lens<T> {
    state: T
    readonly subscriptions: Handler<T>[] = []
    private currentDraft?: T

    constructor(initialValue: T) {
        this.state = initialValue
    }

    value() {
        return this.state
    }

    update(updater: ((draft: T) => T | void)) {
        if (this.currentDraft) {
            // update call from an update call (for example caused by merge)
            // just reuse the current draft
            updater(this.currentDraft)
            return
        }
        const currentState = this.state
        try {
            this.state = produce(this.state, draft => {
                // optimize
                this.currentDraft = draft
                return updater(draft)
            })
            if (this.state !== currentState) notify(this.subscriptions, this.state)
        } finally {
            this.currentDraft = undefined
        }
    }

    subscribe(handler: Handler<T>) {
        return subscribe(this.subscriptions, handler)
    }

    select<X = any>(selector: Selector<T, X>): Select<X> {
        return new Select<X>(this, selector)
    }
}

class Select<T = any> implements Lens<T> {
    state?: T
    readonly subscriptions: Handler<T>[] = []
    parentSubscription?: Disposer

    constructor(private base: Lens<any>, private selector: Selector<any, T>) {
        // TODO: check args
    }

    private get hot() {
        return !!this.parentSubscription
    }

    value() {
        if (!this.hot) return this.selector(this.base.value())
        return this.state!
    }

    update(updater: ((draft: T) => void)) {
        this.base.update(draft => {
            updater(this.selector(draft))
            // Note: deliberately no return is accepted from the updater,
            // as that would not be combinable with selector
        })
    }

    subscribe(handler: Handler<T>) {
        if (!this.hot) this.resume()
        const disposer = subscribe(this.subscriptions, handler)
        return () => {
            disposer()
            if (this.subscriptions.length === 0) this.suspend()
        }
    }

    private resume() {
        this.parentSubscription = this.base.subscribe(nextBase => {
            const currentState = this.state
            this.state = this.selector(nextBase)
            if (this.state !== currentState) notify(this.subscriptions, this.state)
        })
    }

    private suspend() {
        if (this.hot) {
            this.parentSubscription!()
            this.parentSubscription = undefined
            this.state = undefined
        }
    }

    select<X = any>(selector: Selector<T, X>): Select<X> {
        return new Select<X>(this, selector)
    }
}

class Merge<T = any> implements Lens<T> {
    state?: any[]
    readonly subscriptions: Handler<T>[] = []
    parentSubscriptions: Disposer[] = []

    constructor(private bases: Lens<any>[]) {
        // TODO: check args
    }

    private get hot() {
        return this.parentSubscriptions.length > 0
    }

    value() {
        if (!this.hot) return this.bases.map(b => b.value()) as any // optimize extract fn // TODO: fix type
        return this.state!
    }

    update(updater: ((draft: T) => T | void)) {
        // TODO: fix typings
        const drafts: any[] = []
        const grabNextDraft = () => {
            // probably optimizable
            this.bases[drafts.length].update(draft => {
                drafts.push(draft)
                if (drafts.length < this.bases.length) grabNextDraft()
                else
                    // we are now in the context of all producers of all bases
                    // let's call the updater function with those drafts!
                    updater(drafts as any) // TODO: type
            })
        }
        grabNextDraft()
    }

    subscribe(handler: Handler<T>) {
        if (!this.hot) this.resume()
        const disposer = subscribe(this.subscriptions, handler)
        return () => {
            disposer()
            if (this.subscriptions.length === 0) this.suspend()
        }
    }

    private resume() {
        this.state = this.bases.map(b => b.value()) // optimize: extract fn
        this.parentSubscriptions = this.bases.map((b, idx) =>
            b.subscribe(nextBase => {
                const currentState = this.state![idx]
                if (currentState !== nextBase) {
                    const s = this.state.slice()
                    s[idx] = nextBase
                    this.state = s
                    notify(this.subscriptions, this.state)
                }
            })
        )
    }

    private suspend() {
        this.parentSubscriptions.splice(0).forEach(d => d())
        this.state = undefined
    }

    select<X = any>(selector: Selector<T, X>): Select<X> {
        return new Select<X>(this, selector)
    }
}

function notify(subscriptions: Handler[], value: any) {
    subscriptions.forEach(f => f(value)) // optimize
}

function subscribe(subscriptions: Handler[], handler: Handler): Disposer {
    subscriptions.push(handler)
    return () => {
        const idx = subscriptions.indexOf(handler)
        if (idx !== -1) subscriptions.splice(idx, 1)
    }
}

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

function createProxyLens(baseLens: Lens, selector: Selector) {
    const lens = baseLens.select(selector)
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
        return createProxyLens(target, b => b[property])
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
                        return this.props.children(v, idx, lens.select(s => s[idx]))
                    }) /* TODO select path */}
                </React.Fragment>
            )
        }
        if (typeof value === 'object') {
            return (
                <React.Fragment>
                    {Object.keys(value).map(key =>
                        this.props.children(value[key], key, lens.select(s => s[key]))
                    ) /* TODO select path. TODO: for key lenses should have unique id */}
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

function shallowEqual(ar1: any[], ar2: any[]) {
    if (ar1 === ar2) return true
    if (!ar1 || !ar2) return false
    if (ar1.length !== ar2.length) return false
    for (let i = 0; i < ar1.length; i++) if (ar1[i] !== ar2[i]) return false
    return true
}
