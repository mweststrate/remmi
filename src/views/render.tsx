import * as React from "react"
import {Cursor, Tracker, Disposer, Transformer, all, KeyedLens} from "../internal"

class AutoRender extends React.PureComponent {
    tracker?: Tracker

    render() {
        if (!this.tracker) {
            this.tracker = new Tracker(() => {
                this.forceUpdate()
            })
        }
        return this.tracker.track(this.props.children as any)
    }

    componentWillUnmount() {
        if (this.tracker) this.tracker.dispose()
    }
}

class RenderLens<T, L extends Cursor<T>> extends React.PureComponent<{
    lens: L
    renderer: (value: T, lens: L) => React.ReactNode
}> {
    subscription?: Disposer

    onChange = () => {
        this.forceUpdate()
    }

    render() {
        return this.props.renderer(this.props.lens.value(), this.props.lens)
    }

    componentDidMount() {
        this.subscription = this.props.lens.subscribe(this.onChange)
    }

    componentDidUpdate(prevProps: any) {
        // lens changed
        if (prevProps.lens !== this.props.lens) {
            const prevSub = this.subscription!
            this.componentDidMount()
            prevSub() // clear previous listener after attaching new one
        }
    }

    componentWillUnmount() {
        this.subscription!()
    }
}

class RenderLenses<T> extends React.PureComponent<{
    lens: Cursor<T[]>
    renderer: (value: T, lens: KeyedLens<T>) => React.ReactNode
}> {
    itemRenderer = (lens: KeyedLens<T>) => {
        return (
            <RenderLens
                key={"" + lens.key}
                lens={lens}
                renderer={this.props.renderer}
            />
        )
    }

    allRenderer = (lenses: (KeyedLens<T>)[]) => {
        return <React.Fragment>{lenses.map(this.itemRenderer)}</React.Fragment>
    }

    render() {
        return (
            <RenderLens
                lens={this.props.lens.do(all)}
                renderer={this.allRenderer}
            />
        )
    }
}


/**
 * Given a function that produces a React component, autorun will automatically
 * cause a re-render once a cursor that was deferenced (using `.value()`) changes,
 * see also `autorun`
 *
 * @export
 * @example
 * function ArrowView({arrowC, boxesC}) {
 *     return autoRender(() => {
 *         const arrow = arrowC.value()
 *         const from = boxesC.select(arrow.from).value()
 *         const to = boxesC.select(arrow.to).value()
 *
 *         return <path className="arrow"
 *             d={`M${from.x} ${from.y} L${to.x} ${to.y}`}
 *         />
 *     })
 * }
 * @param {() => React.ReactNode} fn
 * @returns
 */
export function autoRender(fn: () => React.ReactNode) {
    return <AutoRender>{fn}</AutoRender>
}

// TODO: should only value be passed to the callback?
export function render<T>(
    renderer: (value: T, lens: Cursor<T>) => React.ReactNode
): Transformer<T, React.ReactElement<any>> {
    return (lens: Cursor<T>) => <RenderLens lens={lens} renderer={renderer} />
}

// TODO: should only lens be passed to the callback?
export function renderAll<T>(
    renderer: (value: T, lens: KeyedLens<T>) => React.ReactNode
): Transformer<Cursor<T[]>, React.ReactElement<any>>
export function renderAll<T>(
    renderer: (value: T, lens: KeyedLens<T>) => React.ReactNode
): Transformer<Cursor<{[key: string]: T}>, React.ReactElement<any>>
export function renderAll(
    renderer: (value: any, lens: KeyedLens<any>) => React.ReactNode
): any {
    return (lens: Cursor<any>) => <RenderLenses lens={lens} renderer={renderer} />
}

export function useCursor(cursor) {
    // utility function, so that we can first describe, and then use useState,
    // to avoid a cold read from the cursor
    function update(v) { setValue(v) }
    // subscribe to the cursor. Re-subscribe (and dispose old)
    // for earlier cursors
    React.useEffect(() => cursor.subscribe(update), [cursor])
    // grab initial value (only on first run)
    const [value, setValue] = React.useState(() => cursor.value())
    // return the value
    return value
}
