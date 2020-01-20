import { useRef, useContext, useEffect } from "react";
import { render } from "react-dom";

const STATE = Symbol("rememo")

// TODO: should be more intelligent, for nesting etc
let isTracking = false

const grab = (value) => {
    if (!value || !value[STATE]) throw new Error("Ungrabbable: " + value) // TODO: better error
    value[STATE].grabbed = true;
    return value[STATE].current;
}

export function track(value, fn: (value, grab) => any, autoGrab = false): {value: any, deps: Node} {
    // TODO: make grab a global exported function?
    const proxied = proxyValue(value, undefined, undefined);
    const rootState = proxied[STATE]
    isTracking = true
    try {
        let res = fn(proxied, grab);
        if (autoGrab)
            res = autoGrabber(res, grab)
        return { value: res, deps: rootState }
    } finally {
        isTracking = false
    }
}

interface Node {
    // parent?: Node
    // prop?: string
    // can contain both complex and primitives. If a key exists, it means it has been read
    primitive: boolean
    children: Map<PropertyKey, Node>
    current: any
    proxy: any
    grabbed: boolean

}

function proxyValue(value, parent?: Node, prop?) {
    // TODO: Proxy Map and Set
    if (handleAsReference(value)) {
        if (parent && !parent.children.has(prop))
            parent.children.set(prop, {
                primitive: true,
                children: null as any, // TODO: distinct Node types
                current: value,
                grabbed: true,
                proxy: value,
            })
        return value;
    }
    const proxy = new Proxy(value, handlers)
    const node: Node = {
        // parent,
        // prop,
        primitive: false,
        children: new Map,
        current: value,
        proxy,
        grabbed: false,
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
        if (child) return child.proxy;
        return proxyValue(target[prop], state, prop)
    }
}

// TODO: should except not a value, but Node should bind to stores, to support nesting
export function hasChanges(node: Node, value): boolean {
    // Value is immutable, so if it didn't change, no changes..
    if (value === node.current) return false;
    // primitive or grabbed, so if ref change we have a relevant changed
    // TODO: if a node has no children, it is a leaf and should also be compared by ref?
    if (node.primitive || node.grabbed) return node.current !== value;
    // Value was a non-primitive but not anymore
    if (!value || typeof value !== "object") return true;
    // check children
    for (const [prop, child] of node.children.entries()) {
        if (hasChanges(child, value[prop]))
            return true;
    }
    // no changes
    return false;
}

export function isLens(thing) {
    return (thing && thing[STATE] ? true : false)
}

function autoGrabber(base, grab) {
    // TODO: avoid the need on grab, pick it globally?
    if (handleAsReference(base))
        return base
    if (isLens(base))
        return grab(base)
    // TODO: map and set
    if (Array.isArray(base)) {
        for(let i = 0; i < base.length; i++) {
            const value = base[i]
            if (isLens(value))
                base[i] = grab(value)
            else
                autoGrabber(value, grab) // recurse
        }
    } else {
        for(const i in base) {
            // TODO: dedupe
            const value = base[i]
            if (isLens(value))
                base[i] = grab(value)
            else
                autoGrabber(value, grab) // recurse
        }
    }
    return base
}


function handleAsReference(value: any): boolean {
    if (!value || typeof value !== "object") return true
    if (Array.isArray(value) || value instanceof Map || value instanceof Set) return false
    const proto = Object.getPrototypeOf(value)
    if (proto === null || proto === Object.prototype)
        return false;
    return true
}

export function subscribe(node: Node, listener: () => void): () => void {

}
