import * as React from "react"
import { Lens, Tracker, Disposer } from "../internal";

export class AutoRender extends React.PureComponent {
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

export class RenderLens<T> extends React.PureComponent<{ lens: Lens<T>, renderer: (value: T, lens: Lens<T>) => React.ReactNode }> {
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

    componentDidUpdate(prevProps) {
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

export class RenderLenses extends React.PureComponent {
    itemRenderer = (lens) => {
        return <RenderLens key={lens.key} lens={lens} renderer={this.props.renderer} />
    }

    allRenderer = (lenses) => {
        return <React.Fragment>{lenses.map(this.itemRenderer)}</React.Fragment>
    }

    render() {
        return (
            <RenderLens lens={this.props.lens.all()} renderer={this.allRenderer}/>
        )
    }
}