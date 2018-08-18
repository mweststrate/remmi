import * as React from "react"
import {Lens, Tracker, Disposer, Transformer, all, KeyedLens} from "../internal"

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

class RenderLens<T, L extends Lens<T>> extends React.PureComponent<{
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
    lens: Lens<T[]>
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

export function autoRender(fn: () => React.ReactNode) {
    return <AutoRender>{fn}</AutoRender>
}

export function render<T>(renderer: (value: T, lens: Lens<T>) => React.ReactNode): Transformer<T, React.ReactElement<any>> {
    return (lens: Lens<T>) => <RenderLens lens={lens} renderer={renderer} />
}

export function renderAll<T>(
    renderer: (value: T, lens: KeyedLens<T>) => React.ReactNode
): Transformer<Lens<T[]>, React.ReactElement<any>>
export function renderAll<T>(
    renderer: (value: T, lens: KeyedLens<T>) => React.ReactNode
): Transformer<Lens<{[key: string]: T}>, React.ReactElement<any>>
export function renderAll(renderer: (value: any, lens: KeyedLens<any>) => React.ReactNode): any {
    return (lens: Lens<any>) => <RenderLenses lens={lens} renderer={renderer} />
}
