import { useRef, memo, useState, useContext, useMemo, useEffect } from "react"
import { hasChanges, track } from "./remmi"

////////////////////             REACT           ////////////////////////

/////////////////////////////////////////////////////////////////////////

// TODO: kill?
export function useSelector<A, B>(state: A, selector: (state: A) => B, hookDeps?: any[]): B {
  const currentValueAndDeps = useRef<{deps: Node, value: B}>()
  let needsRecompute = false
  if (!currentValueAndDeps.current)
      needsRecompute = true
  // TODO:
  // else if (hookDepsChanged)
  // needsRecompute = true
  else if (hasChanges(currentValueAndDeps.current!.deps, state))
      needsRecompute
  if (needsRecompute) {
      currentValueAndDeps.current = track(state, selector, true)
  }
  return currentValueAndDeps.current!.value
}

// TODO: extract version without a store
function connect(component) {
  return memo(function(props) {
      const [_, forceUpdate] = useState(0)
      const needsUpdate = useRef(true)
      const store  = useContext(storeContext)
      const lastProps = useRef(props)
      lastProps.current = props
      const dispatch = useMemo(() => a => store.dispatch(a), [store])
      const lastRendering = useRef(null)
      const lastDeps = useRef(null)
      const value = {
          store: store.getState(),
          props
      }


      if (!needsUpdate.current) {
          // props changed, check if we need changes
          if (hasChanges(lastDeps.current, value)) {
              needsUpdate.current = true
          }
      }
      if (needsUpdate.current) {
          const {value, deps} = track(value, (value, grab) => {
              return component(props, value, dispatch)
          })
          needsUpdate.current = false
          lastRendering.current = value
          lastDeps.current = deps
      }

      useEffect(() => {
          // TODO: a bit repetitive here...
          const value = {
              store: store.getState(),
              props: lastProps.current
          }
          if (hasChanges(lastDeps.current, value)) {
              needsUpdate.current = true
              // store has changed between the use effect and component initialization
              forceUpdate(x => x + 1)
          }
          return store.subscribe(store => {
              const value = {
                  store: store.getState(),
                  props: lastProps.current
              }
              if (hasChanges(lastDeps.current, value)) {
                  needsUpdate.current = true
                  forceUpdate(x => x + 1)
              }
          }
      }, [state])

      return lastRendering.current
  })

}

connect(storeContext, function myComponent(props, store, dispatch, pass) {
})
