const STATE = Symbol("rememo")

// TODO: should be more intelligent, for nesting etc
let isTracking = false

interface Source<T, U = T> {
    latest(): T
    update?(updateDescription: U)
    subscribe(listener: (store: this) => void): Thunk
}

type AnySource = Source<any>

interface TrackingState {
    source: AnySource
    // Nodes that are not originating in our own source
    // but should nonetheless be tracked
    // Map<Source, Node>
    externalNodes: Set<Node>
    root: Node
}

interface Node {
    // parent?: Node
    // prop?: string
    // can contain both complex and primitives. If a key exists, it means it has been read
    context: TrackingState
    primitive: boolean
    children: Map<PropertyKey, Node>
    current: any
    proxy: any
    grabbed: boolean
}

type Thunk = () => void


const grab = value => {
    if (!value || !value[STATE]) throw new Error("Ungrabbable: " + value) // TODO: better error
    value[STATE].grabbed = true
    return value[STATE].current
}

export function track(
    source: AnySource,
    fn: (value, grab) => any,
    autoGrab = false
): {value: any; trackingState: TrackingState} {
    // TODO: support the source being a lens...
    // TODO: make grab a global exported function?
    const proxied = proxyValue(source.latest(), undefined, undefined)
    const root = proxied[STATE]
    const trackingState: TrackingState = {
        source,
        externalNodes: new Set(),
        root
    }
    root.trackingState = trackingState
    isTracking = true
    try {
        let res = fn(proxied, grab)
        if (autoGrab) res = autoGrabber(res, grab)
        return {value: res, trackingState}
    } finally {
        isTracking = false
    }
}


function proxyValue(value, parent?: Node, prop?) {
    if (isLens(value)) {
        if (!parent) {
            throw new Error("Not implemented yet");
            // TODO: create a special node for this?
        }
        const node: Node = value[STATE]
        parent.children.set(prop, node);
        if (node.context !== parent.context) {
            // TODO: this should be current context, not parent's context
            parent.context.externalNodes.add(node)
        }
        return value;
    }
    // TODO: Proxy Map and Set
    if (handleAsReference(value)) {
        if (parent && !parent.children.has(prop))
            parent.children.set(prop, {
                context: parent.context,
                primitive: true,
                children: null as any, // TODO: distinct Node types
                current: value,
                grabbed: true,
                proxy: value
            })
        return value
    }
    const proxy = new Proxy(value, handlers)
    const node: Node = {
        // parent,
        // prop,
        context: undefined as any, // intialized later
        primitive: false,
        children: new Map(),
        current: value,
        proxy,
        grabbed: false
    }
    // TODO: value sould be fresh objects and such, or state stored in a weak map...
    Object.defineProperty(value, STATE, {
        value: node,
        enumerable: false
    })
    if (parent) parent.children.set(prop, node)
    return proxy
}

const handlers: ProxyHandler<any> = {
    get(target, prop) {
        // TODO: or throw / warn
        if (!isTracking) return target[prop]
        const state: Node = target[STATE]
        if (prop === STATE) return state
        const child = state.children.get(prop)
        if (child) return child.proxy
        return proxyValue(target[prop], state, prop)
    }
}

export function hasChanges(trackingState: TrackingState): boolean {
    // check external lenses first

    return nodeHasChanges(trackingState.root, trackingState.source.latest());
}

function getCurrentValueOfNode(node: Node) {
    // grab source, find path
}

// TODO: should except not a value, but Node should bind to stores, to support nesting
export function nodeHasChanges(node: Node, value): boolean {
    // Something with lens comparing...
    if (value === node) {
        // This is a lens, did the lens change?
        // TODO: is this lookup actually needed?
        return nodeHasChanges(node, getCurrentValueOfNode(node));
    }
    // TODO will typically never get her?

    // Value is immutable, so if it didn't change, no changes..
    if (value === node.current) return false
    // primitive or grabbed, so if ref change we have a relevant changed
    // TODO: if a node has no children, it is a leaf and should also be compared by ref?
    if (node.primitive || node.grabbed) return node.current !== value
    // Value was a non-primitive but not anymore
    if (!value || typeof value !== "object") return true
    // check children
    for (const [prop, child] of node.children.entries()) {
        if (nodeHasChanges(child, value[prop])) return true
    }
    // no changes
    return false
}

export function isLens(thing) {
    return thing && thing[STATE] ? true : false
}

function autoGrabber(base, grab) {
    // TODO: avoid the need on grab, pick it globally?
    if (handleAsReference(base)) return base
    if (isLens(base)) return grab(base)
    // TODO: map and set
    if (Array.isArray(base)) {
        for (let i = 0; i < base.length; i++) {
            const value = base[i]
            if (isLens(value)) base[i] = grab(value)
            else autoGrabber(value, grab) // recurse
        }
    } else {
        for (const i in base) {
            // TODO: dedupe
            const value = base[i]
            if (isLens(value)) base[i] = grab(value)
            else autoGrabber(value, grab) // recurse
        }
    }
    return base
}

function handleAsReference(value: any): boolean {
    if (!value || typeof value !== "object") return true
    if (Array.isArray(value) || value instanceof Map || value instanceof Set)
        return false
    const proto = Object.getPrototypeOf(value)
    if (proto === null || proto === Object.prototype) return false
    return true
}

export function subscribe(node: Node, listener: () => void): () => void {
    // TODO:
    // subscribe to lenses per source, if they changed, immediately trigger listener
    return null as any;
}

export function createStore<T>(initial: T): SimpleValueStore<T> {
    return new SimpleValueStore<T>(initial);
}

class SimpleValueStore<T> implements Source<T, T> {
    _current: T
    _subscriptions = new Array<(source: this) => void>()

    constructor(initialValue: T) {
        this._current = initialValue;
    }

    latest() {
        return this._current
    }

    update(newValue: T): boolean {
        if (newValue !== this._current) {
            this._current = newValue;
            const subs = this._subscriptions;
            subs.forEach(f => f(this))
        }
     }

     subscribe(listener: (source: this) => void) {
         this._subscriptions.push(listener);
         return () => {
             const idx = this._subscriptions.indexOf(listener);
             if (idx !== -1) {
                 const newSubs = this._subscriptions = this._subscriptions.slice();
                 newSubs.splice(idx, 1);
             }
         }
     }
 }
