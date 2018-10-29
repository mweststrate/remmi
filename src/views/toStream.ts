import { Cursor, observableSymbol, IObservableStream, IStreamObserver, IStreamSubscription } from "../internal";

export function toStream<T>(lens: Cursor<T>): IObservableStream<T> {
    return {
        subscribe(observer: IStreamObserver<T> | ((value: T) => void)): IStreamSubscription {
            const unsubscribe = lens.subscribe(
                typeof observer === "function" ? observer : observer.next.bind(observer)
            )
            return {
                unsubscribe
            }
        },
        [observableSymbol()]() {
            return this
        }
    }
}
