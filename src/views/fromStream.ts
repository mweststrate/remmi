import { Lens, IObservableStream, Transformer, Disposer } from "../internal";

export function fromStream<T>(stream: IObservableStream<T>): Transformer<T, Disposer> {
    return (lens: Lens<T>) => {
        const subscription = stream.subscribe(lens.update.bind(lens))
        return () => subscription.unsubscribe()
    }
}
