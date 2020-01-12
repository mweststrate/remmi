
const STATE = Symbol("rememo")

export function track(value, fn: (value, grab) => any): {value: any, deps: Node} {
    const proxied = proxyValue(value, undefined, undefined);
    const rootState = proxied[STATE]
    const res = fn(proxied, (value) => {
        if (!value || !value[STATE]) throw new Error("Ungrabbable: " + value) // TODO: better error
        value[STATE].grabbed = true;
        return value[STATE].current;
    });
    return { value: res, deps: rootState }
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
    if (!value || typeof value !== "object") {
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
        const state: Node = target[STATE]
        if (prop === STATE) return state
        const child = state.children.get(prop)
        if (child) return child.proxy;
        return proxyValue(target[prop], state, prop)
    }
}

export function hasChanges(node: Node, value): boolean {
    // Value is immutable, so if it didn't change, no changes..
    if (value === node.current) return false;
    // primitive or grabbed, so if ref change we have a relevant changed
    // TODO: if a node has no children, it is a leaf and should also be compared by ref?
    if (node.primitive || node.grabbed || node.children.size === 0) return node.current !== value;
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
