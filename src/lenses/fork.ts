import { Pipe, Updater, Lens, Builder, asBuilder, createStore } from "../internal";

export interface IRecorder<T = any> {
    pause(): void
    resume(): void
    reset(): void
    replay(target: Lens<T>): void
}

// TODO: create interface?
class Recorder extends Pipe implements IRecorder {
    private readonly recordedUpdates: Updater[] = []
    private recording = true

    update(updater: any) {
        if (this.recording)
            this.recordedUpdates.push(updater)
        return super.update(updater)
    }

    pause() {
        this.recording = false
    }

    resume() {
        this.recording = true
    }

    reset() {
        this.recordedUpdates.splice(0)
    }

    /**
     * Replays the recorded update onto the target
     * This process is atomic; if one of the updaters throws an exception,
     * the target will be unmodified
     */
    replay(target: Lens) {
        target.update((draft: any) => {
            this.recordedUpdates.forEach(u => {
                // TODO: fix and normalise u
                (u as any)(draft)
            })
        })
    }

    getCacheKey() {
        return undefined; // no caching!
    }

    describe() {
        return this.base.describe() + ".recorder()"
    }
}

// TODO: change fork to be not a builder, but an api like merge
export function fork<T>(recordActions: true): Builder<T, Lens<T> & IRecorder<T>>
export function fork<T>(recordActions?: false): Builder<T, Lens<T>>
export function fork(recordActions = false) {
    return asBuilder(function(lens: Lens) {
        const fork = createStore(lens.value())
        if (recordActions)
            return new Recorder(fork)
        return fork
    })
}
