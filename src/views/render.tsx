import * as React from "react"
import { Lens, Tracker, Disposer, Transformer, all } from "../internal";

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
        if (this.tracker)
            this.tracker.dispose()
    }
}

class RenderLens<T> extends React.PureComponent<{ lens: Lens<T>, renderer: (value: T, lens: Lens<T>) => React.ReactNode }> {
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

// TODO: fix all the typings! (or remove)
class RenderLenses<T> extends React.PureComponent<{ lens: Lens<T[]>, renderer: (value: T, lens: Lens<T>) => React.ReactNode }> {
    itemRenderer = (lens: Lens<T>) => {
        return <RenderLens key={(lens as any).key} lens={lens} renderer={this.props.renderer} />
    }

    allRenderer = (lenses: Lens<T>[]) => {
        return <React.Fragment>{lenses.map(this.itemRenderer)}</React.Fragment>
    }

    render() {
        return (
            <RenderLens lens={this.props.lens.do(all)} renderer={this.allRenderer as any}/>
        )
    }
}

export function autoRender(fn: () => React.ReactNode) {
    return React.createElement(AutoRender, {}, fn)
}

export function render<T>(renderer: (value: T) => React.ReactNode): Transformer<Lens<T>, React.ReactElement<any>>
export function render(renderer: (value: any) => React.ReactNode): any {
    // TODO: should accept oroginal lens as argument
    return function (lens: Lens) {
        return React.createElement(RenderLens, {
            lens,
            renderer
        })
    }
}

export function renderAll<T>(renderer: (value: T) => React.ReactNode): Transformer<Lens<T[]>, React.ReactElement<any>>
export function renderAll<T>(renderer: (value: T) => React.ReactNode): Transformer<Lens<{[key: string]: T}>, React.ReactElement<any>>
export function renderAll(renderer: (value: any) => React.ReactNode): any {
    // TODO: should accept key as argument?
    return function (lens: Lens) {
        return React.createElement(RenderLenses, {
            lens,
            renderer
        })
    }
}