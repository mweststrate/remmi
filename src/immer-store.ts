import produce from "immer"

type Handler<T = any> = (value: T) => void
type Selector<T = any, X = any> = (base: T) => X
type Disposer = () => void

interface Lens<T> {
    // static create
    select<X = any>(selector: (state: T) => X): Lens<X> // TODO: string based selector
    get(): T
    update(producer: ((draft: T) => void)): void // TODO: partial state
    subscribe(handler: Handler<T>): Disposer
    // selectAll(selector: string | ((state) => any)) // TODO type selector and such
    // merge(...lenses)
}

class Store<T = any> implements Lens<T> {
    state: T
    readonly subscriptions: Handler<T>[] = []

    constructor(initialValue: T) {
        this.state = initialValue
    }

    get() {
        return this.state
    }

    update(updater: ((draft: T) => T | void)) {
        const currentState = this.state
        // TODO support partial or new object?
        this.state = produce(this.state, updater)
        if (this.state !== currentState) notify(this.subscriptions, this.state)
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
    hot = false
    parentSubscription?: Disposer

    constructor(private base: Lens<any>, private selector: Selector<any, T>) {}

    get() {
        if (!this.hot) return this.selector(this.base.get())
        return this.state!
    }

    update(updater: ((draft: T) => T | void)) {
        this.base.update(draft => {
            updater(this.selector(draft))
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
        this.hot = true
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
        }
        this.hot = false
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

// TODO refSelect

// function autoLens(initial) {
//     const store = new Store(initial)
//     return new Proxy(
//         {
//             $lens: store
//         },
//         traps
//     )
// }

// const traps = {
//     get(target, property) {
//         const value = target.get()[property]
//         if (isPrimitive(value)) return value
//         // todo cache lens in weakmap
//         return target.$lens.select(b => b[property])
//     },
//     set() {
//         throw new Error("Cannot write property, use 'update' instead")
//     }
//     // TODO: get prop descriptors from target.$lens.get..
// }

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
