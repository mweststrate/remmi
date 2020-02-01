import {
  useRef,
  memo,
  useState,
  useEffect,
  useCallback,
  createElement
} from 'react'
import {track, createStore, DataSource} from './remmi'

export function tracking<P>(component: React.FC<P>): React.FC<P>
export function tracking(component: React.FC<any>) {
  function inner({store}: {store: DataSource}) {
    const forceUpdate = useForceUpdate()
    const {result, trackingState} = track(store, component)

    useEffect(() => trackingState.subscribe(forceUpdate), [trackingState])

    return result
  }
  inner.displayName = component.displayName || component.name
  // TODO: hoist special statics?
  const Inner = memo(inner)

  const Outer: React.FC = function(props) {
    const storeRef = useRef(createStore(props))
    // TODO: somehow treat children as ref as well, and not as datastructure?
    // e.g. pull them out first or detect that type? give custom isReference handler to store?
    storeRef.current.set(props)
    return createElement(Inner, {store: storeRef.current})
  }
  Outer.displayName = `tracking(${inner.displayName})`
  return Outer
}

function useForceUpdate() {
  const [_, setX] = useState(0)
  const updater = useCallback(() => {
    setX(x => x + 1)
  }, [])
  return updater
}
