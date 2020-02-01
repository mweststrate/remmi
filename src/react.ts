import { useRef, memo, useState, useContext, useMemo, useEffect, useCallback, createElement } from "react"
import { track, createStore, TrackingState, DataSource  } from "./remmi"

export function tracking<P>(component: React.FC<P>): React.FC<P>
export function tracking(component: React.FC<any>) {
    if (!component.displayName) {
        component.displayName = component.name
    }
    const Inner = memo(function({store}: {store: DataSource}) {
        const forceUpdate = useForceUpdate()
        const { result, trackingState } = track(store, component)

        useEffect(() => {
            return trackingState.subscribe(forceUpdate)
        }, [trackingState])

        return result
    })

    const Outer: React.FC = function(props) {
        const storeRef = useRef(createStore(props))
        const propsRef = useRef({ store: storeRef.current })
        storeRef.current.set(props)
        return createElement(Inner, propsRef.current)
    }
    Outer.displayName = `tracking(${component.displayName || component.name})`
    return Outer
}

function useForceUpdate() {
    const [_, setX] = useState(0)
    const updater = useCallback(() => {
        setX(x => x + 1)
    }, [])
    return updater
}
