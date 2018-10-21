import {Disposer, Handler, Transformer, fail, Lens} from "../internal"

export type IConnectionHandler<T = any> = (
    subscribeToStore: (callback: Handler<T>) => Disposer,
    writeToStore: (value: T) => void
) => (void | Disposer)

/**
 * connect can be used to setup a uni- or bidirectional connection with arbitrarily remote sources.
 *
 * When setting up a bi-directional connection, it makes sure that subscriptions are not superflously called during an update,
 * and that update is not superfluously called during a subscription. (For asynchronous processes
 * this might not be sufficient, in which case one might to keep some adminstration for that in the handler).
 *
 * @example
 * // This set's up a bidirectional sink between two remmi lenses
 * let disposer = store1.do(connect((subscribe, sink) => {
 *     subscribe(v => {
 *         store2.update(v)
 *     })
 *     return store2.subscribe(v => sink(v))
 * }))
 *
 * @example
 * // Find the stocks store and update it automatically from a websocket
 * const store$ = createStore({
 *   stocks: {}
 * });
 * store$.do(
 *   select("stocks"),
 *   connect((_, sink) => {
 *     // See: https://iextrading.com/developer/docs/#websockets
 *     const socket = socketIo("https://ws-api.iextrading.com/1.0/tops");
 *     socket.on("connect", () => {
 *       socket.emit("subscribe", "snap,fb,aig+,amd,amzn,ge,nke");
 *     });
 *     socket.on("message", data => {
 *       const message = JSON.parse(data);
 *       sink(stocks => {
 *         stocks[message.symbol] = message;
 *       });
 *     });
 *   })
 * );
 */
export function connect<T = any>(
    handler: IConnectionHandler<T>
): Transformer<T, Disposer | undefined>
export function connect(handler: IConnectionHandler<any>) {
    return (lens: Lens) => {
        let subscriptionDisposer: Disposer | undefined
        let isHandlingIncomingUpdate = false
        let isHandlingSubscription = false

        const handlerDisposer = handler(
            callback => {
                if (subscriptionDisposer)
                    return fail("connect: subscribeToStore was called already")
                subscriptionDisposer = lens.subscribe(v => {
                    if (!isHandlingIncomingUpdate) {
                        isHandlingSubscription = true
                        try {
                            callback(v) // avoid loopback!
                        } finally {
                            isHandlingSubscription = false
                        }
                    }
                })
                return subscriptionDisposer
            },
            updater => {
                if (isHandlingSubscription)
                    return
                isHandlingIncomingUpdate = true
                try {
                    lens.update(updater)
                } finally {
                    isHandlingIncomingUpdate = false
                }
            }
        )
        return () => {
            subscriptionDisposer && subscriptionDisposer()
            handlerDisposer && handlerDisposer()
        }
    }
}
