import produce from "immer"

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
    private currentDraft?: T;

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
            this.state = produce(this.state, (draft) => { // optimize
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
            if (this.state !== currentState)
                notify(this.subscriptions, this.state)
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

    update(updater: ((draft: T) => T | void)) { // TODO: fix typings
        const drafts: any[] = []
        const grabNextDraft = () => { // probably optimizable
            this.bases[drafts.length].update(draft => {
                drafts.push(draft)
                if (drafts.length < this.bases.length)
                    grabNextDraft()
                else
                    // we are now in the context of all producers of all bases
                    // let's call the updater function with those drafts!
                    updater(drafts as any); // TODO: type
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
        this.parentSubscriptions = this.bases.map((b, idx) => b.subscribe(nextBase => {
            const currentState = this.state![idx]
            this.state![idx] = nextBase
            if (this.state![idx] !== currentState)
                notify(this.subscriptions, this.state)
        }))
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
        if (property in target)
            return target[property]
        // optimize: cache
        return createProxyLens(target, b => b[property])
    },
    set() {
        throw new Error("Cannot write property, use 'update' instead")
    }
}

export function track(lens: Lens[], onInvalidate: () => void) {
    // TODO: support single lens
}

// function tracker(component) {
//     return class Tracker extends Component {
//         derivedPropsFromState(props, prevState) {
//             const oldLens = this.$lenses
//             const nextState = {}
//             const newLenses = Object.keys(props)
//                 .filter(prop => isLens(props[prop]))
//                 .map(prop => {
//                     const lens = props[prop]
//                     nextState[prop] = lens.get()
//                     return lens.subscribe(value => {
//                         setState(state => ({...state, [prop]: value}))
//                     })
//                 })

//             // TODO: could also reconcile lenses!
//             forEach(oldLens).unsubscribe()
//             return {...prevState, $lenses: newLenses}
//         }

//         render() {
//             const nextProps = {...props, ...state}
//             delete nextProps.lenses
//             return createElement(component, nextProps)
//         }
//     }
// }
