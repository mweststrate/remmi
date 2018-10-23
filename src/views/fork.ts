import {Updater, Lens, Transformer, createStore} from "../internal"

export interface IRecorder<T = any> {
    pause(): void
    resume(): void
    reset(): void
    replay(target: Lens<T>): void
}

export function fork<T>(
    recordActions: true
): Transformer<T, Lens<T> & IRecorder<T>>
export function fork<T>(recordActions?: false): Transformer<T, Lens<T>>
export function fork(recordActions = false) {
    return function(lens: Lens) {
        const fork = createStore(lens.value())
        if (!recordActions) return fork

        const recordedUpdates: Updater[] = []
        let recording = true

        return Object.assign(
            fork.transform({
                cacheKey: undefined, // no caching!
                description: "recorder(true)",
                onUpdate(updater, next) {
                    if (recording) recordedUpdates.push(updater)
                    next(updater as any)
                }
            }),
            {
                pause() {
                    recording = false
                },
                resume() {
                    recording = true
                },
                reset() {
                    recordedUpdates.splice(0)
                },
                /**
                 * Replays the recorded update onto the target
                 * This process is atomic; if one of the updaters throws an exception,
                 * the target will be unmodified
                 */
                replay(this: Lens, target: Lens = this) {
                    target.update((draft: any) => {
                        recordedUpdates.forEach(u => {
                            ;(u as any)(draft)
                        })
                    })
                }
            }
        )
    }
}
