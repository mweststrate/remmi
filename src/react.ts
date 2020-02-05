import {useRef, memo, useState, useEffect, useCallback, createElement} from 'react'
import {track, cursor, update, current} from './remmi'

export function useStore<T>(initial: T | (() => T)): [T, (updater: T | ((current: T) => T)) => void] {
  const [rootCursor] = useState(() => cursor(typeof initial === 'function' ? (initial as Function)() : initial))
  const updater = useCallback(updater => {
    update(rootCursor, typeof updater === 'function' ? updater(current(rootCursor)) : updater)
  }, []) // Optimize: extract arr
  return [rootCursor, updater]
}

export function tracking<P>(component: React.FC<P>, autoGrab?: boolean): React.FC<P>
export function tracking(component: React.FC<any>, autoGrab?: boolean) {
  const wrapped = function(props) {
    const forceUpdate = useForceUpdate()
    const {result, trackingState} = track(props, component, autoGrab)
    useEffect(() => trackingState.subscribe(forceUpdate), [trackingState])
    return result
  }
  wrapped.displayName = `tracking(${component.displayName || component.name})`
  // TODO: hoist statics
  return memo(wrapped)
}

// TODO: kill?
export function autoMemo<P>(component: React.FC<P>, autoGrab?: boolean): React.FC<P>
export function autoMemo(component: React.FC<any>, autoGrab?: boolean) {
  function inner({store}: {store: any}) {
    const forceUpdate = useForceUpdate()
    const {result, trackingState} = track(store, component, autoGrab)

    useEffect(() => trackingState.subscribe(forceUpdate), [trackingState])

    return result
  }
  inner.displayName = component.displayName || component.name
  // TODO: hoist special statics?
  const Inner = memo(inner, () => true) // TODO: with ()=>true theoretically faster, but makes tree deeper // optimization: extra closure

  const Outer: React.FC = function(props) {
    const storeRef = useRef(cursor(props))
    // TODO: somehow treat children as ref as well, and not as datastructure?
    // e.g. pull them out first or detect that type? give custom isReference handler to store?
    update(storeRef.current, props)
    return createElement(Inner, {store: storeRef.current})
  }
  Outer.displayName = `autoMemo(${inner.displayName})`
  return Outer
}

function useForceUpdate() {
  const [_, setX] = useState(0)
  const updater = useCallback(() => {
    setX(x => x + 1)
  }, [])
  return updater
}
