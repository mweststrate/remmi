export interface IStreamObserver<T> {
    next(value: T): void
    error(error: any): void
    complete(): void
}

export interface IStreamSubscription {
    unsubscribe(): void
}

export function observableSymbol() {
    return (typeof Symbol === "function" && (Symbol as any).observable) || "@@observable"
}

export interface IObservableStream<T> {
    subscribe(observer: IStreamObserver<T>): IStreamSubscription
    subscribe(observer: (value: T) => void): IStreamSubscription
    //   [Symbol.observable](): IObservable;
}
